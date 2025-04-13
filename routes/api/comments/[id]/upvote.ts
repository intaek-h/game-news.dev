import { Handlers } from "$fresh/server.ts";
import { db } from "~/db/client.ts";
import { comments, commentVotes, pointTransactions } from "~/db/migrations/schema.ts";
import { auth } from "~/auth.ts";
import { and, eq } from "drizzle-orm";

export const handler: Handlers = {
  async POST(req, ctx) {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const commentId = ctx.params.id;
    if (!commentId || isNaN(Number(commentId)) || Number(commentId) < 1) {
      return new Response("Invalid comment ID", { status: 400 });
    }

    try {
      // Check if user has already voted
      const existingVote = await db.select().from(commentVotes)
        .where(
          and(
            eq(commentVotes.commentId, Number(commentId)),
            eq(commentVotes.userId, session.user.id),
          ),
        )
        .get();

      if (existingVote) {
        return new Response("Already voted", { status: 409 });
      }

      // Get the comment to find the author's userId
      const comment = await db.select().from(comments)
        .where(eq(comments.id, Number(commentId)))
        .get();

      if (!comment) {
        return new Response("Comment not found", { status: 404 });
      }

      // Wrap operations in a transaction
      await db.transaction(async (tx) => {
        // Create the vote
        const [vote] = await tx.insert(commentVotes).values({
          commentId: Number(commentId),
          userId: session.user.id,
          value: 1,
          createdAt: new Date(),
        }).returning();

        // Award points to the voter
        await tx.insert(pointTransactions).values({
          userId: session.user.id,
          points: 1,
          actionType: "comment_upvote",
          referenceId: vote.id,
          referenceType: "comment_vote",
          createdAt: new Date(),
        });

        // Award points to the comment author
        await tx.insert(pointTransactions).values({
          userId: comment.userId,
          points: 1,
          actionType: "comment_received_upvote",
          referenceId: vote.id,
          referenceType: "comment_vote",
          createdAt: new Date(),
        });

        return vote;
      });

      return new Response("Vote recorded", { status: 200 });
    } catch (error) {
      console.error("Error processing vote:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },

  async DELETE(req, ctx) {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const commentId = ctx.params.id;
    if (!commentId || isNaN(Number(commentId)) || Number(commentId) < 1) {
      return new Response("Invalid comment ID", { status: 400 });
    }

    try {
      // Find and delete the existing vote
      const existingVote = await db.select().from(commentVotes)
        .where(
          and(
            eq(commentVotes.commentId, Number(commentId)),
            eq(commentVotes.userId, session.user.id),
          ),
        )
        .get();

      if (!existingVote) {
        return new Response("No vote found", { status: 404 });
      }

      // Delete the vote
      await db.delete(commentVotes)
        .where(
          and(
            eq(commentVotes.commentId, Number(commentId)),
            eq(commentVotes.userId, session.user.id),
          ),
        );

      return new Response("Vote removed", { status: 200 });
    } catch (error) {
      console.error("Error removing vote:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
