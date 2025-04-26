import { Head } from "$fresh/runtime.ts";
import { RouteConfig } from "$fresh/server.ts";
import { defaultCSP } from "~/jobs/utils/csp.ts";

export default function Error500Page() {
  defaultCSP();

  return (
    <>
      <Head>
        <title>sorry</title>
      </Head>
      <div class="max-w-screen-sm text-center mx-auto font-mono">
        <span>sorry, something went wrong</span>
      </div>
    </>
  );
}

export const config: RouteConfig = {
  csp: true,
};
