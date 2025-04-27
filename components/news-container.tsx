import { QueryParamsAtom } from "../jobs/utils/query-params.ts";
import { Time } from "../jobs/utils/time.ts";

interface Props {
  type: "ranked" | "new";
  page: number;
  news: {
    title: string;
    postId: number;
    url: string;
    urlHost: string;
    createdAt: string;
    commentCount: number;
  }[];
}

export function NewsContainer({ type, news, page }: Props) {
  return (
    <div>
      <div className="px-4 mb-4 break-keep max-w-screen-sm text-left mx-auto">
        <div className="grid grid-cols-[40px_1fr] sm:grid-cols-[70px_1fr] text-xs">
          <div>
            <span className="text-xs font-mono text-gray-400">-</span>
          </div>

          <div>
            {type === "ranked"
              ? (
                <a
                  href={`/more?${QueryParamsAtom.Focus.key}=${QueryParamsAtom.Focus.vals.HowWeRank}`}
                  className="hover:underline underline-offset-4"
                >
                  <i className="text-gray-400">how we rank</i>
                </a>
              )
              : <i className="text-gray-400">recently uploaded</i>}
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
                <span className="text-sm font-mono text-gray-400">{(page - 1) * 10 + i + 1}</span>
              </div>
              <div>
                <a
                  href={`/news/${v.postId}`}
                  className="hover:underline visited:text-gray-500 underline-offset-4 text-lg text-gray-900"
                >
                  {v.title}
                </a>
                <div className="flex text-xs items-center text-gray-400 gap-1">
                  <a
                    href={v.url}
                    target="_blank"
                    className="hover:underline underline-offset-4"
                  >
                    read news
                  </a>
                  <span>|</span>
                  <span>{Time.Ago(v.createdAt)}</span>
                  {v.commentCount > 0
                    ? (
                      <>
                        <span>|</span>
                        <span>{v.commentCount} opinions</span>
                      </>
                    )
                    : null}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {news.length === 10 && (
          <div>
            <a
              href={`/${type === "ranked" ? "" : "new"}?${QueryParamsAtom.Page.key}=${page + 1}`}
              className="pt-4 italic hover:bg-gray-100 text-right pr-4 pb-1 mt-9 text-2xl block"
            >
              next
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
