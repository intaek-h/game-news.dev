import { Handlers, PageProps } from "$fresh/server.ts";
import { NewsContainer } from "~/components/news-container.tsx";
import { NewsAtom } from "~/jobs/atoms/news.ts";

type Props = {
  news: {
    title: string;
    newsId: number;
    url: string;
    urlHost: string;
    createdAt: string;
  }[];
};

export const handler: Handlers<Props> = {
  async GET(_req, ctx) {
    const pageParam = ctx.url.searchParams.get("page") || "1";
    const page = parseInt(pageParam, 10);
    if (isNaN(page) || page < 1) {
      return ctx.renderNotFound();
    }
    const article = await NewsAtom.GetNewsListForPage(page);

    return ctx.render({
      news: article?.map((v) => ({
        title: v.title,
        url: v.url ?? "",
        urlHost: v.urlHost ?? "",
        createdAt: v.createdAt,
        newsId: v.id,
      })) ?? [],
    });
  },
};

export default function Home({ data }: PageProps<Props>) {
  return <NewsContainer news={data.news} />;
}
