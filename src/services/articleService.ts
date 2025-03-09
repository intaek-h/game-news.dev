import { db } from "~/db/client.ts";
import { articles } from "~/db/migrations/schema.ts";
import { eq } from "drizzle-orm";
import { RedditScrapingResult } from "~/src/models/redditScraper.ts";
import { chatAnthropic } from "~/src/utils/anthropic.ts";
import { chatPerplexity } from "~/src/utils/perplexity.ts";

const INTAEK_API_KEY = Deno.env.get("INTAEK_API_KEY");

export class ArticleService {
  // Get a single article by ID
  static async getArticleById(id: number) {
    const results = await db.select().from(articles).where(eq(articles.id, id));
    return results[0];
  }

  static scrapeRedditTopics = async () => {
    const startTime = performance.now();

    const urlParams = new URLSearchParams();
    urlParams.append("subreddits", "gaming,Games,IndieGaming,pcgaming");
    urlParams.append("limit", "3");
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
      `[...] Raw Topic Scraping Finished${(data.total_count)}.`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return data;
  };

  static filterRawTopics = async (rawTopics: string[]) => {
    const startTime = performance.now();
    const contentBlock = await chatAnthropic({
      systemP: [
        "You are an AI assistant trained to identify clusters of trending topics in the gaming world right now.",
        "Extract the noteworthy and informative topics from the given pile of text data.",
        "Remember data is collected from the recently published news articles, hot reddit posts, and hot youtube video titles.",
        "Your response MUST be formatted in the following format: ONLY return the extracted topics separated by new lines and NEVER say anything other than that.",
      ].join(" "),
      message: rawTopics.join("\n"),
    });

    const reply = contentBlock.find((c) => c.type === "text")?.text;
    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      "[...] AI Topic Filtering Finished.",
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return reply ?? "";
  };

  static writeArticles = async (topics: string[]) => {
    const startTime = performance.now();

    const prompt = (topic: string) =>
      [
        `Write an article on "${topic}".`,
        "The article should not be longer than 1 paragraph and the paragraph should contain short, easy-to-read, no-rhetoric sentences. ",
        "On top of the article, write an punchy, reddit-style title. ",
        "The title should not be longer than 10 words and should be written in a 6th-grade reading level. ",
        "Think carefully on what to contain. If there's a room for a table or an ordered/unordered list, please add it at the end of the article for the readers. ",
        "You MUST REPLY IN THE FOLLOWING FORMAT: ",
        "{HEADLINE}\n\n{PARAGRAPH}\n\n{TABLE/LIST (this is optional)}. ",
        "IGNORE the the curly braces in the format. Replace the placeholders with your content.",
      ].join(" ");

    const articlePromise = topics.map((t) =>
      chatPerplexity({ message: prompt(t) })
    );
    const articles = await Promise.all(articlePromise);

    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      "[...] AI Article Writing Finished.",
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return articles.filter((a) => !!a);
  };
}
