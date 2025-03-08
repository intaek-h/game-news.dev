import { db } from "~/db/client.ts";
import { articles } from "~/db/migrations/schema.ts";
import { eq } from "drizzle-orm";
import { RedditScrapingResult } from "~/src/models/redditScraper.ts";

const INTAEK_API_KEY = Deno.env.get("INTAEK_API_KEY");

export class ArticleService {
  // Get a single article by ID
  static async getArticleById(id: number) {
    const results = await db.select().from(articles).where(eq(articles.id, id));
    return results[0];
  }

  static scrapeRedditTopics = async () => {
    console.log("[...] Scraping Reddit topics");

    const urlParams = new URLSearchParams();
    urlParams.append("subreddits", "gaming,Games,IndieGaming,pcgaming");
    urlParams.append("limit", "30");
    urlParams.append("min_score", "3");
    urlParams.append("time_window", "86400");
    const response = await fetch(
      `https://subreddit-scraper-production.up.railway.app/api/topics?${urlParams}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": INTAEK_API_KEY ?? "",
        },
      },
    );

    const data = await response.json() as RedditScrapingResult;
    console.log("[...] data", data);
    return data;
  };
}
