import { DailyNews } from "~/jobs/news/index.ts";

// 매일 UTC 10:00에 실행 (뉴욕 아침 6:00)
// Deno.cron("Daily Gossip Pipeline", "0 10 * * *", () => {
//   console.info("Daily Gossip Pipeline Running...");
//   DailyGossip.GossipPipeline();
// });

// 매일 UTC 9:00에 실행 (뉴욕 아침 5:00)
Deno.cron("Daily News Pipeline", "0 9 * * *", () => {
  console.info("Daily News Pipeline Running...");
  DailyNews.NewsPipeline();
});
