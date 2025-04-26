import { Handlers, PageProps, RouteConfig } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { NewsContainer } from "~/components/news-container.tsx";
import { NewsQueries } from "~/jobs/news/queries.ts";
import { defaultCSP } from "~/jobs/utils/csp.ts";

type Props = {
  page: number;
  news: {
    title: string;
    postId: number;
    url: string;
    urlHost: string;
    createdAt: string;
    commentCount: number;
  }[];
};

export const handler: Handlers<Props> = {
  async GET(_req, ctx) {
    const pageParam = ctx.url.searchParams.get("page") || "1";
    const page = parseInt(pageParam, 10);
    if (isNaN(page) || page < 1) {
      return ctx.renderNotFound();
    }
    const article = await NewsQueries.RecentNewsPageQuery(page);

    if (article.isErr()) {
      console.error(article.error);
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
        commentCount: v.commentCount,
      })),
    });
  },
};

export default function Home({ data }: PageProps<Props>) {
  defaultCSP();

  return (
    <>
      <Head>
        <title>{data.page === 1 ? "Recent" : `Recent | page ${data.page}`}</title>
      </Head>
      <NewsContainer news={data.news} page={data.page} type="new" />
    </>
  );
}

export const config: RouteConfig = {
  csp: true,
};
