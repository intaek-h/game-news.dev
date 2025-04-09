import { Handlers } from "$fresh/server.ts";
import { db } from "~/db/client.ts";
import { gossips } from "~/db/migrations/schema.ts";
import { eq } from "drizzle-orm";
import { R2Atom } from "~/jobs/atoms/r2.ts";

export const handler: Handlers = {
  async PUT(req) {
    try {
      const form = await req.formData();
      const articleId = form.get("articleId");
      const url = form.get("url");
      const source = form.get("source");

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

      // Fetch the image from the URL
      const imageResponse = await fetch(url.toString());

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      // Convert image to Uint8Array
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageData = new Uint8Array(imageBuffer);

      // Generate a unique key for the image in R2
      const urlWithoutParams = url.toString().split("?")[0];
      const fileExtension = urlWithoutParams.split(".").pop()?.toLowerCase() ||
        "jpg";
      const timestamp = Date.now();
      const key = `thumbnails/article-${articleIdNum}-${timestamp}.${fileExtension}`;

      // Get R2 configuration from environment
      const r2AccountId = Deno.env.get("R2_ACCOUNT_ID");
      const r2ApiToken = Deno.env.get("R2_TOKEN");
      const r2Bucket = Deno.env.get("R2_BUCKET");

      if (!r2AccountId || !r2ApiToken || !r2Bucket) {
        throw new Error("Missing R2 configuration");
      }

      // Upload image to R2
      const r2Result = await R2Atom.PutObject(
        r2Bucket,
        key,
        imageData,
      );

      // Update article with the R2 thumbnail URL
      const result = await db
        .update(gossips)
        .set({
          thumbnail: r2Result.url,
          thumbnailSource: source?.toString() || "r2",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(gossips.id, articleIdNum))
        .returning({ id: gossips.id });

      // Check if the article was found and updated
      if (!result.length) {
        return Response.json(
          { error: "Article not found" },
          { status: 404 },
        );
      }

      return Response.json({
        success: true,
        message: "Thumbnail uploaded to R2 and updated successfully",
        articleId: result[0].id,
        thumbnailUrl: r2Result.url,
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
