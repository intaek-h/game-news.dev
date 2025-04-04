import { GameDeveloperNewsRSS, ScrapeAtom } from "~/jobs/atoms/scrape.ts";
import { addDays, isAfter, startOfDay } from "date-fns";
import { UTCDate } from "@date-fns/utc";

export class GameDeveloperNewsScraper {
  static ScrapeNewsPostedYesterday = async (
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
