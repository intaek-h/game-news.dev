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
  static async testFunc(c: Context) {
    try {
      // const contentBlock = await chatPerplexity({
      //   message: [
      //     "You are an AI assistant trained to write a bullet point summary on a given news topic.",
      //     "The topic will be wrapped in a <topic> block:<topic>{NEWS TOPIC}</topic>.",
      //     // "Research the topic and write a 5 to 10 point summary.",
      //     "Each point must contain ONE short, easy-to-read, no-rhetoric sentence.",
      //     "If there's a room for a simple Table or a List, add it at the end of the bullet points for the readers.",
      //     // "Your citation must not be more than 10 sources.",
      //     "Here are the restrictions you MUST FOLLOW when replying: ",
      //     "1. A bullet point must start with a dash.",
      //     "2. The bullet points must be one depth max.",
      //     "3. Do not include any emoji in the output.",
      //     "4. Do not use markdown in the Title and Bullet Points.",
      //     "You MUST REPLY IN THE FOLLOWING FORMAT:{TITLE}\n\n{BULLET POINTS}\n\n{TABLE or LIST (this is optional)}.",
      //     "",
      //     "",
      //     "<topic>Death Stranding 2: ON THE BEACH pre-order trailer released</topic>",
      //   ].join(" "),
      // });

      const contentBlock = await ArticleService.writeArticles([
        "Death Stranding 2: ON THE BEACH pre-order trailer released",
      ]);

      return c.json(contentBlock);
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

      // only select hot topics from the last 5 days
      const hotTopicsLastFiveDays = await ArticleService
        .getHotTopicsLastFiveDays();

      const filteredTopicsStr = await ArticleService.filterRawTopics({
        rawTopics: topics,
        recentTopics: hotTopicsLastFiveDays,
      });

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

      const inspectedArticles = await ArticleService.finalArticleInspection(
        aiArticles.map((a) => a.reply),
      );

      if (!inspectedArticles || inspectedArticles.length === 0) {
        return c.json({ error: "Failed to inspect articles" }, 500);
      }

      const translatedArticles = await ArticleService.translateArticles(
        inspectedArticles,
      );

      const finalArticles = await db.insert(articles).values(
        inspectedArticles.filter((v) => typeof v === "string").map((a, i) => ({
          article: a,
          gid: genTime.id,
          createdAt: GEN_TIME,
          articleKor: translatedArticles[i],
          // citations: JSON.stringify(a.citations),
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
