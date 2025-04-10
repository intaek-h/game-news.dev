import { err, errAsync, ResultAsync } from "neverthrow";
import type { RedditScrapingResult } from "~/types/redditScraper.ts";
import { db } from "~/db/client.ts";
import { genTimes, gossips, hotTopics, languages, rawTopics, translations } from "~/db/migrations/schema.ts";
import { addDays, startOfDay } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import { gte } from "drizzle-orm";
import { chatAnthropicHaiku2, chatAnthropicSonnet2 } from "~/jobs/utils/anthropic.ts";
import { FileUtilities } from "~/jobs/utils/file.ts";
import { kv } from "~/kv.ts";
import { logg } from "~/jobs/logger/index.ts";
import { chatPerplexity2 } from "~/jobs/utils/perplexity.ts";
import { unstableJsonParser } from "~/jobs/utils/json.ts";
import { ArticleEntities, ArticleFormat } from "~/types/articleFormat.ts";

const INTAEK_API_KEY = Deno.env.get("INTAEK_API_KEY");

export class DailyGossip {
  static ScrapeRedditTopics = () => {
    const urlParams = new URLSearchParams();

    urlParams.append("subreddits", "gaming,Games,IndieGaming,pcgaming");
    urlParams.append("limit", "3");
    urlParams.append("min_score", "3");
    urlParams.append("time_window", "86400");

    return ResultAsync
      .fromPromise(
        fetch(`https://subreddit-scraper-production.up.railway.app/api/topics?${urlParams}`, {
          method: "GET",
          headers: { "X-API-KEY": INTAEK_API_KEY ?? "" },
        }),
        (err) => ({ err, message: "Failed to fetch Reddit topics" }),
      )
      .andThen((response) =>
        ResultAsync.fromPromise<RedditScrapingResult, { err: unknown; message: string }>(
          response.json(),
          (err) => ({ err, message: "Failed to parse Reddit topics" }),
        )
      );
  };

  static GetRecentGossipsFromDB = () => {
    const fiveDaysAgo = addDays(startOfDay(new UTCDate()), -5);
    return ResultAsync.fromPromise(
      db.select().from(hotTopics).where(
        gte(hotTopics.createdAt, fiveDaysAgo.toISOString()),
      ),
      (err) => ({ err, message: "Failed to fetch recent gossips" }),
    );
  };

  static SelectInformativeTopics = ({ rawTopics }: { rawTopics: string[] }) => {
    const prompt = FileUtilities.ReadFileSafeSync("/jobs/system-prompts/hot-gaming-topic-evaluation.txt");

    if (prompt.isErr()) {
      return err(prompt.error);
    }

    return chatAnthropicSonnet2({ systemP: prompt.value, message: rawTopics.join("\n") })
      .map((chatResponse) => chatResponse.find((c) => c.type === "text")?.text ?? "");
  };

  static RemoveDuplicateTopics = ({ candidateTopics, topicPool }: { topicPool: string[]; candidateTopics: string }) => {
    const prompt = FileUtilities.ReadFileSafeSync("/jobs/system-prompts/topic-deduplication.txt");

    if (prompt.isErr()) {
      return err(prompt.error);
    }

    return chatAnthropicSonnet2({
      systemP: prompt.value,
      message: [
        `<Recent Topics>\n${topicPool.join("\n")}\n</Recent Topics>`,
        `<New Topics>\n${candidateTopics}</New Topics>`,
      ].join("\n\n"),
    }).map((chatResponse) => chatResponse.find((c) => c.type === "text")?.text ?? "");
  };

  static GossipPipeline = () => {
    this.ScrapeRedditTopics()
      .map((data) => {
        const topics = Object.values(data.topics).flat();
        const GEN_TIME = new Date().toISOString();
        return { trendingTopics: topics, genTimeISOString: GEN_TIME };
      })
      .andThen((data) =>
        logg.DiscordAlert({ title: `가십 파이프라인 (스크래핑 완료 - ${data.trendingTopics.length}개)` })
          .map(() => data)
      )
      .andThen(({ genTimeISOString, trendingTopics }) =>
        ResultAsync.fromPromise(
          db.insert(genTimes)
            .values({ time: genTimeISOString, createdAt: genTimeISOString })
            .returning({ id: genTimes.id }),
          (err) => ({ err, message: "Failed to insert generation time" }),
        ).map(([{ id }]) => ({ genTimeId: id, trendingTopics }))
      )
      .andThen(({ genTimeId, trendingTopics }) =>
        ResultAsync.fromPromise(
          db.insert(rawTopics)
            .values({
              topics: JSON.stringify(trendingTopics),
              gid: genTimeId,
              createdAt: new Date().toISOString(),
            })
            .execute(),
          (err) => ({ err, message: "Failed to insert articles" }),
        )
          .map(() => ({ genTimeId, trendingTopics }))
      )
      .andThen(({ genTimeId, trendingTopics }) =>
        this.GetRecentGossipsFromDB().map((recentGossips) => ({
          genTimeId,
          trendingTopics,
          recentGossips,
        }))
      )
      .andThen(({ genTimeId, recentGossips, trendingTopics }) =>
        this.SelectInformativeTopics({ rawTopics: trendingTopics }).map((informativeTopics) => ({
          genTimeId,
          recentGossips,
          informativeTopics,
        }))
      )
      .andThen((data) =>
        logg.DiscordAlert({
          title: `가십 파이프라인 (기삿거리 선별 완료 - ${data.informativeTopics.split("\n").length}개)`,
          code: data.informativeTopics,
        })
          .map(() => data)
      )
      .andThen(({ genTimeId, informativeTopics, recentGossips }) =>
        this.RemoveDuplicateTopics({
          topicPool: recentGossips.filter((t) => !!t.topics).map((t) => t.topics!),
          candidateTopics: informativeTopics,
        }).map((deduplicatedTopics) => ({
          deduplicatedTopics: deduplicatedTopics?.split("\n") ?? [],
          genTimeId,
        }))
      )
      .andThen((data) =>
        logg.DiscordAlert({
          title: `가십 파이프라인 (기삿거리 중복 제거 완료 - ${data.deduplicatedTopics.length}개)`,
          code: data.deduplicatedTopics.join("\n"),
        })
          .map(() => data)
      )
      .andThen((data) =>
        logg.DiscordAlert({
          title: "가십 파이프라인 (기사 작성 스케줄러 가동중)",
          level: "success",
        })
          .map(() => data)
      )
      .map(({ deduplicatedTopics, genTimeId }) => {
        let hotTopicsCount = 0;
        for (const topic of deduplicatedTopics) {
          hotTopicsCount++;
          // @ts-ignore: See kv.ts
          kv.enqueue(["hot-topic", { topic: topic, gid: genTimeId }], {
            delay: (1000 * 70) * (Math.floor(hotTopicsCount / 3) + 1),
          });
        }
      })
      .mapErr((err) => {
        console.error("가십 파이프라인 에러:", err);
        logg.DiscordAlert({
          title: "가십 파이프라인 (폭파됨)",
          code: err.message,
          level: "error",
        });
      });
  };

  static WriteEnglishSummary = (topic: string) => {
    const prompt = FileUtilities.ReadFileSafeSync("/jobs/system-prompts/english-article-generation.txt");

    if (prompt.isErr()) {
      return errAsync(prompt.error);
    }

    return chatPerplexity2({ systemP: prompt.value, message: topic });
  };

  static InspectSummary = (summary: string) => {
    const prompt = FileUtilities.ReadFileSafeSync("/jobs/system-prompts/final-article-inspection.txt");

    if (prompt.isErr()) {
      return errAsync(prompt.error);
    }

    return chatAnthropicSonnet2({ systemP: prompt.value, message: summary }).map((data) => {
      const result = data.find((c) => c.type === "text")?.text ?? "";

      if (result.trim() === "<fail>") {
        new Error("Failed to inspect summary");
      }

      let parsed = unstableJsonParser<ArticleFormat>({ maybeJson: result });

      if (!parsed) {
        new Error("Failed to parse summary");
      }
      if (Array.isArray(parsed)) {
        parsed = parsed[0];
      }

      return JSON.stringify(parsed);
    });
  };

  static TranslateIntoKorean = (summary: string) => {
    const prompt = FileUtilities.ReadFileSafeSync("/jobs/system-prompts/english-to-korean-article-translation.txt");

    if (prompt.isErr()) {
      return errAsync(prompt.error);
    }

    return chatAnthropicSonnet2({ systemP: prompt.value, message: summary }).map((data) => {
      const result = data.find((c) => c.type === "text")?.text ?? "";

      if (result.trim() === "<fail>") {
        new Error("Failed to inspect summary");
      }

      let parsed = unstableJsonParser<ArticleFormat>({ maybeJson: result });
      if (!parsed) {
        new Error("Failed to parse summary");
      }
      if (Array.isArray(parsed)) {
        parsed = parsed[0];
      }

      return JSON.stringify(parsed);
    });
  };

  static ExtractEntities = (summary: string) => {
    const prompt = FileUtilities.ReadFileSafeSync("/jobs/system-prompts/article-entity-extraction.txt");

    if (prompt.isErr()) {
      return errAsync(prompt.error);
    }

    return chatAnthropicHaiku2({ systemP: prompt.value, message: summary }).map((data) => {
      const reply = data.find((c) => c.type === "text")?.text;

      let entities = unstableJsonParser<ArticleEntities>({
        maybeJson: reply ?? "",
      });
      if (!entities) {
        return;
      }
      if (Array.isArray(entities)) {
        entities = entities[0];
      }

      if (
        !entities ||
        (
          entities.companies.length === 0 &&
          entities.people.length === 0 &&
          entities.products.length === 0
        )
      ) {
        return;
      }

      return entities;
    });
  };

  static GossipPipeLineComplete = ({ topic, gid }: { topic: string; gid: number }) => {
    return this.WriteEnglishSummary(topic).map((data) => ({
      summary: data,
      gid,
    }))
      .andThen((data) =>
        this.InspectSummary(data.summary.reply).map((inspectResult) => ({
          summary: inspectResult,
          citations: data.summary.citations,
          gid,
        }))
      )
      .andThen((data) =>
        this.ExtractEntities(data.summary).map((entities) => ({
          summary: data.summary,
          citations: data.citations,
          entities,
          gid: data.gid,
        }))
      )
      .andThen((data) =>
        this.TranslateIntoKorean(data.summary).map((summaryKor) => ({
          summary: data.summary,
          entities: data.entities,
          citations: data.citations,
          gid: data.gid,
          koreanSummary: summaryKor,
        }))
      )
      .andThen((data) =>
        ResultAsync.fromPromise(
          db.insert(gossips).values({
            gid: gid,
            citations: data.citations,
            entities: data.entities,
            createdAt: new Date().toISOString(),
          }).returning({ id: gossips.id }),
          (err) => ({ err, message: "Failed to insert gossips" }),
        ).map(([{ id }]) => ({
          ...data,
          gossipId: id,
        }))
      )
      .andThen((data) =>
        ResultAsync.fromPromise(
          db.select().from(languages).all(),
          (err) => ({ err, message: "Failed to fetch languages" }),
        ).map((languages) => ({
          ...data,
          languages,
        }))
      )
      .andThen((data) =>
        ResultAsync.fromPromise(
          db
            .insert(translations)
            .values([
              {
                gossipId: data.gossipId,
                article: JSON.parse(data.koreanSummary) as unknown as ArticleFormat,
                createdAt: new Date().toISOString(),
                languageCode: data.languages.find((l) => l.name === "korean")?.code!,
              },
              {
                gossipId: data.gossipId,
                article: JSON.parse(data.summary) as unknown as ArticleFormat,
                createdAt: new Date().toISOString(),
                languageCode: data.languages.find((l) => l.name === "english")?.code!,
              },
            ])
            .returning({
              articleId: translations.gossipId,
              translationId: translations.id,
              languageCode: translations.languageCode,
            }),
          (err) => ({ err, message: "Failed to insert translations" }),
        )
      );
  };
}
