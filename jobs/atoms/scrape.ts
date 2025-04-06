import { RedditScrapingResult } from "~/types/redditScraper.ts";
import Parser from "rss-parser";
import { UTCDate } from "@date-fns/utc";
import { addDays, isAfter, startOfDay } from "date-fns";

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

  static ScrapeGameDeveloperNews = async (param: RSSSource) => {
    const parser = new Parser();
    const feed = await parser.parseURL(param.url);

    const items = feed.items?.map((item) => {
      return {
        ...item,
        title: item[param.keys.title] as string || "",
        link: item[param.keys.link] as string || "",
        createdAt: item[param.keys.createdAt] as string || "",
      };
    });

    return items;
  };

  static ScrapeGameDevNewsPostedYesterday = async (
    todayUTC: UTCDate = new UTCDate(),
  ) => {
    const scrapePromise = GameDeveloperNewsRSS.map(
      (v) => ScrapeAtom.ScrapeGameDeveloperNews(v),
    );
    const scrapeResults = await Promise.allSettled(scrapePromise);
    const allResults = scrapeResults.flatMap((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error("Scrape failed:", result.reason);
        return [];
      }
    });

    return allResults
      .filter((item) => {
        const yesterdayStart = addDays(startOfDay(todayUTC), -1);
        const createdAt = new UTCDate(item.createdAt);
        return isAfter(createdAt, yesterdayStart);
      })
      .map((item) => ({
        title: item.title,
        link: item.link,
        createdAt: item.createdAt,
      }));
  };
}

type RSSSource = {
  url: string;
  keys: {
    title: string;
    link: string;
    createdAt: string;
  };
};

export const GameDeveloperNewsRSS: RSSSource[] = [
  {
    "url": "https://www.gamedeveloper.com/rss.xml",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://www.gamesindustry.biz/feed",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://www.developer-tech.com/categories/developer-gaming/feed/",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://venturebeat.com/category/game-development/feed/",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://gamefromscratch.com/feed/",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://80.lv/feed",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://mas-bandwidth.com/rss/",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://www.redblobgames.com/blog/posts.xml",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://etodd.io/index.xml",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://fabiensanglard.net/rss.xml",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://chickensoft.games/blog/rss",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://technology.riotgames.com/news/feed",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://unitydevelopers.co.uk/feed/",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://www.tomlooman.com/feed/",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
  {
    "url": "https://www.factorio.com/blog/rss",
    "keys": {
      "title": "title",
      "link": "link",
      "createdAt": "isoDate",
    },
  },
];
