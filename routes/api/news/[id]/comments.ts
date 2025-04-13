import { Handlers } from "$fresh/server.ts";
import { CommentQueries } from "~/jobs/comment/queries.ts";
import { auth } from "~/auth.ts";

export const handler: Handlers = {
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

    try {
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
    } catch (error) {
      console.error("Error creating comment:", error);
      return new Response(null, {
        status: 303,
        headers: {
          "Location": `/news/${newsId}`,
        },
      });
    }
  },
};
