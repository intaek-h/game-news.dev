import { Head } from "$fresh/runtime.ts";
import { RouteConfig } from "$fresh/server.ts";
import { defaultCSP } from "~/jobs/utils/csp.ts";

export default function Error404() {
  defaultCSP();

  return (
    <>
      <Head>
        <title>No</title>
      </Head>
      <div class="max-w-screen-sm text-center mx-auto font-mono">
        <span>door is the other way</span>
      </div>
    </>
  );
}

export const config: RouteConfig = {
  csp: true,
};
