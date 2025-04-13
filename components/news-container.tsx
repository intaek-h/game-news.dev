import { QueryParamsAtom } from "~/jobs/atoms/query-params.ts";
import { Time } from "~/jobs/time/index.ts";

interface Props {
  page: number;
  news: {
    title: string;
    postId: number;
    url: string;
    urlHost: string;
    createdAt: string;
    voteCount: number;
  }[];
}

export function NewsContainer({ news, page }: Props) {
  return (
    <div>
      <div className="px-4 mb-4 break-keep max-w-screen-sm text-left mx-auto">
        <div className="grid grid-cols-[40px_1fr] sm:grid-cols-[70px_1fr] text-xs">
          <div>
            <span className="text-xs font-mono text-gray-400">-</span>
          </div>

          <div>
            <a
              href={`/more?${QueryParamsAtom.Focus.key}=${QueryParamsAtom.Focus.vals.HowWeRank}`}
              className="hover:underline underline-offset-4"
            >
              <i className="text-gray-400">how we rank</i>
            </a>
          </div>
        </div>
      </div>

      <section className="px-4 pb-48 break-keep max-w-screen-sm text-left mx-auto">
        <ol>
          {news.map((v, i) => (
            <li
              key={v.postId}
              className="grid grid-cols-[40px_1fr] sm:grid-cols-[70px_1fr] mb-3"
            >
              <div className="p-0.5">
                <span className="text-sm font-mono text-gray-400">{i + 1}</span>
              </div>
              <div>
                <a
                  href={`/news/${v.postId}`}
                  className="hover:underline visited:text-gray-500 underline-offset-4 text-lg text-gray-900"
                >
                  {v.title}
                </a>
                <div className="flex text-xs items-center text-gray-400 gap-1">
                  <button
                    className="hover:underline underline-offset-4"
                    type="button"
                  >
                    {v.voteCount > 0 ? `upvote(${v.voteCount})` : "upvote"}
                  </button>
                  <span>|</span>
                  <a
                    href={v.url}
                    className="hover:underline underline-offset-4"
                  >
                    read news
                  </a>
                  <span>|</span>
                  <span>{Time.Ago(v.createdAt)}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {news.length === 10 && (
          <div>
            <a
              href={`/?${QueryParamsAtom.Page.key}=${page + 1}`}
              className="pt-4 text-right pr-4 pb-1 mt-9 text-2xl block hover:border-b-2 hover:border-gray-900"
            >
              next
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
