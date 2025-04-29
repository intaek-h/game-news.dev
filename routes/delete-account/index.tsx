import { Handlers, PageProps, RouteConfig } from "$fresh/server.ts";
import { auth } from "~/auth.ts";
import { user } from "~/db/migrations/schema.ts";
import { eq } from "drizzle-orm";
import { db } from "~/db/client.ts";
import { defaultCSP } from "~/jobs/utils/csp.ts";
import DeleteForm from "~/islands/delete-form.tsx";

interface Props {
  error?: string;
}

export const handler: Handlers<Props> = {
  async GET(req, ctx) {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/login",
        },
      });
    }

    return ctx.render();
  },

  async POST(req, ctx) {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/login",
        },
      });
    }

    try {
      await db.update(user)
        .set({
          deletedAt: new Date(),
          name: "[deleted]",
          // leave email for future recovery or inquiry
        })
        .where(eq(user.id, session.user.id))
        .execute();

      // Sign out the user
      const headers = new Headers();
      headers.set("location", "/");
      await auth.api.signOut({
        headers: req.headers,
      });

      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      return ctx.render({
        error: "Something went wrong while deleting your account. Contact the admin if the problem persists.",
      });
    }
  },
};

export default function DeleteAccount(props: PageProps<Props>) {
  defaultCSP();

  return (
    <div className="max-w-[400px] mx-auto">
      <DeleteForm error={props.data?.error} />
    </div>
  );
}

export const config: RouteConfig = {
  csp: true,
};
