import { DailyGossip } from "~/jobs/gossip/index.ts";
import { DailyNews } from "~/jobs/news/index.ts";

// 매일 UTC 10:00에 실행 (뉴욕 아침 6:00)
Deno.cron("Article Generator", "0 10 * * *", () => {
  DailyGossip.GossipPipeline();

  console.info(
    "\x1b[32m",
    `====================\nGossip Pipeline Running\n====================\n`,
    "\x1b[0m",
  );
});

// 매일 UTC 9:00에 실행 (뉴욕 아침 5:00)
Deno.cron("Article Generator", "0 9 * * *", () => {
  DailyNews.NewsPipeline();

  console.info(
    "\x1b[32m",
    `====================\nNews Pipeline Running\n====================\n`,
    "\x1b[0m",
  );
});
