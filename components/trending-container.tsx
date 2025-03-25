import { articles } from "~/db/migrations/schema.ts";

type Props = {
  articles: {
    id: typeof articles.$inferSelect["id"];
    title: string;
    keyPoints?: string[];
  }[];
};

export function TrendingContainer(props: Props) {
  return (
    <section className="text-center px-4 pb-48 break-words">
      <h1 className="mb-8 font-light select-none">
        <i className="font-light">
          trending
        </i>
      </h1>

      <div className="mb-10">
        <h2 className="mb-6">
          <a href={`/articles/${props.articles[0].id}`}>
            {props.articles[0].title}
          </a>
        </h2>

        {props.articles[0].keyPoints && (
          <ul className="text-gray-400">
            {props.articles[0].keyPoints.map((point, index) => (
              <li key={index} className="ml-4">
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-6">
        {props.articles.slice(1).map((article) => (
          <div key={article.id}>
            <h2>
              <a href={`/articles/${article.id}`}>
                {article.title}
              </a>
            </h2>
          </div>
        ))}
      </div>
    </section>
  );
}
