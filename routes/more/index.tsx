import { Handlers, PageProps, RouteConfig } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { auth } from "~/auth.ts";
import { QueryParamsAtom } from "../../jobs/utils/query-params.ts";
import { defaultCSP } from "~/jobs/utils/csp.ts";

interface Props {
  user?: typeof auth.$Infer.Session.user;
}

export const handler: Handlers<Props> = {
  async GET(req, ctx) {
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (session) {
        return ctx.render({
          user: session.user,
        });
      }

      return ctx.render();
    } catch (error) {
      console.error("Error fetching session: ", error);
      return ctx.render();
    }
  },
};

export default function Home(props: PageProps<Props>) {
  defaultCSP();

  const how_we_rank = "how we rank";

  const menus = props.data?.user
    ? [
      { name: "submit", href: "/submit" },
      { name: how_we_rank, href: "https://github.com/intaek-h/game-news.dev?tab=readme-ov-file#game-news" },
      { name: "sign out", href: "/sign-out" },
      { name: "delete account", href: "/delete-account" },
    ]
    : [
      { name: "login", href: "/login" },
      { name: "register", href: "/register" },
      { name: how_we_rank, href: "https://github.com/intaek-h/game-news.dev?tab=readme-ov-file#game-news" },
    ];

  const focus = props.url.searchParams.get(QueryParamsAtom.Focus.key);
  if (focus === QueryParamsAtom.Focus.vals.HowWeRank) {
    menus.sort((a, b) => {
      if (a.name === how_we_rank) return -1;
      if (b.name === how_we_rank) return 1;
      return 0;
    });
  }

  return (
    <>
      <Head>
        <title>More</title>
      </Head>
      <div>
        <div className="px-4 mb-4 break-keep max-w-screen-sm text-center mx-auto">
          {menus.map((menu) => (
            <div key={menu.name} className="mb-8 text-xl">
              <a
                href={menu.href}
                target={menu.name === how_we_rank ? "_blank" : "_self"}
                className={`hover:underline underline-offset-4 ${menu.name === "submit" ? "text-blue-700" : ""}`}
              >
                {menu.name}
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const config: RouteConfig = {
  csp: true,
};
