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
import { logg } from "~/jobs/logger/index.ts";

export class DailyNews {
  static ScrapeGameDeveloperNews = (param: RSSSource[]) => {
    const parser = new Parser();

    return ResultAsync.fromPromise(
      Promise.allSettled(param.map((source) => parser.parseURL(source.url).then((result) => ({ result, source })))),
      (err) => ({ err, message: `Failed to parse RSS feeds` }),
    ).map(
      (feed) =>
        feed
          .flatMap((result, i) => {
            if (result.status === "fulfilled") {
              return [result.value];
            } else {
              console.error("Failed to parse RSS feed:", param[i].url);
              console.error("Scrape failed:", result.reason);
              logg.DiscordAlert({
                title: "뉴스 파이프라인 (스크래핑 실패)",
                description: param[i].url,
                level: "error",
              }).mapErr(console.error);
              return [];
            }
          })
          .flatMap(({ result, source }) =>
            result.items.map((item) => ({
              ...item,
              title: item[source.keys.title] as string || "",
              link: item[source.keys.link] as string || "",
              createdAt: item[source.keys.createdAt] as string || "",
              sourceUrl: source.url,
            }))
          ),
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

    const result = this.ScrapeGameDeveloperNews(GameDeveloperNewsRSS)
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
        logg.DiscordAlert({
          title: `뉴스 파이프라인 (스크래핑 완료 - ${data.length}개)`,
          code: data.map((v) => v.title).join("\n"),
        })
          .map(() => data)
      )
      .andThen(
        (data) => this.SelectUsefulNewsTitles(data.map((v) => ({ ...v, isSelected: false }))),
      )
      .andThen((data) =>
        logg.DiscordAlert({
          title: `뉴스 파이프라인 (AI 감별 작업 완료 - ${data.length}개)`,
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
        logg.DiscordAlert({
          title: `뉴스 파이프라인 (DB 저장 완료 - ${data.length}개)`,
        })
          .map(() => data)
      )
      .mapErr((err) => {
        console.error("뉴스 파이프라인 에러:", err);
        logg.DiscordAlert({
          title: "뉴스 파이프라인 (폭파됨)",
          code: err.message,
          level: "error",
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
