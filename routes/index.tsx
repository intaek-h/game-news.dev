import { Handlers, PageProps } from "$fresh/server.ts";
import { NewsContainer } from "~/components/news-container.tsx";
import { NewsQueries } from "~/jobs/news/queries.ts";

type Props = {
  page: number;
  news: {
    title: string;
    postId: number;
    url: string;
    urlHost: string;
    createdAt: string;
    voteCount: number;
  }[];
};

export const handler: Handlers<Props> = {
  async GET(_req, ctx) {
    const pageParam = ctx.url.searchParams.get("page") || "1";
    const page = parseInt(pageParam, 10);
    if (isNaN(page) || page < 1) {
      return ctx.renderNotFound();
    }
    const article = await NewsQueries.ListPageQuery(page);

    if (article.isErr()) {
      return ctx.renderNotFound();
    }

    return ctx.render({
      page: page,
      news: article.value.map((v) => ({
        title: v.title,
        url: v.url ?? "",
        urlHost: v.urlHost ?? "",
        createdAt: v.createdAt,
        postId: v.id,
        voteCount: v.voteCount,
      })),
    });
  },
};

export default function Home({ data }: PageProps<Props>) {
  return <NewsContainer news={data.news} page={data.page} />;
}
