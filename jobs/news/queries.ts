import { ResultAsync } from "neverthrow";
import { db } from "~/db/client.ts";
import { posts, postVotes } from "~/db/migrations/schema.ts";
import { eq, sql } from "drizzle-orm";

export class NewsQueries {
  static PageQuery(page: number) {
    const GRAVITY = 1.8; // Hacker News gravity factor
    const POSTS_PER_PAGE = 10;
    const offset = (page - 1) * POSTS_PER_PAGE;

    return ResultAsync.fromPromise(
      db
        .select({
          id: posts.id,
          title: posts.title,
          url: posts.url,
          urlHost: posts.urlHost,
          createdAt: posts.createdAt,
          voteCount: sql<number>`COALESCE(SUM(${postVotes.value}), 0)`.as("voteCount"),
          score: sql<number>`(
            (COALESCE(SUM(${postVotes.value}), 0) - 1) / 
            POWER(
              (strftime('%s', 'now') - strftime('%s', ${posts.createdAt})) / 3600 + 2,
              ${GRAVITY}
            )
          )`.as("score"),
        })
        .from(posts)
        .leftJoin(postVotes, eq(posts.id, postVotes.postId))
        .where(eq(posts.postType, "news"))
        .groupBy(posts.id)
        .orderBy(sql`score DESC`)
        .limit(POSTS_PER_PAGE)
        .offset(offset),
      (err) => ({ err, message: "Failed to fetch news" }),
    );
  }
}
