// import { DailyNews } from "~/jobs/news/index.ts";

import { logg } from "~/jobs/logger/index.ts";

const kv = await Deno.openKv();

// Deno.cron("Daily News", "0 10 * * *", () => {
//   DailyNews.NewsPipeline();
// });

console.log("kv", kv);

let count = 0;

Deno.cron("kv test", "*/1 * * * *", () => {
  kv.enqueue(["kv-test", { count: count }], {
    delay: 1000 * 10,
  });
  count++;
});

kv.listenQueue((msg: unknown) => {
  console.log(msg);
  logg
    .DiscordAlert({ title: "kv test", description: JSON.stringify(msg) })
    .match(
      console.log,
      console.error,
    );
});
