import { Handlers, PageProps } from "$fresh/server.ts";
import { auth } from "~/auth.ts";
import { comments } from "~/db/migrations/schema.ts";
import UpvoteButton from "../../islands/upvote-button.tsx";
import CommentsContainer from "../../components/comments-container.tsx";
import { NewsQueries } from "~/jobs/news/queries.ts";
import { CommentQueries } from "~/jobs/comment/queries.ts";
import { Time } from "~/jobs/time/index.ts";

type Props = {
  news: {
    id: number;
    title: string;
    url: string | null;
    urlHost: string | null;
    createdAt: string;
    content: string | null;
    username: string;
  };
  voteCount: number;
  hasVoted: boolean;
  comments: {
    id: number;
    content: string;
    userId: string;
    username: string;
    createdAt: typeof comments.$inferSelect["createdAt"];
    parentId: number | null;
    hasUpvoted: boolean;
  }[];
};

export const handler: Handlers<Props> = {
  async GET(req, ctx) {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const newsId = ctx.params.id;
    if (!newsId || isNaN(Number(newsId)) || Number(newsId) < 1) {
      return ctx.renderNotFound();
    }

    const data = await NewsQueries.DetailPageQuery({ id: Number(newsId), userId: session?.user.id });

    if (data.isErr()) {
      console.error(data.error);
      return ctx.renderNotFound();
    }

    const { news, comments, voteCount, hasVoted } = data.value;

    return ctx.render({
      news,
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        username: comment.user.name,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
        hasUpvoted: comment.hasUpvoted,
      })),
      voteCount,
      hasVoted,
    });
  },

  async POST(req, ctx) {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response(null, {
        status: 303,
        headers: {
          "Location": "/login",
        },
      });
    }

    const newsId = ctx.params.id;
    if (!newsId || isNaN(Number(newsId)) || Number(newsId) < 1) {
      return ctx.renderNotFound();
    }

    const form = await req.formData();
    const text = form.get("text")?.toString();

    if (!text || text.trim().length === 0) {
      return new Response(null, {
        status: 303,
        headers: {
          "Location": `/news/${newsId}`,
        },
      });
    }

    try {
      const result = await CommentQueries.CreateComment({
        content: text.trim(),
        postId: Number(newsId),
        userId: session.user.id,
        parentId: null,
      });

      if (result.isErr()) {
        console.error("Error creating comment:", result.error);
        return new Response(null, {
          status: 303,
          headers: {
            "Location": `/news/${newsId}`,
          },
        });
      }

      return new Response(null, {
        status: 303,
        headers: {
          "Location": `/news/${newsId}`,
        },
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      return new Response(null, {
        status: 303,
        headers: {
          "Location": `/news/${newsId}`,
        },
      });
    }
  },
};

export default function Home(props: PageProps<Props>) {
  return (
    <div>
      <div className="mb-4 break-keep max-w-screen-sm text-left mx-auto">
        <div className="px-4">
          <div className="mb-8">
            <a
              href={props.data.news.url ?? ""}
              target="_blank"
              className="hover:underline underline-offset-4 text-2xl text-gray-900"
            >
              {props.data.news.title}
            </a>
            <span className="text-gray-400 text-xs ml-1">({props.data.news.urlHost})</span>
            <div className="flex flex-wrap text-xs items-center text-gray-400 gap-1">
              <UpvoteButton
                postId={props.data.news.id}
                initialVoteCount={props.data.voteCount}
                hasVoted={props.data.hasVoted}
              />
              <span>|</span>
              <span>{props.data.comments.length} opinions</span>
              <span>|</span>
              <span>{Time.Ago(props.data.news.createdAt)}</span>
              <span>by {props.data.news.username}</span>
            </div>
          </div>

          <div className="mb-16">
            <p className="text-sm text-gray-500">
              {props.data.news.content}
            </p>
          </div>

          <div className="mb-16">
            <form action={`/api/news/${props.data.news.id}/comments`} method="post" id="comment">
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
              className="mt-4 text-medium text-blue-600 underline-offset-4 underline"
            >
              add comment
            </button>
          </div>

          <CommentsContainer comments={props.data.comments} newsId={props.data.news.id} />
        </div>
      </div>
    </div>
  );
}
