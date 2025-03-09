import { Context } from "@hono/hono";
import { ArticleService } from "~/src/services/articleService.ts";
import { db } from "~/db/client.ts";
import { rawTopics } from "~/db/migrations/schema.ts";

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
    const GEN_TIME = new Date().toISOString();

    try {
      const redditTopics = await ArticleService.scrapeRedditTopics();

      if (!redditTopics || redditTopics.total_count === 0) {
        return c.json({ error: "No articles found" }, 404);
      }

      const topics = Object.values(redditTopics.topics).flat();

      const insertedRawTopics = await db.insert(rawTopics).values({
        topics: JSON.stringify(topics),
        genTime: GEN_TIME,
        createdAt: GEN_TIME,
      }).returning({ insertedId: rawTopics.id });

      if (!insertedRawTopics[0]?.insertedId) {
        return c.json({ error: "Failed to insert articles" }, 500);
      }

      const filteredTopics = await ArticleService.filterRawTopics(topics);

      if (!filteredTopics) {
        return c.json({ error: "Failed to filter raw topics" }, 500);
      }

      return c.json(filteredTopics);
    } catch (error) {
      console.error("Error generating articles:", error);
      return c.json({ error: "Failed to generate articles" }, 500);
    }
  }
}
