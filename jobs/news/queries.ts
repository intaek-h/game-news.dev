import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { db } from "~/db/client.ts";
import { comments, pointTransactions, posts, postVotes, user } from "~/db/migrations/schema.ts";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { CommentQueries } from "~/jobs/comment/queries.ts";
import { UTCDate } from "@date-fns/utc";
import { addDays } from "date-fns";

export class NewsQueries {
  static RankedNewsPageQuery(page: number) {
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
          commentCount: sql<number>`COUNT(DISTINCT ${comments.id})`.as("commentCount"),
          score: sql<number>`(
            COALESCE(SUM(${postVotes.value}), 0) / 
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

  static RecentNewsPageQuery(page: number) {
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
          commentCount: sql<number>`COUNT(DISTINCT ${comments.id})`.as("commentCount"),
          score: sql<number>`COALESCE(SUM(${postVotes.value}), 0)`.as("score"),
        })
        .from(posts)
        .leftJoin(postVotes, eq(posts.id, postVotes.postId))
        .leftJoin(comments, eq(posts.id, comments.postId))
        .where(eq(posts.postType, "news"))
        .groupBy(posts.id, posts.createdAt, posts.title, posts.url, posts.urlHost)
        .orderBy(desc(posts.createdAt))
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
          CommentQueries.GetNewsCommentsRanked({ newsId: id, userId })
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
        CommentQueries.GetNewsCommentsRanked({ newsId: id, userId })
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

  static CreatePost({
    userId,
    postType,
    title,
    content,
    url,
    urlHost,
  }: {
    userId: string;
    postType: "news" | "ask";
    title: string;
    content: string | null;
    url: string;
    urlHost: string;
  }) {
    // Input validation
    if (title.length > 100) {
      return errAsync({ err: new Error("Title too long"), message: "Title must be less than 100 characters" });
    }
    if (content && content.length > 1000) {
      return errAsync({
        err: new Error("Content too long"),
        message: "Content must be less than 1000 characters",
      });
    }

    // Check for duplicate URL
    return ResultAsync.fromPromise(
      db.select({ id: posts.id })
        .from(posts)
        .where(eq(posts.url, url))
        .limit(1),
      (err) => ({ err, message: "Failed to check for duplicate URL" }),
    )
      .andThen((existingPosts) => {
        if (existingPosts.length > 0) {
          return okAsync({ isDuplicate: true, id: existingPosts[0].id });
        }

        return ResultAsync.fromPromise(
          db.transaction(async (tx) => {
            const [post] = await tx.insert(posts).values({
              userId,
              postType,
              title: title.trim(),
              content: content ? content.trim() : null,
              url: url.trim(),
              urlHost,
              createdAt: new Date().toISOString(),
            }).returning();

            await tx.insert(pointTransactions).values({
              userId,
              points: 10,
              actionType: "post_create",
              referenceId: post.id,
              referenceType: "post",
              createdAt: new Date(),
            });

            return { isDuplicate: false, id: post.id };
          }),
          (err) => ({ err, message: "Failed to create post" }),
        );
      });
  }

  static DailyUploadCount({ userId }: { userId: string }) {
    return ResultAsync.fromPromise(
      db.$count(
        posts,
        and(
          eq(posts.userId, userId),
          eq(posts.postType, "news"),
          gte(posts.createdAt, addDays(new UTCDate(), -1).toISOString()),
        ),
      ),
      (err) => ({ err, message: "Failed to check daily upload limit" }),
    );
  }
}
