import { ArticleAtom } from "~/jobs/atoms/article.ts";
import CitationArticleRow from "~/islands/articles/citation-article-row.tsx";

export default async function CitationImagesPage() {
  const { data, error } = await ArticleAtom.GetRecentArticles("ko");

  if (error) {
    return (
      <div>
        <div className="text-xl font-bold mb-4">Citation Images Admin</div>
        <span className="text-red-500">
          Failed to load articles: {String(error)}
        </span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div>
        <div className="text-xl font-bold mb-4">Citation Images Admin</div>
        <span>No articles to show</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Citation Images Admin</h1>
        <a
          href="/admin"
          className="text-sm py-1 px-3 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Return to Entity Images
        </a>
      </div>

      <div className="flex flex-col gap-4">
        {data.map((article) => (
          !article.article ? null : (
            <CitationArticleRow
              key={article.id}
              title={article.article.title}
              articleId={article.id}
              citations={article.citations || []}
              currentThumbnail={article.thumbnail ?? undefined}
            />
          )
        ))}
      </div>
    </div>
  );
}
