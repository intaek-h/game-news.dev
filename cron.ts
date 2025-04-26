import { DailyNews } from "~/jobs/news/index.ts";

// 매일 UTC 9:00에 실행 (뉴욕 아침 5:00)
Deno.cron("Daily News Pipeline", "0 9 * * *", () => {
  console.info("Daily News Pipeline Running...");
  DailyNews.NewsPipeline().map((data) => {
    console.info("Daily News Pipeline Finished");
    console.info(data.map((v) => v.title).join("\n"));
  });
});
