import { Context, Hono } from "@hono/hono";
import { type FC } from "@hono/hono/jsx";
import { css, Style } from "@hono/hono/css";
import { db } from "~/db/client.ts";
import { articles, genTimes } from "~/db/migrations/schema.ts";
import { desc, eq } from "drizzle-orm";
import { parse } from "marked";

const SELF_URL = Deno.env.get("SELF_URL");

const frontRouter = new Hono();

const Layout: FC<{ title?: string; children: unknown }> = (props) => {
  const globalClass = css`
    :-hono-global {
      html {
        -moz-text-size-adjust: none;
        -webkit-text-size-adjust: none;
        text-size-adjust: none;
        font-size: 16px;
        word-break: keep-all;
      }

      body {
        max-width: 800px;
        margin: 0 auto;
        min-height: 100vh;
        line-height: 1.5;
      }

      h1,
      h2,
      h3,
      h4,
      button,
      input,
      label {
        line-height: 1.1;
      }

      h1,
      h2,
      h3,
      h4 {
        text-wrap: balance;
      }

      a {
        text-underline-offset: 0.15rem;
      }
    }
  `;

  return (
    <html>
      <head>
        <Style />
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/bundle.css" />
        <link rel="icon" type="image/png" href="/assets/icon.png" />
        <meta property="og:image" content="/assets/og-image.png" />
        <title>{props.title ?? "Game News"}</title>
      </head>
      <body>
        <div class={globalClass}>
          {props.children}
        </div>
      </body>
    </html>
  );
};

const Article: FC<{ content: string }> = async (props) => {
  const text = await parse(props.content);

  return <div dangerouslySetInnerHTML={{ __html: text }} />;
};

// Define routes
frontRouter.get("/", async (c: Context) => {
  const [lastGen] = await db.select().from(genTimes).orderBy(
    desc(genTimes.createdAt),
  ).limit(1).execute();

  // check if two hours has passed since last generation
  if (lastGen?.time) {
    const lastGenTime = new Date(lastGen.time);
    const now = new Date();
    const diff = now.getTime() - lastGenTime.getTime();
    if (diff < 1000 * 60 * 60 * 2) {
      const latestArticles = await db.select().from(articles).where(
        eq(articles.gid, lastGen.id),
      ).execute();

      if (latestArticles.length) {
        return c.html(
          <Layout>
            {latestArticles.map((article, i) => (
              <div>
                <Article content={article.article ?? ""} />
                {i !== latestArticles.length - 1 ? <hr /> : null}
              </div>
            ))}
          </Layout>,
        );
      }

      return c.html(
        <Layout>
          <div>hello {lastGen.time}</div>
        </Layout>,
      );
    }
  }

  const requestNewArticles = await fetch(
    `${SELF_URL}/api/articles/generate`,
    {
      method: "POST",
      headers: {
        "X-API-KEY": Deno.env.get("INTAEK_API_KEY") ?? "",
      },
    },
  );
  await requestNewArticles.json();

  return c.html(
    <Layout>
      <div>hello</div>
      <span>no articles to show</span>
    </Layout>,
  );
});

export default frontRouter;
