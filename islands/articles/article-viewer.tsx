import { ArticleFormat } from "~/types/articleFormat.ts";

export function ArticleViewer(props: { content: ArticleFormat }) {
  return (
    <article>
      <h2 className="text-2xl font-bold mb-4">{props.content.title}</h2>
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
            <caption class="caption-bottom pt-1 italic text-xs text-gray-500">
              정확한 정보임을 보장하지 않습니다.
            </caption>
          </table>
        )
        : null}
    </article>
  );
}
