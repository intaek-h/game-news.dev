import "$std/dotenv/load.ts";

import { DailyNews } from "~/jobs/news/index.ts";

console.log("daily news pipeline running...");

DailyNews.NewsPipeline();
