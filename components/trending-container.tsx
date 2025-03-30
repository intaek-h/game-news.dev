import { gossips } from "~/db/migrations/schema.ts";
import { QueryParamsAtom } from "~/jobs/atoms/query-params.ts";

type Props = {
  articles: {
    id: typeof gossips.$inferSelect["id"];
    title: string;
    keyPoints?: string[];
  }[];
};

export function TrendingContainer(props: Props) {
  return (
    <section className="text-center px-4 pb-48 break-keep">
      <div className="space-y-20">
        {props.articles.map((article) => (
          <div key={article.id}>
            <h2>
              <a
                href={`/gossips/${article.id}`}
                className="text-xl hover:underline visited:text-gray-500 underline-offset-4 text-gray-900"
              >
                {article.title}
              </a>
            </h2>
          </div>
        ))}
      </div>

      <a
        href={`/more?${QueryParamsAtom.Focus.key}=${QueryParamsAtom.Focus.vals.HowWeGatherGossips}`}
      >
        <i className="inline-block text-gray-300 my-8">
          how we gather everyday gossips
        </i>
      </a>
    </section>
  );
}
