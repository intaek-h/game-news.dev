import { Handlers, PageProps, RouteConfig } from "$fresh/server.ts";
import { auth } from "~/auth.ts";
import { APIError } from "better-auth/api";
import { Head } from "$fresh/runtime.ts";
import { defaultCSP } from "~/jobs/utils/csp.ts";
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
    if (password.length < 8) {
      return ctx.render({
        error: "Password must be at least 8 characters long",
      });
    }
    if (name.length < 3 || name.length > 20) {
      return ctx.render({
        error: "Display name must be between 3 and 20 characters",
      });
    }
    if (!/^[a-zA-Z0-9]+(?:[ _-][a-zA-Z0-9]+)*$/.test(name)) {
      return ctx.render({
        error: "Name can only contain letters, numbers, single spaces, dashes and underscores",
      });
    }
    if (email.length > 100) {
      return ctx.render({
        error: "Email too long",
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
  defaultCSP();

  return (
    <>
      <Head>
        <title>Register</title>
      </Head>
      <div className="max-w-[400px] mx-auto">
        <form
          method="post"
          action={`/register`}
          encType="multipart/form-data"
          className="my-4 px-4"
        >
          <div class="mb-6">
            <label htmlFor="email" className="block text-gray-500 text-sm mb-1">
              email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="border border-black p-0.5 w-full font-mono px-1"
              placeholder="abc@example.com"
            />
          </div>

          <div class="mb-6">
            <label htmlFor="password" className="block text-gray-500 text-sm mb-1">
              password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              className="border border-black p-0.5 w-full font-mono px-1"
              placeholder="at least 8 characters long"
            />
          </div>

          <div class="mb-6">
            <label htmlFor="name" className="block text-gray-500 text-sm mb-1">
              displayed name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="border border-black p-0.5 w-full font-mono px-1"
              placeholder="john carmack"
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
    </>
  );
}

export const config: RouteConfig = {
  csp: true,
};
