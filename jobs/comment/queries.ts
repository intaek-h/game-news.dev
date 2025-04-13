import { ResultAsync } from "neverthrow";
import { db } from "~/db/client.ts";
import { comments, commentVotes, pointTransactions, user } from "~/db/migrations/schema.ts";
import { and, eq, getTableColumns, gte, sql } from "drizzle-orm";
import { addDays } from "date-fns";

export class CommentQueries {
  static GetNewsComments(newsId: number, userId?: string) {
    return ResultAsync.fromPromise(
      db
        .select({
          ...getTableColumns(comments),
          user: user,
          hasUpvoted: userId
            ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${commentVotes} 
            WHERE ${commentVotes.commentId} = ${comments.id} 
            AND ${commentVotes.userId} = ${userId}
          )`
            : sql<boolean>`false`,
        })
        .from(comments)
        .where(eq(comments.postId, newsId))
        .innerJoin(user, eq(comments.userId, user.id)),
      (err) => ({ err, message: "Failed to fetch news comments" }),
    );
  }

  static CreateComment(params: {
    content: string;
    postId: number;
    userId: string;
    parentId: number | null;
  }) {
    return ResultAsync.fromPromise(
      db.transaction(async (tx) => {
        // Create the comment
        const [comment] = await tx.insert(comments).values({
          content: params.content.trim(),
          contentType: "post",
          postId: params.postId,
          userId: params.userId,
          parentId: params.parentId ?? null,
          createdAt: new Date(),
        }).returning();

        // Check point limit for the last 24 hours
        const last24Hours = addDays(new Date(), -1);
        const recentTransactions = await tx
          .select()
          .from(pointTransactions)
          .where(
            and(
              eq(pointTransactions.userId, params.userId),
              eq(pointTransactions.actionType, "comment_create"),
              gte(pointTransactions.createdAt, last24Hours),
            ),
          );

        // Only award points if under the limit
        if (recentTransactions.length < 3) {
          await tx.insert(pointTransactions).values({
            userId: params.userId,
            points: 10,
            actionType: "comment_create",
            referenceId: comment.id,
            referenceType: "comment",
            createdAt: new Date(),
          });
        }

        return comment;
      }),
      (err) => ({ err, message: "Failed to create comment" }),
    );
  }
}
