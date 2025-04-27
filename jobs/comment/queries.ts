import { ResultAsync } from "neverthrow";
import { db } from "~/db/client.ts";
import { comments, commentVotes, pointTransactions, user } from "~/db/migrations/schema.ts";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { addDays } from "date-fns";

export type RankedComment = {
  id: number;
  content: string;
  username: string;
  parentId: number | null;
  createdAt: Date;
  netScore: number;
  ageInHours: number;
  rankScore: number;
  hasUpvoted: boolean;
  children: RankedComment[];
};

export class CommentQueries {
  static GetNewsCommentsRanked({ newsId, userId }: { newsId: number; userId?: string }) {
    // Function to calculate rank score based on net score and age in hours
    function calculateRankScore(netScore: number, ageInHours: number) {
      return netScore / Math.pow(ageInHours + 2, 1.5);
    }

    // Function to recursively sort comments by rank score
    function sortComments(comments: RankedComment[]) {
      comments.sort((a, b) => b.rankScore - a.rankScore);
      comments.forEach((comment) => {
        if (comment.children.length > 0) {
          sortComments(comment.children);
        }
      });
    }

    return ResultAsync.fromPromise(
      db
        .select({
          id: comments.id,
          content: comments.content,
          username: user.name,
          createdAt: comments.createdAt,
          parentId: comments.parentId,
          netScore: sql<number>`COALESCE(SUM(${commentVotes.value}), 0)`.as("net_score"),
          ageInHours: sql<number>`(strftime('%s', 'now') - ${comments.createdAt}) / 3600.0`.as("age_in_hours"),
          hasUpvoted: userId
            ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${commentVotes} 
            WHERE ${commentVotes.commentId} = ${comments.id} 
            AND ${commentVotes.userId} = ${userId}
          )`
            : sql<boolean>`false`,
        })
        .from(comments)
        .leftJoin(commentVotes, eq(comments.id, commentVotes.commentId))
        .innerJoin(user, eq(comments.userId, user.id))
        .where(
          and(
            eq(comments.postId, newsId),
            isNull(comments.deletedAt),
          ),
        )
        .groupBy(comments.id, comments.content, comments.createdAt, comments.parentId, user.name),
      (err) => ({ err, message: "Failed to fetch news comments" }),
    ).map((commentsData) => {
      // Build a map of all comments with rank scores
      const commentMap: Record<number, RankedComment> = {};
      commentsData.forEach((row) => {
        const comment = {
          id: row.id,
          content: row.content,
          username: row.username,
          parentId: row.parentId,
          createdAt: row.createdAt,
          netScore: row.netScore,
          ageInHours: row.ageInHours,
          hasUpvoted: row.hasUpvoted,
          rankScore: calculateRankScore(row.netScore, row.ageInHours),
          children: [],
        };
        commentMap[comment.id] = comment;
      });

      // Build the tree structure and collect top-level comments
      const topLevelComments: RankedComment[] = [];
      commentsData.forEach((row) => {
        const comment = commentMap[row.id];
        if (comment.parentId === null) {
          topLevelComments.push(comment);
        } else {
          const parent = commentMap[comment.parentId];
          if (parent) {
            parent.children.push(comment);
          }
        }
      });

      // Sort top-level comments and their children recursively
      sortComments(topLevelComments);

      return topLevelComments;
    });
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

  static DailyCommentCount({ userId }: { userId: string }) {
    return ResultAsync.fromPromise(
      db.$count(comments, and(eq(comments.userId, userId), gte(comments.createdAt, addDays(new Date(), -1)))),
      (err) => ({ err, message: "Failed to get daily comment count" }),
    );
  }
}
