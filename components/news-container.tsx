interface Props {
  news: { title: string; newsId: number }[];
}

export function NewsContainer({ news }: Props) {
  return (
    <div>
      <section className="px-4 pb-48 break-keep max-w-screen-sm text-left mx-auto">
        <ol>
          {news.map((v, i) => (
            <li
              key={v.newsId}
              className="grid grid-cols-[40px_1fr] sm:grid-cols-[70px_1fr] mb-2"
            >
              <div className="p-0.5">
                <span className="text-sm font-mono text-gray-400">{i + 1}</span>
              </div>
              <div>
                <a
                  href={`/news/${v.newsId}`}
                  className="hover:underline visited:text-gray-500 underline-offset-4 text-lg text-gray-900"
                >
                  {v.title}
                </a>
                <div className="flex text-xs items-center text-gray-300 gap-1">
                  <button
                    className="hover:underline underline-offset-4"
                    type="button"
                  >
                    upvote
                  </button>
                  <span>|</span>
                  <a
                    href=""
                    className="hover:underline underline-offset-4"
                  >
                    article link
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
