import { db } from "~/db/client.ts";
import {
  articles,
  genTimes,
  hotTopics,
  languages,
  rawTopics,
  translations,
} from "~/db/migrations/schema.ts";
import { kv } from "~/kv.ts";
import { ArticleFormat } from "~/types/articleFormat.ts";
import { ScrapeAtom } from "~/jobs/atoms/scrape.ts";
import { ArticleAtom } from "~/jobs/atoms/article.ts";
import { ArticleAiAtom } from "~/jobs/atoms/article-ai.ts";

export class ArticleCompound {
  static async EnqueueHotTopics(): Promise<
    { message: string; statusCode: number; data?: unknown }
  > {
    try {
      const redditTopics = await ScrapeAtom.ScrapeRedditTopics();

      if (!redditTopics || redditTopics.total_count === 0) {
        return { message: "No articles found", statusCode: 404 };
      }

      const topics = Object.values(redditTopics.topics).flat();

      const GEN_TIME = new Date().toISOString();

      const [genTime] = await db.insert(genTimes).values({
        time: GEN_TIME,
        createdAt: GEN_TIME,
      }).returning({ id: genTimes.id });

      if (!genTime?.id) {
        return { message: "Failed to insert generation time", statusCode: 500 };
      }

      const [insertedRawTopics] = await db.insert(rawTopics).values({
        topics: JSON.stringify(topics),
        gid: genTime.id,
        createdAt: GEN_TIME,
      }).returning({ id: rawTopics.id });

      if (!insertedRawTopics?.id) {
        return { message: "Failed to insert articles", statusCode: 500 };
      }

      // only select hot topics from the last 5 days
      const hotTopicsLastFiveDays = await ArticleAtom
        .GetHotTopicsLastFiveDays();

      const filteredTopicsStr = await ArticleAiAtom.FilterHotTopics({
        rawTopics: topics,
        recentTopics: hotTopicsLastFiveDays,
      });

      if (!filteredTopicsStr) {
        return { message: "Failed to filter raw topics", statusCode: 500 };
      }

      const filteredTopics = filteredTopicsStr.split("\n");

      const [insertedHotTopics] = await db.insert(hotTopics).values({
        topics: JSON.stringify(filteredTopics),
        gid: genTime.id,
        createdAt: GEN_TIME,
      }).returning({ id: hotTopics.id });

      if (!insertedHotTopics?.id) {
        return { message: "Failed to insert hot topics", statusCode: 500 };
      }

      let hotTopicsCount = 0;
      for await (const topic of filteredTopics) {
        hotTopicsCount++;
        // @ts-expect-error: See kv.ts
        await kv.enqueue(["hot-topic", { topic: topic, gid: genTime.id }], {
          delay: (1000 * 70) * (Math.floor(hotTopicsCount / 3) + 1),
        });
      }

      return {
        message: "Articles Generation Job Queued",
        statusCode: 200,
        data: insertedHotTopics,
      };
    } catch (error) {
      console.error("Error generating articles:", error);
      return { message: "Failed to generate articles", statusCode: 500 };
    }
  }

  static async WriteArticles(p: { topic: string; gid: number }) {
    const { topic, gid } = p;

    const [aiArticle] = await ArticleAiAtom.WriteArticles([topic]);

    if (!aiArticle) {
      return console.error("Failed to write articles");
    }

    const [inspectedArticle] = await ArticleAiAtom.InspectArticle(
      [aiArticle.reply],
    );

    if (!inspectedArticle) {
      return console.error("Failed to inspect articles");
    }

    const entities = await ArticleAiAtom.ExtractEntities(
      inspectedArticle,
    );

    const [translatedArticle] = await ArticleAiAtom.TranslateArticles(
      [inspectedArticle],
    );

    const [caconicalArticle] = await db.insert(articles).values({
      gid: gid,
      citations: aiArticle.citations,
      entities: entities,
      createdAt: new Date().toISOString(),
    }).returning({ id: articles.id });

    const languageCodes = await db.select().from(languages).all();

    const result = await db
      .insert(translations)
      .values([
        {
          articleId: caconicalArticle.id,
          article: JSON.parse(translatedArticle) as unknown as ArticleFormat,
          createdAt: new Date().toISOString(),
          languageCode: languageCodes.find((l) => l.name === "korean")?.code!,
        },
        {
          articleId: caconicalArticle.id,
          article: JSON.parse(inspectedArticle) as unknown as ArticleFormat,
          createdAt: new Date().toISOString(),
          languageCode: languageCodes.find((l) => l.name === "english")?.code!,
        },
      ]).returning({
        articleId: translations.articleId,
        translationId: translations.id,
        languageCode: translations.languageCode,
      });

    return result;
  }
}
