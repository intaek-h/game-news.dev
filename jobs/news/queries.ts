import { ResultAsync } from "neverthrow";
import { db } from "~/db/client.ts";
import { comments, posts, postVotes, user } from "~/db/migrations/schema.ts";
import { and, eq, sql } from "drizzle-orm";
import { CommentQueries } from "~/jobs/comment/queries.ts";

export class NewsQueries {
  static ListPageQuery(page: number) {
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
          commentCount: sql<number>`COUNT(${comments.id})`.as("commentCount"),
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
        .leftJoin(comments, eq(posts.id, comments.postId))
        .where(eq(posts.postType, "news"))
        .groupBy(posts.id)
        .orderBy(sql`score DESC`)
        .limit(POSTS_PER_PAGE)
        .offset(offset),
      (err) => ({ err, message: "Failed to fetch news" }),
    );
  }

  static DetailPageQuery({ id, userId }: { id: number; userId?: string }) {
    if (!userId) {
      return ResultAsync.fromPromise(
        db
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
          .where(and(eq(posts.postType, "news"), eq(posts.id, id)))
          .limit(1),
        (err) => ({ err, message: "Failed to fetch news" }),
      )
        .map(([news]) => news)
        .andThen((news) =>
          ResultAsync.fromPromise(
            db.$count(postVotes, eq(postVotes.postId, id)),
            (err) => ({ err, message: "Failed to fetch news vote count" }),
          )
            .map((voteCount) => ({ news, voteCount }))
        )
        .andThen(({ news, voteCount }) =>
          CommentQueries.GetNewsComments(id, userId)
            .map((comments) => ({ news, comments, voteCount, hasVoted: false }))
        );
    }

    return ResultAsync.fromPromise(
      db
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
        .where(and(eq(posts.postType, "news"), eq(posts.id, id)))
        .limit(1),
      (err) => ({ err, message: "Failed to fetch news" }),
    )
      .map(([news]) => news)
      .andThen((news) =>
        CommentQueries.GetNewsComments(id, userId)
          .map((comments) => ({ news, comments }))
      )
      .andThen(({ news, comments }) =>
        ResultAsync.fromPromise(
          db.$count(postVotes, eq(postVotes.postId, id)),
          (err) => ({ err, message: "Failed to fetch news vote count" }),
        )
          .map((voteCount) => ({ news, comments, voteCount }))
      )
      .andThen(({ news, comments, voteCount }) =>
        ResultAsync.fromPromise(
          db
            .select()
            .from(postVotes)
            .where(and(eq(postVotes.postId, id), eq(postVotes.userId, userId)))
            .then((result) => result.length > 0),
          (err) => ({ err, message: "Failed to fetch news vote status" }),
        )
          .map((hasVoted) => ({ news, comments, voteCount, hasVoted }))
      );
  }
}
