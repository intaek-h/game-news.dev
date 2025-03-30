import { Handlers, PageProps } from "$fresh/server.ts";
import { NewsContainer } from "~/components/news-container.tsx";
import { ArticleAtom } from "~/jobs/atoms/article.ts";

type Props = {
  news: { title: string; newsId: number }[];
};

export const handler: Handlers<Props> = {
  async GET(_req, ctx) {
    const { data } = await ArticleAtom.GetRecentArticles();

    return ctx.render({
      news: data?.map((v) => ({
        title: v.article?.title ?? "",
        newsId: v.id,
      })) ?? [],
    });
  },
};

export default function Home({ data }: PageProps<Props>) {
  return <NewsContainer news={data.news} />;
}
