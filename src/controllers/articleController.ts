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
    const genTime = new Date().toISOString();

    try {
      const redditTopics = await ArticleService.scrapeRedditTopics();

      if (!redditTopics || redditTopics.total_count === 0) {
        return c.json({ error: "No articles found" }, 404);
      }

      const topics = Object.values(redditTopics.topics).flat();

      const inserted = await db.insert(rawTopics).values({
        topics: JSON.stringify(topics),
        genTime,
        createdAt: genTime,
      }).returning({ insertedId: rawTopics.id });

      if (!inserted[0]?.insertedId) {
        return c.json({ error: "Failed to insert articles" }, 500);
      }

      return c.json(redditTopics);
    } catch (error) {
      console.error("Error generating articles:", error);
      return c.json({ error: "Failed to generate articles" }, 500);
    }
  }
}
