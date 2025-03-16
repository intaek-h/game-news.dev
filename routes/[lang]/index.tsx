import { RouteContext } from "$fresh/server.ts";
import { LanguageAtom } from "~/jobs/atoms/language.ts";
import { ArticleAtom } from "~/jobs/atoms/article.ts";
import { ArticleViewer } from "../../islands/articles/article-viewer.tsx";

export default async function Home(_req: Request, ctx: RouteContext) {
  const { lang } = ctx.params;

  const { data, error } = await LanguageAtom.GetAllLanguages();

  if (error || !data || !data.some((l) => l.code === lang)) {
    console.error("Error fetching languages", error);
    return ctx.renderNotFound();
  }

  const { data: recentArticles, error: recentArticlesErr } = await ArticleAtom
    .GetRecentArticles(lang);

  if (recentArticlesErr || !recentArticles) {
    return (
      <div>
        <div>hello</div>
        <span>no articles to show {lang}</span>
      </div>
    );
  }

  return (
    <div>
      <a href="/">Read English</a>
      {recentArticles.filter((a) => typeof a.article === "object").map((
        article,
        i,
      ) => (
        <div>
          <ArticleViewer content={article.article!} />
          {i !== recentArticles.length - 1 ? <hr className="my-6" /> : null}
        </div>
      ))}
    </div>
  );
}
