import { RouteConfig } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { defaultCSP } from "~/jobs/utils/csp.ts";

export default function Home() {
  defaultCSP();

  return (
    <>
      <Head>
        <title>Welcome!</title>
      </Head>
      <div className="max-w-[400px] mx-auto text-center">
        <p className="text-2xl font-bold">Welcome to Game-News.dev!</p>
        <p>
          Your registration is just <strong>one step</strong> away.
        </p>
        <p>We've sent you an email to verify your account.</p>
        <p>
          It's most likely in your spam folder.
        </p>
        <p>
          Please open the email from{" "}
          <code>
            {"<"}
            <strong>registration@verify.game-news.dev</strong>
            {">"}
          </code>
          <br />
          and click the link to verify your account.
        </p>
      </div>
    </>
  );
}

export const config: RouteConfig = {
  csp: true,
};
