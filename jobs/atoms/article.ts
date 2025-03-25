import { db } from "~/db/client.ts";
import { articles, hotTopics, translations } from "~/db/migrations/schema.ts";
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
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

      const articlesWithTranslations = await db
        .select({
          id: articles.id,
          createdAt: articles.createdAt,
          citations: articles.citations,
          entities: articles.entities,
          thumbnail: articles.thumbnail,
          article: translations.article,
        })
        .from(articles)
        .innerJoin(
          translations,
          eq(translations.articleId, articles.id),
        )
        .where(
          and(
            gte(articles.createdAt, twentyFourHoursAgo.toISOString()),
            eq(translations.languageCode, languageCode),
          ),
        )
        .orderBy(desc(articles.createdAt));

      return { data: articlesWithTranslations, error: null };
    } catch (error) {
      console.error("Error fetching trending articles", error);
      return { data: null, error };
    }
  }

  static async GetArticleById(id: number, languageCode: string = "en") {
    try {
      const articleWithTranslations = await db
        .select({
          id: articles.id,
          createdAt: articles.createdAt,
          citations: articles.citations,
          entities: articles.entities,
          thumbnail: articles.thumbnail,
          article: translations.article,
        })
        .from(articles)
        .innerJoin(
          translations,
          eq(translations.articleId, articles.id),
        )
        .where(
          and(
            eq(articles.id, id),
            eq(translations.languageCode, languageCode),
          ),
        )
        .limit(1);

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
          id: articles.id,
          createdAt: articles.createdAt,
          citations: articles.citations,
          entities: articles.entities,
          thumbnail: articles.thumbnail,
          article: translations.article,
        })
        .from(articles)
        .innerJoin(
          translations,
          eq(translations.articleId, articles.id),
        )
        .where(
          and(
            gte(articles.createdAt, fiveDaysAgo.toISOString()),
            eq(translations.languageCode, languageCode),
          ),
        )
        .orderBy(desc(articles.createdAt));

      return { data: articlesWithTranslations, error: null };
    } catch (error) {
      console.error("Error fetching recent articles", error);
      return { data: null, error };
    }
  }
}
