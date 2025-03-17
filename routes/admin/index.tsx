import { ArticleEntities } from "~/types/articleFormat.ts";
import { ArticleAtom } from "~/jobs/atoms/article.ts";
import ArticleRow from "~/islands/articles/article-row.tsx";

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
      <div className="flex flex-col gap-4">
        {data?.map((v) => (
          !v.article || !v.entities ? null : (
            <ArticleRow
              title={v.article.title}
              articleId={v.id}
              entities={extractEntities(v.entities)}
            />
          )
        ))}
      </div>
    </div>
  );
}
