import { ArticleService } from "~/src/services/articleService.ts";
import { db } from "~/db/client.ts";
import { genTimes, hotTopics, rawTopics } from "~/db/migrations/schema.ts";
import { kv } from "~/kv.ts";

export class ArticleController {
  static async generateArticles(): Promise<
    { message: string; statusCode: number; data?: unknown }
  > {
    try {
      const redditTopics = await ArticleService.scrapeRedditTopics();

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
      const hotTopicsLastFiveDays = await ArticleService
        .getHotTopicsLastFiveDays();

      const filteredTopicsStr = await ArticleService.filterRawTopics({
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
        await kv.enqueue(["hot-topic", { topic: topic, gid: genTime.id }], {
          delay: (1000 * 70) * (Math.floor(hotTopicsCount / 3) + 1),
        });
      }

      return {
        message: "Articles Generation Job Queued",
        statusCode: 200,
        data: insertedHotTopics,
      };

      // const aiArticles = await ArticleService.writeArticles(filteredTopics);

      // if (!aiArticles || aiArticles.length === 0) {
      //   return c.json({ error: "Failed to write articles" }, 500);
      // }

      // const inspectedArticles = await ArticleService.finalArticleInspection(
      //   aiArticles.map((a) => a.reply),
      // );

      // if (!inspectedArticles || inspectedArticles.length === 0) {
      //   return c.json({ error: "Failed to inspect articles" }, 500);
      // }

      // const translatedArticles = await ArticleService.translateArticles(
      //   inspectedArticles,
      // );

      // const finalArticles = await db.insert(articles).values(
      //   inspectedArticles.filter((v) => typeof v === "string").map((a, i) => ({
      //     article: a,
      //     gid: genTime.id,
      //     createdAt: GEN_TIME,
      //     articleKor: translatedArticles[i],
      //   })),
      // ).returning({ article: articles.article, id: articles.id });

      // if (!finalArticles || finalArticles.length === 0) {
      //   return c.json({ error: "Failed to insert articles" }, 500);
      // }

      // return c.json(finalArticles);
    } catch (error) {
      console.error("Error generating articles:", error);
      return { message: "Failed to generate articles", statusCode: 500 };
    }
  }
}
