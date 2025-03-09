import { Context } from "@hono/hono";
import { ArticleService } from "~/src/services/articleService.ts";
import { db } from "~/db/client.ts";
import {
  articles,
  genTimes,
  hotTopics,
  rawTopics,
} from "~/db/migrations/schema.ts";

export class ArticleController {
  // Get article by ID
  static async getById(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      if (isNaN(id)) {
        return c.json({ error: "Invalid ID" }, 400);
      }

      const article = await ArticleService.getArticleById(id);
      if (!article) {
        return c.json({ error: "Article not found" }, 404);
      }

      return c.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      return c.json({ error: "Failed to fetch article" }, 500);
    }
  }

  // Generate articles
  static async generateArticles(c: Context) {
    try {
      const redditTopics = await ArticleService.scrapeRedditTopics();

      if (!redditTopics || redditTopics.total_count === 0) {
        return c.json({ error: "No articles found" }, 404);
      }

      const topics = Object.values(redditTopics.topics).flat();

      const GEN_TIME = new Date().toISOString();

      const [genTime] = await db.insert(genTimes).values({
        time: GEN_TIME,
        createdAt: GEN_TIME,
      }).returning({ id: genTimes.id });

      if (!genTime?.id) {
        return c.json({ error: "Failed to insert generation time" }, 500);
      }

      const [insertedRawTopics] = await db.insert(rawTopics).values({
        topics: JSON.stringify(topics),
        gid: genTime.id,
        createdAt: GEN_TIME,
      }).returning({ id: rawTopics.id });

      if (!insertedRawTopics?.id) {
        return c.json({ error: "Failed to insert articles" }, 500);
      }

      const filteredTopicsStr = await ArticleService.filterRawTopics(topics);

      if (!filteredTopicsStr) {
        return c.json({ error: "Failed to filter raw topics" }, 500);
      }

      const filteredTopics = filteredTopicsStr.split("\n");

      const [insertedHotTopics] = await db.insert(hotTopics).values({
        topics: JSON.stringify(filteredTopics),
        gid: genTime.id,
        createdAt: GEN_TIME,
      }).returning({ id: hotTopics.id });

      if (!insertedHotTopics?.id) {
        return c.json({ error: "Failed to insert hot topics" }, 500);
      }

      const aiArticles = await ArticleService.writeArticles(filteredTopics);

      if (!aiArticles || aiArticles.length === 0) {
        return c.json({ error: "Failed to write articles" }, 500);
      }

      const finalArticles = await db.insert(articles).values(
        aiArticles.map((a) => ({
          article: a.reply,
          gid: genTime.id,
          createdAt: GEN_TIME,
          citations: JSON.stringify(a.citations),
        })),
      ).returning({ article: articles.article, id: articles.id });

      if (!finalArticles || finalArticles.length === 0) {
        return c.json({ error: "Failed to insert articles" }, 500);
      }

      return c.json(finalArticles);
    } catch (error) {
      console.error("Error generating articles:", error);
      return c.json({ error: "Failed to generate articles" }, 500);
    }
  }
}
