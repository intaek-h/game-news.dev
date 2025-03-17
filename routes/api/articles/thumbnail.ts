import { Handlers } from "$fresh/server.ts";
import { db } from "~/db/client.ts";
import { articles } from "~/db/migrations/schema.ts";
import { eq } from "drizzle-orm";

export const handler: Handlers = {
  async POST(req) {
    try {
      const form = await req.formData();
      const articleId = form.get("articleId");
      const url = form.get("url");

      // Validate inputs
      if (!articleId || !url) {
        return Response.json(
          { error: "Missing required fields: articleId and url" },
          { status: 400 },
        );
      }

      // Parse articleId as number
      const articleIdNum = parseInt(articleId.toString(), 10);
      if (isNaN(articleIdNum)) {
        return Response.json(
          { error: "Invalid articleId format" },
          { status: 400 },
        );
      }

      // Update article with the thumbnail URL
      const result = await db
        .update(articles)
        .set({
          thumbnail: url.toString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(articles.id, articleIdNum))
        .returning({ id: articles.id });

      // Check if the article was found and updated
      if (!result.length) {
        return Response.json(
          { error: "Article not found" },
          { status: 404 },
        );
      }

      return Response.json({
        success: true,
        message: "Thumbnail updated successfully",
        articleId: result[0].id,
      });
    } catch (error) {
      console.error("Error updating article thumbnail:", error);
      return Response.json(
        { error: "Failed to update thumbnail" },
        { status: 500 },
      );
    }
  },
};
