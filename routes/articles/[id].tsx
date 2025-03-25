import { Handlers, PageProps } from "$fresh/server.ts";

import { ArticleAtom } from "~/jobs/atoms/article.ts";

import { ArticleEntities, ArticleFormat } from "~/types/articleFormat.ts";

type Props = {
  article: ArticleFormat | null;
  citations: string[] | null;
  entities: ArticleEntities | null;
  thumbnail: string | null;
};

export const handler: Handlers<Props> = {
  async GET(_req, ctx) {
    try {
      const { data, error } = await ArticleAtom.GetArticleById(
        parseInt(ctx.params.id),
        "en",
      );

      if (error || !data) {
        return ctx.renderNotFound();
      }

      return ctx.render({
        article: data.article,
        citations: data.citations,
        entities: data.entities,
        thumbnail: data.thumbnail,
      });
    } catch (error) {
      console.error("Error fetching session: ", error);
      return ctx.render();
    }
  },
};

export default function ArticlePage(props: PageProps<Props>) {
  return (
    <article className="text-center px-4 break-words">
      <h1 className="mb-8 font-normal text-xl">
        {props.data.article?.title}
      </h1>

      {props.data.article?.key_points && (
        <ul className="text-gray-900 mb-6 leading-loose max-w-xl mx-auto text-left">
          {props.data.article?.key_points.map((point, index) => (
            <li key={index} className="ml-4">
              <span className="text-gray-300">-</span> {point}
            </li>
          ))}
        </ul>
      )}

      {props.data.article?.table.header.length
        ? (
          <table className="table-auto text-sm max-w-xl w-full mx-auto [&_td]:border [&_td]:border-gray-300">
            <thead className="">
              <tr>
                {props.data.article.table.header.map((item, i) => (
                  <th
                    key={i}
                    className="border border-gray-300 p-1 text-center font-medium text-gray-900"
                  >
                    {item}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {props.data.article.table.rows.map((row) => (
                <tr>
                  {row.map((item, i) => (
                    <td
                      key={i}
                      className="border border-gray-300 px-2 py-1 text-gray-600"
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
