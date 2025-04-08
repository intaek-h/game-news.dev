import { Handlers } from "$fresh/server.ts";
import { DailyNews } from "~/jobs/news/index.ts";

export const handler: Handlers = {
  POST(_req) {
    return Response.json({
      message: "ok",
    });
  },

  async GET(_req) {
    const result = await DailyNews.NewsPipeline();

    return Response.json({
      result: result.unwrapOr([]),
    });
  },
};
