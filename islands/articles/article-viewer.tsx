import { ArticleFormat } from "~/types/articleFormat.ts";

export function ArticleViewer(
  props: { content: ArticleFormat; thumbnail: string },
) {
  const getImageFromCdn = (url: string) => {
    // https://game-news.r2.dev/thumbnails/article-104-1742639645960.jpg
    if (!url || !url.startsWith("https://game-news.r2.dev")) return url;
    const u = new URL(url);
    const pathname = u.pathname.slice(1);
    const worker = "https://game-news-cf-worker.ahiou2ahiou.workers.dev";
    const cdnUrl = `${worker}/images/${pathname}`; // FIXME: 이미지 변형 쿼리 파라미터가 동작하지 않음.
    return cdnUrl;
  };

  return (
    <article>
      <h2 className="text-2xl font-bold mb-4">{props.content.title}</h2>
      {props.thumbnail
        ? (
          <img
            loading="lazy"
            src={getImageFromCdn(props.thumbnail)}
            alt=""
            className="w-full h-48 object-cover rounded-sm mb-4 shadow-sm"
          />
        )
        : null}
      <ul className="mb-4">
        {props.content.key_points.map((item, i) => (
          <li
            key={i}
            className="pl-4 py-0.5 text-gray-800 list-inside list-disc"
          >
            {item}
          </li>
        ))}
      </ul>

      {props.content.table?.header.length
        ? (
          <table className="table-fixed border-separate border border-gray-400 [&_td]:border [&_td]:border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                {props.content.table.header.map((item, i) => (
                  <th
                    key={i}
                    className="border border-gray-300 p-2 text-left font-semibold text-gray-900"
                  >
                    {item}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {props.content.table.rows.map((row) => (
                <tr>
                  {row.map((item, i) => (
                    <td
                      key={i}
                      className="border border-gray-300 p-1 pl-2 text-gray-600"
                    >
                      {item}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
        : null}
    </article>
  );
}
