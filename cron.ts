const SELF_URL = Deno.env.get("SELF_URL") ?? "";

if (!SELF_URL) {
  console.error("SELF_URL is not set");
  Deno.exit(1);
}

// 매일 UTC 10:00에 실행 (뉴욕 아침 6:00)
// Deno.cron("Article Generator", "0 10 * * *", async () => {
//   const response = await ArticleCompound.EnqueueHotTopics();

//   console.info(
//     "\x1b[32m",
//     `====================\nARTICLE GENERATION\n====================\n`,
//     response,
//     "\n",
//     `====================\nARTICLE GENERATION\n====================\n`,
//     "\x1b[0m",
//   );
// });
