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
      return ctx.render({
        error: "Missing required fields",
      });
    }

    try {
      const { headers } = await auth.api.signUpEmail({
        body: {
          email: email,
          password: password,
          name: name,
        },
        headers: req.headers,
        returnHeaders: true,
      });

      headers.set("location", "/");

      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
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
        action={`/register`}
        encType="multipart/form-data"
        className="my-4 px-4 mx-auto w-[300px]"
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
          Submit For Registration
        </button>
      </form>
    </div>
  );
}
