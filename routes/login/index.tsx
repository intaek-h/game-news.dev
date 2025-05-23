import { Handlers, PageProps, RouteConfig } from "$fresh/server.ts";
import { auth } from "~/auth.ts";
import { APIError } from "better-auth/api";
import { Head } from "$fresh/runtime.ts";
import { defaultCSP } from "~/jobs/utils/csp.ts";

interface Props {
  error: string;
}

export const handler: Handlers<Props> = {
  async GET(req, ctx) {
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (session) {
        return new Response(null, {
          status: 302,
          headers: new Headers({
            location: "/",
          }),
        });
      }

      return ctx.render();
    } catch (error) {
      console.error("Error fetching session: ", error);
      return ctx.render();
    }
  },

  async POST(req, ctx) {
    try {
      const form = await req.formData();
      const email = form.get("email")?.toString();
      const password = form.get("password")?.toString();

      if (!email || !password) {
        return ctx.render({
          error: "Missing required fields",
        });
      }

      const { headers } = await auth.api.signInEmail({
        body: {
          email: email,
          password: password,
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
        <title>Login</title>
      </Head>
      <div className="max-w-[400px] mx-auto">
        <form
          method="post"
          action={`/login`}
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
              placeholder="****"
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
            Login
          </button>

          <a
            href="/register"
            className="mt-4 ml-4 text-medium text-gray-400 underline"
          >
            I'm here to register
          </a>
        </form>
      </div>
    </>
  );
}

export const config: RouteConfig = {
  csp: true,
};
