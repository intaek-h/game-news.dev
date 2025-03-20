import { Handlers } from "$fresh/server.ts";
import { extract } from "@extractus/article-extractor";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const link = url.searchParams.get("link") || "";

      if (!link) {
        return Response.json({ message: "No link provided" }, { status: 400 });
      }

      const data = await extract(link);

      return Response.json({
        source: data?.source ?? "",
        image: data?.image ?? "",
      });
    } catch (error) {
      console.error("Error manually triggering article generation:", error);
      return Response.json({
        message: "Failed to manually trigger article generation",
      }, { status: 500 });
    }
  },
};
