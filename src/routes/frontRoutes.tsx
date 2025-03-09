import { Context, Hono } from "@hono/hono";
import { type FC } from "@hono/hono/jsx";
import { db } from "~/db/client.ts";
import { articles, genTimes } from "~/db/migrations/schema.ts";
import { desc, eq } from "drizzle-orm";
import { parse } from "marked";
import articleRouter from "~/src/routes/articleRoutes.ts";

// Create a router for article endpoints
const frontRouter = new Hono();

const Layout: FC = (props) => {
  return (
    <html>
      <body>{props.children}</body>
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

  console.log("res", c.req.url);

  const requestNewArticles = await fetch(
    "http://localhost:8000/api/articles/generate",
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
