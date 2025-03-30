import { db } from "~/db/client.ts";
import { gossips, hotTopics, translations } from "~/db/migrations/schema.ts";
import { and, desc, eq, gte } from "drizzle-orm";

export class ArticleAtom {
  static async GetHotTopicsLastFiveDays() {
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

  // trending = all articles created last 24 hours
  static async GetTrendingArticles(languageCode: string = "en") {
    try {
      const start = performance.now();
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

      const articlesWithTranslations = await db
        .select({
          id: gossips.id,
          createdAt: gossips.createdAt,
          citations: gossips.citations,
          entities: gossips.entities,
          thumbnail: gossips.thumbnail,
          article: translations.article,
        })
        .from(gossips)
        .innerJoin(
          translations,
          eq(translations.gossipId, gossips.id),
        )
        .where(
          and(
            gte(gossips.createdAt, twentyFourHoursAgo.toISOString()),
            eq(translations.languageCode, languageCode),
          ),
        )
        .orderBy(desc(gossips.createdAt));

      const end = performance.now();
      console.log(
        `ArticleAtom.GetTrendingArticles() -> ${Math.round(end - start)}ms`,
      );

      return { data: articlesWithTranslations, error: null };
    } catch (error) {
      console.error("Error fetching trending articles", error);
      return { data: null, error };
    }
  }

  static async GetArticleById(id: number, languageCode: string = "en") {
    try {
      const start = performance.now();
      const articleWithTranslations = await db
        .select({
          id: gossips.id,
          createdAt: gossips.createdAt,
          citations: gossips.citations,
          entities: gossips.entities,
          thumbnail: gossips.thumbnail,
          article: translations.article,
        })
        .from(gossips)
        .innerJoin(
          translations,
          eq(translations.gossipId, gossips.id),
        )
        .where(
          and(
            eq(gossips.id, id),
            eq(translations.languageCode, languageCode),
          ),
        )
        .limit(1);

      const end = performance.now();
      console.log(
        `ArticleAtom.GetArticleById() -> ${Math.round(end - start)}ms`,
      );

      return { data: articleWithTranslations[0], error: null };
    } catch (error) {
      console.error("Error fetching article by ID", error);
      return { data: null, error };
    }
  }

  static async GetRecentArticles(languageCode: string = "en") {
    try {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const articlesWithTranslations = await db
        .select({
          id: gossips.id,
          createdAt: gossips.createdAt,
          citations: gossips.citations,
          entities: gossips.entities,
          thumbnail: gossips.thumbnail,
          article: translations.article,
        })
        .from(gossips)
        .innerJoin(
          translations,
          eq(translations.gossipId, gossips.id),
        )
        .where(
          and(
            gte(gossips.createdAt, fiveDaysAgo.toISOString()),
            eq(translations.languageCode, languageCode),
          ),
        )
        .orderBy(desc(gossips.createdAt));

      return { data: articlesWithTranslations, error: null };
    } catch (error) {
      console.error("Error fetching recent articles", error);
      return { data: null, error };
    }
  }
}
