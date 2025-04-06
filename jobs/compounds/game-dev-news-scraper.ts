import { ScrapeAtom } from "~/jobs/atoms/scrape.ts";
import { ArticleAiAtom } from "~/jobs/atoms/article-ai.ts";
import { db } from "~/db/client.ts";
import { posts, user } from "~/db/migrations/schema.ts";
import { and, eq } from "drizzle-orm";

export class GameDeveloperNewsScraper {
  /**
   * - 매일 00시에 전일 뉴스 스크랩.
   * - AI 가 유용한 것만 선택.
   * - 게시물 업로드.
   */
  static ScrapeDaily = async () => {
    const newsTopics = await ScrapeAtom.ScrapeGameDevNewsPostedYesterday();

    const aiSelection = await ArticleAiAtom.SelectUsefulGameDevNewsTitles(
      newsTopics.map((v) => ({ ...v, isSelected: false })),
    );

    if (!aiSelection) {
      console.error(
        "GameDeveloperNewsScraper: AI selection failed",
      );
      return;
    }

    const [newsAdmin] = await db
      .select()
      .from(user)
      .where(
        and(eq(user.type, "admin"), eq(user.name, "news-administrator")),
      );

    if (!newsAdmin) {
      console.error(
        "GameDeveloperNewsScraper: news administrator not found",
      );
      return;
    }

    const inserted = await db.insert(posts).values(
      aiSelection.filter((v) => !!v.title && !!v.link).map((v) => ({
        createdAt: new Date(v.createdAt).toISOString(),
        title: v.title,
        postType: "news" as const,
        url: v.link,
        userId: newsAdmin.id,
        urlHost: new URL(v.link).host,
      })),
    ).returning();

    return inserted;
  };
}
