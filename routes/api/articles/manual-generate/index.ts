import { Handlers } from "$fresh/server.ts";
import { ArticleCompound } from "~/jobs/compounds/article.ts";

export const handler: Handlers = {
  async POST(_req) {
    try {
      const response = await ArticleCompound.EnqueueHotTopics();

      return Response.json({
        success: response.statusCode >= 200 && response.statusCode < 300,
        message: response.message,
        statusCode: response.statusCode,
        data: response.data,
      });
    } catch (error) {
      console.error("Error manually triggering article generation:", error);
      return Response.json(
        {
          success: false,
          message: "Failed to manually trigger article generation",
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }
  },
};
