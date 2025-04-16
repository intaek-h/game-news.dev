import { Handlers, PageProps } from "$fresh/server.ts";
import { auth } from "~/auth.ts";
import { QueryParamsAtom } from "~/jobs/atoms/query-params.ts";

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
  const how_we_rank = "how we rank";
  const how_we_gather = "how we gather gossips";

  const menus = props.data?.user
    ? [
      { name: "write", href: "/submit" },
      { name: "profile", href: "/profile" },
      { name: how_we_rank, href: "/how-we-rank" },
      { name: how_we_gather, href: "/how-we-gather" },
      { name: "leave", href: "/sign-out" },
      { name: "delete account", href: "/" },
    ]
    : [
      { name: "login", href: "/login" },
      { name: "register", href: "/register" },
      { name: how_we_rank, href: "/how-we-rank" },
      { name: how_we_gather, href: "/how-we-gather" },
    ];

  const focus = props.url.searchParams.get(QueryParamsAtom.Focus.key);
  if (focus === QueryParamsAtom.Focus.vals.HowWeRank) {
    menus.sort((a, b) => {
      if (a.name === how_we_rank) return -1;
      if (b.name === how_we_rank) return 1;
      return 0;
    });
  }
  if (focus === QueryParamsAtom.Focus.vals.HowWeGatherGossips) {
    menus.sort((a, b) => {
      if (a.name === how_we_gather) return -1;
      if (b.name === how_we_gather) return 1;
      return 0;
    });
  }

  return (
    <div>
      <div className="px-4 mb-4 break-keep max-w-screen-sm text-center mx-auto">
        {menus.map((menu) => (
          <div key={menu.name} className="mb-8 text-xl">
            <a href={menu.href} className="hover:underline underline-offset-4">
              {menu.name}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
