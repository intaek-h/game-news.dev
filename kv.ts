import { MessageGuard } from "~/src/utils/kv.ts";
import { ArticleService } from "~/src/services/articleService.ts";
import { db } from "~/db/client.ts";
import { articles } from "~/db/migrations/schema.ts";

export const kv = await Deno.openKv();

kv.listenQueue(async (msg: unknown) => {
  if (MessageGuard.IsHotTopic(msg)) {
    const { topic, gid } = msg[1];

    const [aiArticle] = await ArticleService.writeArticles([topic]);

    if (!aiArticle) {
      return console.error("Failed to write articles");
    }

    const [inspectedArticle] = await ArticleService.finalArticleInspection(
      [aiArticle.reply],
    );

    if (!inspectedArticle) {
      return console.error("Failed to inspect articles");
    }

    const [translatedArticle] = await ArticleService.translateArticles(
      [inspectedArticle],
    );

    const [finalArticle] = await db
      .insert(articles)
      .values({
        gid: gid,
        article: inspectedArticle,
        createdAt: new Date().toISOString(),
        articleKor: translatedArticle,
        citations: JSON.stringify(aiArticle.citations),
      })
      .returning({ article: articles.article, id: articles.id });

    console.log("Successfully Saved Article: ", finalArticle);
  }
});
