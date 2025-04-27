import { Handlers } from "$fresh/server.ts";
import { CommentQueries } from "~/jobs/comment/queries.ts";
import { auth } from "~/auth.ts";

export const handler: Handlers = {
  // reply comment
  async POST(req, ctx) {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response(null, {
        status: 303,
        headers: {
          "Location": "/login",
        },
      });
    }

    const newsId = ctx.params.id;
    if (!newsId || isNaN(Number(newsId)) || Number(newsId) < 1) {
      return ctx.renderNotFound();
    }

    const form = await req.formData();
    const text = form.get("text")?.toString();
    const parentId = form.get("parentId")?.toString();

    if (!text || text.trim().length === 0) {
      return new Response(null, {
        status: 303,
        headers: {
          "Location": `/news/${newsId}`,
        },
      });
    }

    const dailyCommentCountResult = await CommentQueries.DailyCommentCount({ userId: session.user.id });

    if (dailyCommentCountResult.isErr()) {
      console.error(dailyCommentCountResult.error);
      return new Response(null, {
        status: 429,
        headers: {
          "Location": `/news/${newsId}`,
        },
      });
    }

    const result = await CommentQueries.CreateComment({
      content: text.trim(),
      postId: Number(newsId),
      userId: session.user.id,
      parentId: parentId ? Number(parentId) : null,
    });

    if (result.isErr()) {
      console.error("Error creating comment:", result.error);
      return new Response(null, {
        status: 303,
        headers: {
          "Location": `/news/${newsId}`,
        },
      });
    }

    return new Response(null, {
      status: 303,
      headers: {
        "Location": `/news/${newsId}`,
      },
    });
  },
};
