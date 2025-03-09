import { db } from "~/db/client.ts";
import { articles } from "~/db/migrations/schema.ts";
import { eq } from "drizzle-orm";
import { RedditScrapingResult } from "~/src/models/redditScraper.ts";
import { chatAnthropic } from "~/src/utils/anthropic.ts";

const INTAEK_API_KEY = Deno.env.get("INTAEK_API_KEY");

export class ArticleService {
  // Get a single article by ID
  static async getArticleById(id: number) {
    const results = await db.select().from(articles).where(eq(articles.id, id));
    return results[0];
  }

  static scrapeRedditTopics = async () => {
    console.log("[...] Scraping Reddit Topics");
    const startTime = performance.now();

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
    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      "[...] Count of Total Scraped Topics: ",
      data.total_count,
      "\x1b[0m",
    );

    console.log(`[...] Scraping Took ${(endTime - startTime) / 1000}s`);

    return data;
  };

  static filterRawTopics = async (rawTopics: string[]) => {
    const startTime = performance.now();
    const contentBlock = await chatAnthropic({
      systemP:
        `You are an AI assistant trained to extract noteworthy and informative titles from a pile of titles scraped from the 'Gaming' subreddit.` +
        " " +
        `Your response MUST be formatted in the following format: ONLY return the extracted titles AS IT IS separated by new lines and NEVER say anything other than that.`,
      message: rawTopics.join("\n"),
    });

    const reply = contentBlock.find((c) => c.type === "text")?.text;
    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      "[...] AI Topic Filtering Finished.",
      "\x1b[0m",
    );

    console.log(
      `[...] AI Topic Filtering Took ${(endTime - startTime) / 1000}s`,
    );

    return reply ?? "";
  };
}
