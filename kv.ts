import { MessageGuard } from "~/src/utils/kv.ts";
import { ArticleController } from "~/src/controllers/articleController.ts";

export const kv = await Deno.openKv();

kv.listenQueue(async (msg: unknown) => {
  if (MessageGuard.IsHotTopic(msg)) {
    const { topic, gid } = msg[1];

    const result = await ArticleController.WriteArticles({ topic, gid });

    console.log("WriteArticles result: ", result);
  }
});
