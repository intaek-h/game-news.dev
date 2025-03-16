import { ArticleViewer } from "~/islands/articles/article-viewer.tsx";
import { ArticleAtom } from "~/jobs/atoms/article.ts";

export default async function Home() {
  const { data: recentArticles, error } = await ArticleAtom.GetRecentArticles(
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
      <a href="/ko">한국어로 보기</a>
      {recentArticles.filter((a) => typeof a.article === "object").map((
        article,
        i,
      ) => (
        <div>
          <ArticleViewer content={article.article!} />
          {i !== recentArticles.length - 1 ? <hr className="my-6" /> : null}
        </div>
      ))}
    </div>
  );
}
