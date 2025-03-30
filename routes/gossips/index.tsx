import { ArticleAtom } from "~/jobs/atoms/article.ts";
import { TrendingContainer } from "~/components/trending-container.tsx";

export default async function Home(_req: Request) {
  const lang = "en";

  const { data: recentArticles, error: recentArticlesErr } = await ArticleAtom
    .GetTrendingArticles(lang);

  if (recentArticlesErr || !recentArticles?.length) {
    return (
      <div>
        <div>hello</div>
        <span>no articles to show for {lang}</span>
      </div>
    );
  }

  return (
    <div>
      <TrendingContainer
        articles={recentArticles
          .filter((a) => typeof a.article === "object")
          .map((article, i) => ({
            id: article.id,
            title: article.article?.title ?? "",
            keyPoints: i === 0 ? article.article?.key_points : undefined,
          }))}
      />
    </div>
  );
}
