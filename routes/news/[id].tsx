import { Handlers, PageProps } from "$fresh/server.ts";
import { NewsAtom } from "~/jobs/atoms/news.ts";

type Props = {
  username: string;
  title: string;
  url: string;
  urlHost: string;
  createdAt: string;
  content: string;
  id: number;
};

export const handler: Handlers<Props> = {
  async GET(_req, ctx) {
    const newsId = ctx.params.id;
    if (!newsId || isNaN(Number(newsId)) || Number(newsId) < 1) {
      return ctx.renderNotFound();
    }
    const article = await NewsAtom.GetNewsDetail(Number(newsId));

    return ctx.render({
      username: article.username,
      title: article.title,
      url: article.url ?? "",
      urlHost: article.urlHost ?? "",
      createdAt: article.createdAt,
      content: article.content ?? "",
      id: article.id,
    }) ?? [];
  },
};

export default function Home(props: PageProps<Props>) {
  return (
    <div>
      <div className="px-4 mb-4 break-keep max-w-screen-sm text-left mx-auto">
        <div className="px-4">
          <div className="mb-8">
            <a
              href={props.data.url}
              target="_blank"
              className="hover:underline underline-offset-4 text-2xl text-gray-900"
            >
              {props.data.title}
            </a>
            <a
              href=""
              className="hover:underline text-gray-400 underline-offset-4 text-xs ml-1"
            >
              ({props.data.urlHost})
            </a>
            <div className="flex text-xs items-center text-gray-400 gap-1">
              <button
                className="hover:underline underline-offset-4"
                type="button"
              >
                upvote
              </button>
              <span>|</span>
              <a href="" className="hover:underline underline-offset-4">
                article link
              </a>
              <span>|</span>
              <span>1 hour ago</span>
              <span>
                by
              </span>
              <a href="" className="hover:underline underline-offset-4">
                {props.data.username}
              </a>
            </div>
          </div>

          <div className="mb-16">
            <p className="text-sm text-gray-500">
              {props.data.content}
            </p>
          </div>

          <div className="mb-16">
            <form action="comment" method="post" id="comment">
              <textarea
                name="text"
                wrap="virtual"
                rows={6}
                className="w-full p-2 border-none rounded-none font-mono text-gray-900 placeholder:text-gray-400 bg-[#f8f9f9] outline-[#bdbbbb]"
                placeholder="your thoughts"
              >
              </textarea>
            </form>
            <button
              type="submit"
              form="comment"
              className="mt-4 text-medium text-blue-900 underline"
            >
              add comment
            </button>
          </div>

          <div>
            <div>
              <a href="">amigdima</a>
              <span>15 minutes ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
