import { Handlers, PageProps } from "$fresh/server.ts";
import { auth } from "~/auth.ts";
import { NewsQueries } from "~/jobs/news/queries.ts";

interface Props {
  error: string;
}

export const handler: Handlers<Props> = {
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

    const form = await req.formData();
    const url = form.get("url")?.toString();
    const title = form.get("title")?.toString();
    const content = form.get("content")?.toString();

    if (!url || !title) {
      return ctx.render({
        error: "URL and title are required",
      });
    }

    try {
      const result = await NewsQueries.CreatePost({
        userId: session.user.id,
        postType: "news",
        title: title,
        content: content || null,
        url: url,
        urlHost: new URL(url).hostname,
      });

      if (result.isErr()) {
        console.error("Error creating post:", result.error);
        return ctx.render({
          error: result.error.message,
        });
      }

      if (result.value.isDuplicate) {
        return new Response(null, {
          status: 303,
          headers: {
            "Location": `/news/${result.value.id}`,
          },
        });
      }

      return new Response(null, {
        status: 303,
        headers: {
          "Location": `/news/${result.value.id}`,
        },
      });
    } catch (error) {
      console.error("Error creating post:", error);
      return ctx.render({
        error: "Something went wrong",
      });
    }
  },
};

export default function Home(props: PageProps<Props>) {
  return (
    <div className="max-w-[400px] mx-auto">
      <form
        method="post"
        action={`/submit`}
        encType="multipart/form-data"
        className="my-4 px-4"
      >
        <div class="mb-6">
          <label
            htmlFor="url"
            className="block text-gray-500 text-sm mb-1"
          >
            the url
          </label>
          <input
            type="url"
            name="url"
            id="url"
            required
            pattern="https?://.+"
            className="border border-black p-0.5 w-full font-mono"
            placeholder="https://example.com"
          />
          <p className="text-xs text-gray-500 mt-1">must start with https://</p>
        </div>

        <div class="mb-6">
          <label
            htmlFor="title"
            className="block text-gray-500 text-sm mb-1"
          >
            the title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            maxLength={100}
            className="border border-black p-0.5 w-full font-mono"
            placeholder="CUDA is going open source"
          />
          <p className="text-xs text-gray-500 mt-1">Max 100 characters</p>
        </div>

        <div class="mb-6">
          <label
            htmlFor="content"
            className="block text-gray-500 text-sm mb-1"
          >
            description(optional)
          </label>
          <textarea
            name="content"
            id="content"
            rows={4}
            maxLength={1000}
            className="border border-black p-0.5 w-full font-mono"
            placeholder="more story to add. if you have any"
          />
          <p className="text-xs text-gray-500 mt-1">Max 1000 characters</p>
        </div>

        <hr />

        {props.data?.error
          ? (
            <p className="mt-2 text-sm text-red-700 italic">
              {props.data.error}
            </p>
          )
          : null}

        <button
          type="submit"
          className="mt-4 text-medium text-blue-900 underline"
        >
          Submit News
        </button>
      </form>
    </div>
  );
}
