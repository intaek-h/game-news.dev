import { chatAnthropicHaiku, chatAnthropicSonnet } from "~/jobs/utils/anthropic.ts";
import { chatPerplexity } from "~/jobs/utils/perplexity.ts";
import { unstableJsonParser } from "~/jobs/utils/json.ts";
import { ArticleEntities, ArticleFormat, DeveloperArticleCandidate } from "~/types/articleFormat.ts";
import { chatGoogleGemini } from "~/jobs/utils/google.ts";

export class ArticleAiAtom {
  static FilterHotTopics = async (
    d: { rawTopics: string[]; recentTopics: string[] },
  ) => {
    const { rawTopics, recentTopics } = d;
    const startTime = performance.now();
    const systemPrompt = Deno.readTextFileSync(
      Deno.cwd() + "/jobs/system-prompts/hot-gaming-topic-evaluation.txt",
    );
    const informativeTopics = await chatAnthropicSonnet({
      systemP: systemPrompt,
      message: rawTopics.join("\n"),
    });

    const informativeTopicText = informativeTopics.find((c) => c.type === "text")?.text;

    if (!informativeTopicText) {
      return "";
    }

    if (!recentTopics.length) {
      return informativeTopicText;
    }

    const dedupSystemPrompt = Deno.readTextFileSync(
      Deno.cwd() + "/jobs/system-prompts/topic-deduplication.txt",
    );
    const deduplicatedTopics = await chatAnthropicSonnet({
      systemP: dedupSystemPrompt,
      message: [
        `<Recent Topics>\n${recentTopics.join("\n")}\n</Recent Topics>`,
        `<New Topics>\n${informativeTopicText}</New Topics>`,
      ].join("\n\n"),
    });

    const deduplicatedTopicText = deduplicatedTopics.find((c) => c.type === "text")?.text;

    if (!deduplicatedTopicText) {
      return "";
    }

    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      `[...] AI Topic Filtering Finished (${deduplicatedTopicText.split("\n").length}).`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return deduplicatedTopicText ?? "";
  };

  static WriteArticles = async (topics: string[]) => {
    const startTime = performance.now();
    const systemPrompt = Deno.readTextFileSync(
      Deno.cwd() + "/jobs/system-prompts/english-article-generation.txt",
    );
    const articlePromise = topics.map((t) =>
      chatPerplexity({
        systemP: systemPrompt,
        message: t,
      })
    );
    const articles = await Promise.all(articlePromise);

    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      `[...] AI Article Writing Finished. (${articles.length})`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return articles.filter((a) => !!a);
  };

  static async InspectArticle(articles: string[]) {
    const startTime = performance.now();
    const systemPrompt = Deno.readTextFileSync(
      Deno.cwd() + "/jobs/system-prompts/final-article-inspection.txt",
    );
    const articlePromise = articles.map((t) =>
      chatAnthropicSonnet({
        systemP: systemPrompt,
        message: t,
      })
    );

    const finalArticles = await Promise.all(articlePromise);

    const endTime = performance.now();

    const result = finalArticles
      .map((a) => a.find((c) => c.type === "text")?.text ?? "")
      .filter((v) => "<fail>" !== v.trim())
      .map((v) => {
        let result = unstableJsonParser<ArticleFormat>({ maybeJson: v });
        if (!result) return;
        if (Array.isArray(result)) {
          result = result[0];
        }
        return JSON.stringify(result);
      })
      .filter((v) => typeof v === "string");

    console.info(
      "\x1b[32m",
      `[...] AI Article Inspection Finished. (${result.length})`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return result;
  }

  static async TranslateArticles(articles: string[]) {
    const startTime = performance.now();
    const systemPrompt = Deno.readTextFileSync(
      Deno.cwd() + "/jobs/system-prompts/english-to-korean-article-translation.txt",
    );
    const articlePromise = articles.map((t) =>
      chatAnthropicSonnet({
        systemP: systemPrompt,
        message: t,
      })
    );

    const translatedArticles = await Promise.all(articlePromise);

    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      `[...] AI Article Translation Finished. (${translatedArticles.length})`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return translatedArticles
      .map((a) => a.find((c) => c.type === "text")?.text ?? "")
      .filter((v) => "<fail>" !== v.trim())
      .map((v) => {
        let result = unstableJsonParser<ArticleFormat>({ maybeJson: v });
        if (!result) return;
        if (Array.isArray(result)) {
          result = result[0];
        }
        return JSON.stringify(result);
      })
      .filter((v) => typeof v === "string");
  }

  static async ExtractEntities(article: string) {
    const startTime = performance.now();
    const systemPrompt = Deno.readTextFileSync(
      Deno.cwd() + "/jobs/system-prompts/article-entity-extraction.txt",
    );
    const result = await chatAnthropicHaiku({
      systemP: systemPrompt,
      message: article,
    });

    const endTime = performance.now();

    const reply = result.find((c) => c.type === "text")?.text;

    let entities = unstableJsonParser<ArticleEntities>({
      maybeJson: reply ?? "",
    });
    if (Array.isArray(entities)) {
      entities = entities[0];
    }

    console.info(
      "\x1b[32m",
      `[...] AI Entity Extraction Finished.`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    if (
      !entities ||
      (
        entities.companies.length === 0 &&
        entities.people.length === 0 &&
        entities.products.length === 0
      )
    ) {
      return;
    }

    return entities;
  }

  static async SelectUsefulGameDevNewsTitles(
    data: DeveloperArticleCandidate[],
  ) {
    const startTime = performance.now();
    const systemPrompt = Deno.readTextFileSync(
      Deno.cwd() + "/jobs/system-prompts/game-dev-news-title-selection.txt",
    );
    const result = await chatGoogleGemini({
      systemP: systemPrompt,
      message: JSON.stringify(data),
    });

    const parsed = unstableJsonParser<DeveloperArticleCandidate[]>({
      maybeJson: result.text ?? "",
    });

    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      `[...] AI Game Developer News Selection Finished.`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return (parsed ?? []).filter((v) => v.isSelected);
  }
}
