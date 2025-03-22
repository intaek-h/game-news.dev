import { authClient } from "~/auth-client.ts";

export function Login() {
  const handleSignIn = async (event: Event) => {
    const { data, error } = await authClient.signIn.email({
      /**
       * The user email
       */
      email: "123",
      /**
       * The user password
       */
      password: "123",
      /**
       * a url to redirect to after the user verifies their email (optional)
       */
      callbackURL: "/",
      /**
       * remember the user session after the browser is closed.
       * @default true
       */
      rememberMe: false,
    });

    console.log("data", data);
    console.log("error", error);
  };
  return (
    <div class="flex flex-col items-center justify-center h-screen">
      <h1 class="text-4xl font-bold mb-4">Login</h1>
      <button type="button" onClick={handleSignIn}>test login</button>
      <form
        action="/api/auth/login"
        method="POST"
      >
        <div class="mb-4">
          <label
            htmlFor="email"
            class="block text-gray-700 text-sm font-bold mb-2"
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div class="mb-4">
          <label
            htmlFor="password"
            class="block text-gray-700 text-sm font-bold mb-2"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Login
        </button>
      </form>
    </div>
  );
}
