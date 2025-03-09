import { Context, Hono } from "@hono/hono";
import { type FC } from "@hono/hono/jsx";
import { css, Style } from "@hono/hono/css";
import { parse } from "marked";
import { ArticleService } from "~/src/services/articleService.ts";

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
        padding: 1rem;
        font-family: "Inter", sans-serif;
        font-size: 1rem;
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
  let firstParagraph = props.content.split("\n\n")[0] || "";
  // Remove leading and trailing markdown emphasis symbols
  firstParagraph = firstParagraph.replace(/^\*\*|\*\*$/g, "");
  const text = await parse(
    "## " + firstParagraph + "\n\n" +
      props.content.split("\n\n").slice(1).join("\n\n"),
  );

  return <div dangerouslySetInnerHTML={{ __html: text }} />;
};

// Define routes
frontRouter.get("/", async (c: Context) => {
  const recentArticles = await ArticleService.getRecentArticles();

  if (!recentArticles.length) {
    return c.html(
      <Layout>
        <div>hello</div>
        <span>no articles to show</span>
      </Layout>,
    );
  }

  return c.html(
    <Layout>
      {recentArticles.filter((a) => !!a.article).map((article, i) => (
        <div>
          <Article content={article.article ?? ""} />
          {i !== recentArticles.length - 1 ? <hr /> : null}
        </div>
      ))}
    </Layout>,
  );
});

export default frontRouter;
