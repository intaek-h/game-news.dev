import { RedditScrapingResult } from "~/types/redditScraper.ts";

const INTAEK_API_KEY = Deno.env.get("INTAEK_API_KEY");

export class ScrapeAtom {
  static ScrapeRedditTopics = async () => {
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
      `[...] Raw Topic Scraping Finished (${data.total_count}).`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return data;
  };
}
