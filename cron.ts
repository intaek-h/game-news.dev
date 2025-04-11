// import { DailyGossip } from "~/jobs/gossip/index.ts";

// 매일 UTC 10:00에 실행 (뉴욕 아침 6:00)
// Deno.cron("Article Generator", "0 10 * * *", () => {
//   DailyGossip.GossipPipeline();

//   console.info(
//     "\x1b[32m",
//     `====================\nGossip Pipeline Running\n====================\n`,
//     "\x1b[0m",
//   );
// });

Deno.cron("cron test", "* * * * *", () => {
  console.info("cron test");
});
