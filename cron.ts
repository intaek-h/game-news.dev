// import { DailyNews } from "~/jobs/news/index.ts";

const kv = await Deno.openKv();

// Deno.cron("Daily News", "0 10 * * *", () => {
//   DailyNews.NewsPipeline();
// });

Deno.cron("kv test", "*/1 * * * *", () => {
  let count = 0;
  kv.enqueue(["kv-test", { count: count }], {
    delay: 1000 * 10,
  });
  count++;
});
