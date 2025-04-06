import { Handlers } from "$fresh/server.ts";
import { GameDeveloperNewsScraper } from "~/jobs/compounds/game-dev-news-scraper.ts";

export const handler: Handlers = {
  POST(_req) {
    return Response.json({
      message: "ok",
    });
  },

  async GET(_req) {
    const result = await GameDeveloperNewsScraper.ScrapeDaily();

    return Response.json({
      result,
    });
  },
};
