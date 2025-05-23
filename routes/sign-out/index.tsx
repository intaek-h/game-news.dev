import { Handlers, RouteConfig } from "$fresh/server.ts";
import { auth } from "~/auth.ts";
import { defaultCSP } from "~/jobs/utils/csp.ts";
export const handler: Handlers = {
  async GET(req) {
    const response = await auth.api.signOut({
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
      headers: headers,
    });
  },
};

export default function Page() {
  defaultCSP();

  return (
    <div>
      don't go
    </div>
  );
}

export const config: RouteConfig = {
  csp: true,
};
