import { FreshContext } from "$fresh/server.ts";
import { NavBar } from "~/components/nav-bar.tsx";
import { auth } from "~/auth.ts";

export default async function Layout(req: Request, ctx: FreshContext) {
  const session = await auth.api.getSession({
    headers: req.headers, // you need to pass the headers object.
  });

  return (
    <div class="layout">
      <NavBar user={session?.user} />
      <ctx.Component />
    </div>
  );
}
