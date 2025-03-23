import { Handlers, PageProps } from "$fresh/server.ts";
import { auth } from "~/auth.ts";
import { APIError } from "better-auth/api";

interface Props {
  error: string;
}

export const handler: Handlers<Props> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();
    const name = form.get("name")?.toString();

    if (!email || !password || !name) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    try {
      const response = await auth.api.signUpEmail({
        body: {
          email: email,
          password: password,
          name: name,
        },
        headers: req.headers,
        asResponse: true,
        returnHeaders: true,
      });

      const cookies = response.headers.get("set-cookie");
      const headers = new Headers();
      headers.set("location", "/");
      headers.set("set-cookie", cookies || "");
      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      console.error("error is: ", error);
      if (error instanceof APIError) {
        return ctx.render({
          error: error.message,
        });
      }

      return ctx.render({
        error: "Something went wrong",
      });
    }
  },
};

export default function Home(props: PageProps<Props>) {
  return (
    <div className="">
      <form
        method="post"
        action="/register"
        encType="multipart/form-data"
        className="my-4 px-4 w-[300px]"
      >
        <div class="mb-4">
          <label
            htmlFor="email"
            className="block text-gray-700 text-sm font-medium mb-1"
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="border border-black p-0.5"
            placeholder="abc@example.com"
          />
        </div>

        <div class="mb-4">
          <label
            htmlFor="password"
            className="block text-gray-700 text-sm font-medium mb-1"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            className="border border-black p-0.5"
            placeholder="a very strong password"
          />
        </div>

        <div class="mb-4">
          <label
            htmlFor="confirm-password"
            className="block text-gray-700 text-sm font-medium mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            name="confirm-password"
            id="confirm-password"
            required
            className="border border-black p-0.5"
            placeholder="confirm your password"
          />
        </div>

        <div class="mb-4">
          <label
            htmlFor="name"
            className="block text-gray-700 text-sm font-medium mb-1"
          >
            Display Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className="border border-black p-0.5"
            placeholder="Slick Rick"
          />
        </div>

        <hr />

        <button
          type="submit"
          className="mt-4 text-medium text-blue-900 underline"
        >
          Submit For Registration
        </button>

        {props.data?.error ? <p>{props.data.error}</p> : null}
      </form>
    </div>
  );
}
