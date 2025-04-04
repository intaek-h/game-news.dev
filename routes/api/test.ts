import { Handlers } from "$fresh/server.ts";
import { chatGoogleGemini } from "~/jobs/utils/google.ts";
import jsonParser from "json-like-parse";
import { GameDeveloperNewsScraper } from "~/jobs/compounds/game-dev-news-scraper.ts";

export const handler: Handlers = {
  async POST(_req) {
    const sysP = Deno.readTextFileSync(
      Deno.cwd() + "/jobs/system-prompts/game-dev-news-title-selection.txt",
    );

    const text = await chatGoogleGemini({
      systemP: sysP,
      message: JSON.stringify(
        [
          {
            title: "Nearly 30,000 people attended GDC 2025",
            isSelected: false,
          },
          {
            title: "Game Informer returns after being shut down by GameStop",
            isSelected: false,
          },
          {
            title: "Games London's Ensemble 2025 cohort announced",
            isSelected: false,
          },
          {
            title: "German games market drops 6% to €9.4bn in 2024",
            isSelected: false,
          },
          {
            title:
              "Indiana Jones and the Great Circle to launch on PS5 on April 17, 2025 | News-in-brief",
            isSelected: false,
          },
          {
            title: "Opus Major raises $10m in seed funding round",
            isSelected: false,
          },
          {
            title: "Verlet Integration and Cloth Physics Simulation",
            isSelected: false,
          },
          {
            title:
              "Oversimplified History of Retro Game Consoles for Programmers",
            isSelected: false,
          },
          {
            title: "Encouraging player creativity in Caves of Qud",
            isSelected: false,
          },
          {
            title: "Converting saves, a cross platform journey",
            isSelected: false,
          },
        ],
      ),
    });
    return Response.json({
      result: text,
      text: text.text,
      unstableJsonParser: jsonParser(text.text ?? ""),
    });
  },

  async GET(_req) {
    const news = await GameDeveloperNewsScraper.ScrapeNewsPostedYesterday();

    return Response.json({
      news,
    });
  },
};
