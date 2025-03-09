import { db } from "~/db/client.ts";
import { articles, hotTopics } from "~/db/migrations/schema.ts";
import { desc, eq, gte } from "drizzle-orm";
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
      `[...] Raw Topic Scraping Finished (${data.total_count}).`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return data;
  };

  static filterRawTopics = async (
    d: { rawTopics: string[]; recentTopics: string[] },
  ) => {
    const { rawTopics, recentTopics } = d;
    const startTime = performance.now();

    const informativeTopics = await chatAnthropic({
      systemP: [
        "You are an AI assistant trained to identify clusters of trending topics in the gaming world right now.",
        "Extract the noteworthy and informative topics from the given pile of text data.",
        "Remember data is collected from the recently published news articles, hot reddit posts, and hot youtube video titles.",
        "Your response MUST be formatted in the following format: ONLY return the extracted topics separated by new lines and NEVER say anything other than that.",
      ].join(" "),
      message: rawTopics.join("\n"),
    });

    const informativeTopicText = informativeTopics.find((c) =>
      c.type === "text"
    )?.text;

    if (!informativeTopicText) {
      return "";
    }

    if (!recentTopics.length) {
      return informativeTopicText;
    }

    const deduplicatedTopics = await chatAnthropic({
      systemP: [
        "You are an AI assistant trained to filter duplicate topics before writing articles.",
        'You will be given the "Recent Article Topics" and "New Topics" to write articles about.',
        "Both will be wrapped in <Recent Topics>, <New Topics> block, and each topic will be separated by new line(\n).",
        `For each topic of "New Topics", you must check if it's a duplicate of one of "Recent Article Topics".`,
        'If duplicate, remove it from the "New Topics"',
        'As result, you MUST ONLY RETURN THE "New Topics", WITHOUT DUPLICATES, WITHOUT BLOCK TAGS, JUST THE TOPICS, AS IT IS.',
      ].join(" "),
      message: [
        `<Recent Topics>\n${recentTopics.join("\n")}\n</Recent Topics>`,
        `<New Topics>\n${informativeTopicText}</New Topics>`,
      ].join("\n\n"),
    });

    const deduplicatedTopicText = deduplicatedTopics.find((c) =>
      c.type === "text"
    )?.text;

    if (!deduplicatedTopicText) {
      return "";
    }

    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      `[...] AI Topic Filtering Finished (${
        deduplicatedTopicText.split("\n").length
      }).`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return deduplicatedTopicText ?? "";
  };

  static writeArticles = async (topics: string[]) => {
    const startTime = performance.now();

    const prompt = (topic: string) =>
      [
        `Write an article on "${topic}".`,
        "The article should not be longer than 1 paragraph and the paragraph should contain short, easy-to-read, no-rhetoric sentences.",
        "On top of the article, write an punchy, reddit-style title.",
        "The title should not be longer than 10 words and should be written in a 6th-grade reading level.",
        "Think carefully on what to contain. If there's a room for a table or an ordered/unordered list, please add it at the end of the article for the readers.",
        "You MUST REPLY IN THE FOLLOWING FORMAT: ",
        "{HEADLINE}\n\n{PARAGRAPH}\n\n{TABLE/LIST (this is optional)}.",
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

  static async getHotTopicsLastFiveDays() {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const topics = await db.select().from(hotTopics).where(
      gte(hotTopics.createdAt, fiveDaysAgo.toISOString()),
    );

    const strs: string[] = [];
    topics.forEach((t) => {
      const json = JSON.parse(t.topics ?? "[]");
      strs.push(...json as string);
    });
    return strs;
  }

  static getRecentArticles() {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return db.select().from(articles).where(
      gte(articles.createdAt, fiveDaysAgo.toISOString()),
    ).orderBy(desc(articles.createdAt));
  }
}
