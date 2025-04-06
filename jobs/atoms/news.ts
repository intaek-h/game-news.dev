import { db } from "~/db/client.ts";
import { posts, user } from "~/db/migrations/schema.ts";
import { and, eq } from "drizzle-orm";

export class NewsAtom {
  static GetNewsListForPage = async (page: number) => {
    const news = await db
      .select({
        id: posts.id,
        title: posts.title,
        url: posts.url,
        urlHost: posts.urlHost,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(
        and(eq(posts.postType, "news")),
      )
      .limit(10)
      .offset((page - 1) * 10);

    return news.map((v) => ({
      id: v.id,

      title: v.title,
      url: v.url,
      urlHost: v.urlHost,
      createdAt: v.createdAt,
    }));
  };

  static GetNewsDetail = async (id: number) => {
    const news = await db
      .select({
        id: posts.id,
        title: posts.title,
        url: posts.url,
        urlHost: posts.urlHost,
        createdAt: posts.createdAt,
        content: posts.content,
        username: user.name,
      })
      .from(posts)
      .innerJoin(user, eq(posts.userId, user.id))
      .where(
        and(eq(posts.postType, "news"), eq(posts.id, id)),
      )
      .limit(1);

    return news.map((v) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      urlHost: v.urlHost,
      createdAt: v.createdAt,
      content: v.content,
      username: v.username,
    }))[0];
  };
}
