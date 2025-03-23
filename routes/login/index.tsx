import { Handlers } from "$fresh/server.ts";
import { auth } from "~/auth.ts";

export const handler: Handlers = {
  async POST(req) {
    const form = await req.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();

    if (!email || !password) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const response = await auth.api.signInEmail({
      body: {
        email: email,
        password: password,
        callbackUrl: "/",
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
  },
};

export default function Home() {
  return (
    <div className="">
      <form
        method="post"
        action="/login"
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

        <hr />

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
  );
}
