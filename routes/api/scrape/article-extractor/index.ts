import { Handlers } from "$fresh/server.ts";
import { ArticleData, extract } from "@extractus/article-extractor";
import { db } from "~/db/client.ts";
import { articles } from "~/db/migrations/schema.ts";
import { eq } from "drizzle-orm";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);

      // Handle new articleId based extraction
      const articleId = url.searchParams.get("articleId");
      if (!articleId) {
        return Response.json({
          message: "Either link or articleId parameter is required",
        }, { status: 400 });
      }

      // Parse articleId as number
      const articleIdNum = parseInt(articleId, 10);
      if (isNaN(articleIdNum)) {
        return Response.json({
          message: "Invalid articleId format",
        }, { status: 400 });
      }

      // Fetch article data from the database
      const [result] = await db
        .select({ citations: articles.citations })
        .from(articles)
        .where(eq(articles.id, articleIdNum))
        .execute();

      if (!result) {
        return Response.json({
          message: "Article not found",
        }, { status: 404 });
      }

      const citations = result.citations || [];

      // Create an array of extraction promises
      const extractionPromises = citations
        .filter((l) => !l.includes("youtube"))
        .map((citation) => extract(citation));

      // Wait for all extractions to complete and filter out null results
      const results = await Promise.allSettled(extractionPromises);
      const validResults = results
        .filter((p) => p.status === "fulfilled")
        .filter((item): item is PromiseFulfilledResult<ArticleData> =>
          !!item.value && !!item.value.image
        )
        .map((item) => item.value);

      return Response.json({
        citationImages: validResults.map((i) => ({
          imageUrl: i.image,
          source: i.source,
        })),
      });
    } catch (error) {
      console.error("Error extracting article data:", error);
      return Response.json({
        message: "Failed to extract article data",
      }, { status: 500 });
    }
  },
};
