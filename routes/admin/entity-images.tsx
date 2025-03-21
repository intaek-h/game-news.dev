import { ArticleEntities } from "~/types/articleFormat.ts";
import { ArticleAtom } from "~/jobs/atoms/article.ts";
import EnhancedArticleRow from "~/islands/articles/enhanced-article-row.tsx";

const extractEntities = (entities: ArticleEntities | null) => {
  if (!entities) {
    return [];
  }
  return Object.values(entities).map((entity) => entity).flat() as string[];
};

export default async function Home() {
  const { data, error } = await ArticleAtom.GetRecentArticles("ko");

  if (error) {
    return (
      <div>
        <div>hello</div>
        <span>no articles to show</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <a
          href="/admin/citation-images"
          className="text-sm py-1 px-3 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          View Citation Images
        </a>
      </div>

      <div className="flex flex-col gap-4">
        {data?.map((v) => (
          !v.article || !v.entities ? null : (
            <EnhancedArticleRow
              key={v.id}
              articleId={v.id}
              entities={extractEntities(v.entities)}
              title={v.article.title}
              citations={v.citations || []}
              currentThumbnail={v.thumbnail || ""}
            />
          )
        ))}
      </div>
    </div>
  );
}
