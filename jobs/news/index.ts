import Parser from "rss-parser";
import { ResultAsync } from "neverthrow";
import { addDays, isAfter, startOfDay } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import { FileUtilities } from "~/jobs/utils/file.ts";
import { chatGoogleGemini2 } from "~/jobs/utils/google.ts";
import { DeveloperArticleCandidate } from "~/types/articleFormat.ts";
import { unstableJsonParser } from "~/jobs/utils/json.ts";
import { db } from "~/db/client.ts";
import { posts, user } from "~/db/migrations/schema.ts";
import { and, eq } from "drizzle-orm";
import { Logg } from "~/jobs/logger/index.ts";

export class DailyNews {
  static ScrapeGameDeveloperNews = (param: RSSSource) => {
    const parser = new Parser();

    return ResultAsync.fromPromise(
      parser.parseURL(param.url),
      (err) => ({ err, message: `Failed to parse RSS feed (${param.url})` }),
    ).map(
      (feed) =>
        feed.items.map((item) => ({
          ...item,
          title: item[param.keys.title] as string || "",
          link: item[param.keys.link] as string || "",
          createdAt: item[param.keys.createdAt] as string || "",
        })),
    );
  };

  static SelectUsefulNewsTitles = (data: DeveloperArticleCandidate[]) => {
    const systemPrompt = FileUtilities.ReadFileSafeSync("/jobs/system-prompts/game-dev-news-title-selection.txt");

    if (systemPrompt.isErr()) {
      return systemPrompt;
    }

    return chatGoogleGemini2({ systemP: systemPrompt.value, message: JSON.stringify(data) })
      .map((result) => {
        const parsed = unstableJsonParser<DeveloperArticleCandidate[]>({
          maybeJson: result.text ?? "",
        });

        return (parsed ?? []).filter((v) => v.isSelected);
      });
  };

  static NewsPipeline = (params?: { scrapeFrom?: Date }) => {
    let { scrapeFrom } = params ?? {};

    const yesterday = addDays(startOfDay(new UTCDate()), -1);

    scrapeFrom = scrapeFrom ?? yesterday;

    const scrapePromise = GameDeveloperNewsRSS.map((v) => this.ScrapeGameDeveloperNews(v));

    const result = ResultAsync.combine(scrapePromise) // FIXME: Fails when one of the promises fails
      .map((data) =>
        data
          .flat()
          .filter((v) => {
            const createdAt = new UTCDate(v.createdAt);
            return isAfter(createdAt, scrapeFrom); // only select news posted after the given date
          })
          .map((v) => ({
            title: v.title,
            link: v.link,
            createdAt: v.createdAt,
          }))
      )
      .andThen((data) =>
        Logg.SendDiscord({
          title: "News Pipeline",
          description: "Scraping finished.",
          message: `${data.length} news found.`,
          code: data.map((v) => v.title).join("\n"),
        })
          .map(() => data)
      )
      .andThen(
        (data) => this.SelectUsefulNewsTitles(data.map((v) => ({ ...v, isSelected: false }))),
      )
      .andThen((data) =>
        Logg.SendDiscord({
          title: "News Pipeline",
          description: "AI selection finished.",
          message: `${data.length} news selected.`,
          code: data.map((v) => v.title).join("\n"),
        })
          .map(() => data)
      )
      .andThen(
        (data) =>
          ResultAsync.fromPromise(
            db.transaction(async (tx) => {
              const [newsAdmin] = await tx
                .select()
                .from(user)
                .where(and(eq(user.type, "admin"), eq(user.name, "news-administrator")));

              if (!newsAdmin) {
                throw new Error("news administrator not found");
              }

              const duplicateChecks = data.map((v) => tx.select().from(posts).where(eq(posts.url, v.link)).limit(1));

              const duplicates = (await Promise.all(duplicateChecks)).flat();

              const freshUrls = data.filter((v) => !duplicates.some((d) => d.url === v.link));

              if (freshUrls.length === 0) {
                throw new Error("0 left after duplicate check");
              }

              const inserted = await tx.insert(posts).values(
                freshUrls.filter((v) => !!v.title && !!v.link).map((v) => ({
                  createdAt: new Date().toISOString(),
                  title: v.title,
                  postType: "news" as const,
                  url: v.link,
                  userId: newsAdmin.id,
                  urlHost: new URL(v.link).host,
                })),
              ).returning();

              return inserted;
            }),
            (err) => ({ err, message: "Failed to insert news" }),
          ),
      )
      .map((data) =>
        Logg.SendDiscord({
          title: "News Pipeline",
          description: "News insertion finished.",
          message: `${data.length} news inserted.`,
        })
          .map(() => data)
      )
      .mapErr((err) => {
        console.error("NewsPipeline error:", err);
        Logg.SendDiscord({
          title: "News Pipeline Failed",
          description: err.message,
          message: "",
        });
      });

    return result;
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
  // {
  //   "url": "https://chickensoft.games/blog/rss",
  //   "keys": {
  //     "title": "title",
  //     "link": "link",
  //     "createdAt": "isoDate",
  //   },
  // },
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
