import { Handlers } from "$fresh/server.ts";
import { db } from "~/db/client.ts";
import { pointTransactions, postVotes } from "~/db/migrations/schema.ts";
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

    const newsId = ctx.params.id;
    if (!newsId || isNaN(Number(newsId)) || Number(newsId) < 1) {
      return new Response("Invalid news ID", { status: 400 });
    }

    try {
      // Check if user has already voted
      const existingVote = await db.select().from(postVotes)
        .where(
          and(
            eq(postVotes.postId, Number(newsId)),
            eq(postVotes.userId, session.user.id),
          ),
        )
        .get();

      if (existingVote) {
        // User has already voted, return conflict
        return new Response("Already voted", { status: 409 });
      }

      // Wrap both operations in a transaction
      await db.transaction(async (tx) => {
        // Create the vote
        const [vote] = await tx.insert(postVotes).values({
          postId: Number(newsId),
          userId: session.user.id,
          value: 1,
          createdAt: new Date(),
        }).returning();

        // Award points for upvoting
        await tx.insert(pointTransactions).values({
          userId: session.user.id,
          points: 1,
          actionType: "post_upvote",
          referenceId: vote.id,
          referenceType: "post_vote",
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

    const newsId = ctx.params.id;
    if (!newsId || isNaN(Number(newsId)) || Number(newsId) < 1) {
      return new Response("Invalid news ID", { status: 400 });
    }

    try {
      // Find and delete the existing vote
      const existingVote = await db.select().from(postVotes)
        .where(
          and(
            eq(postVotes.postId, Number(newsId)),
            eq(postVotes.userId, session.user.id),
          ),
        )
        .get();

      if (!existingVote) {
        return new Response("No vote found", { status: 404 });
      }

      // Delete the vote
      await db.delete(postVotes)
        .where(
          and(
            eq(postVotes.postId, Number(newsId)),
            eq(postVotes.userId, session.user.id),
          ),
        );

      return new Response("Vote removed", { status: 200 });
    } catch (error) {
      console.error("Error removing vote:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
