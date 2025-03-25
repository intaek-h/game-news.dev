import { ArticleAtom } from "~/jobs/atoms/article.ts";
import { TrendingContainer } from "~/components/trending-container.tsx";

export default async function Home() {
  const { data: recentArticles, error } = await ArticleAtom.GetTrendingArticles(
    "en",
  );

  if (error || !recentArticles?.length) {
    return (
      <div>
        <div>hello</div>
        <span>no articles to show</span>
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
