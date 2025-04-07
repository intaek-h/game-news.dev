import { err, ok, ResultAsync } from "neverthrow";
import type { RedditScrapingResult } from "~/types/redditScraper.ts";
import { db } from "~/db/client.ts";
import { genTimes, hotTopics, rawTopics } from "~/db/migrations/schema.ts";
import { addDays, startOfDay } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import { gte } from "drizzle-orm";
import { chatAnthropicSonnet2 } from "~/jobs/utils/anthropic.ts";
import { FileUtilities } from "~/jobs/utils/file.ts";

const INTAEK_API_KEY = Deno.env.get("INTAEK_API_KEY");

export class DailyGossip {
  static ScrapeRedditTopics = () => {
    const urlParams = new URLSearchParams();

    urlParams.append("subreddits", "gaming,Games,IndieGaming,pcgaming");
    urlParams.append("limit", "30");
    urlParams.append("min_score", "3");
    urlParams.append("time_window", "86400");

    return ResultAsync
      .fromPromise(
        fetch(`https://subreddit-scraper-production.up.railway.app/api/topics?${urlParams}`, {
          method: "GET",
          headers: { "X-API-KEY": INTAEK_API_KEY ?? "" },
        }),
        (err) => ({ err, message: "Failed to fetch Reddit topics" }),
      ).andThen((response) =>
        ResultAsync.fromPromise<RedditScrapingResult, { err: unknown; message: string }>(
          response.json(),
          (err) => ({ err, message: "Failed to parse Reddit topics" }),
        )
      );
  };

  static GetRecentGossips = () => {
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
      .andThen((chatResponse) => {
        const informativeTopics = chatResponse.find((c) => c.type === "text")?.text;

        if (!informativeTopics) {
          return err({ err: null, message: "Failed to extract informative topics" });
        }

        return ok(informativeTopics);
      });
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
    }).andThen((chatResponse) => {
      const deduplicatedTopics = chatResponse.find((c) => c.type === "text")?.text;

      if (!deduplicatedTopics) {
        return err({ err: null, message: "Failed to extract deduplicated topics" });
      }

      return ok(deduplicatedTopics);
    });
  };

  static GossipPipeline = () => {
    this.ScrapeRedditTopics()
      .map((data) => {
        const topics = Object.values(data.topics).flat();
        const GEN_TIME = new Date().toISOString();
        return { trendingTopics: topics, genTimeISOString: GEN_TIME };
      })
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
        this.GetRecentGossips().map((recentGossips) => ({
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
      .andThen(({ genTimeId, informativeTopics, recentGossips }) =>
        this.RemoveDuplicateTopics({
          topicPool: recentGossips.filter((t) => !!t.topics).map((t) => t.topics!),
          candidateTopics: informativeTopics,
        }).map((deduplicatedTopics) => ({
          deduplicatedTopics: deduplicatedTopics.split("\n"),
          genTimeId,
        }))
      );
    // .andThen(({ deduplicatedTopics, genTimeId }) => {
    //   let hotTopicsCount = 0;
    //   for  (const topic of deduplicatedTopics) {
    //     hotTopicsCount++;
    //     // @ts-ignore: See kv.ts
    //      kv.enqueue(["hot-topic", { topic: topic, gid: genTime.id }], {
    //       delay: (1000 * 70) * (Math.floor(hotTopicsCount / 3) + 1),
    //     });
    //   }
    // });
  };
}
