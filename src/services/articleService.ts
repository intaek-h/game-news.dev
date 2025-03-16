import { db } from "~/db/client.ts";
import { articles, hotTopics, translations } from "~/db/migrations/schema.ts";
import { and, desc, eq, gte } from "drizzle-orm";
import { RedditScrapingResult } from "~/src/models/redditScraper.ts";
import { chatAnthropic } from "~/src/utils/anthropic.ts";
import { chatPerplexity } from "~/src/utils/perplexity.ts";
import { unstableJsonParser } from "~/src/utils/json.ts";
import { ArticleFormat } from "~/src/types/articleFormat.ts";

const INTAEK_API_KEY = Deno.env.get("INTAEK_API_KEY");

export class ArticleService {
  // Get a single article by ID
  static async getArticleById(id: number) {
    const results = await db.select().from(articles).where(eq(articles.id, id));
    return results[0];
  }

  static scrapeRedditTopics = async () => {
    const startTime = performance.now();

    const urlParams = new URLSearchParams();
    urlParams.append("subreddits", "gaming,Games,IndieGaming,pcgaming");
    urlParams.append("limit", "4");
    urlParams.append("min_score", "3");
    urlParams.append("time_window", "86400");
    const response = await fetch(
      `https://subreddit-scraper-production.up.railway.app/api/topics?${urlParams}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": INTAEK_API_KEY ?? "",
        },
      },
    );

    const data = await response.json() as RedditScrapingResult;
    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      `[...] Raw Topic Scraping Finished (${data.total_count}).`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return data;
  };

  static filterRawTopics = async (
    d: { rawTopics: string[]; recentTopics: string[] },
  ) => {
    const { rawTopics, recentTopics } = d;
    const startTime = performance.now();

    const informativeTopics = await chatAnthropic({
      systemP: [
        "You are an AI assistant trained to identify clusters of trending topics in the gaming world right now.",
        "Extract the noteworthy and informative topics from the given pile of text data.",
        "Remember data is collected from the recently published news articles, hot reddit posts, and hot youtube video titles.",
        "Your response MUST be formatted in the following format: ONLY return the extracted topics separated by new lines and NEVER say anything other than that.",
      ].join(" "),
      message: rawTopics.join("\n"),
    });

    const informativeTopicText = informativeTopics.find((c) =>
      c.type === "text"
    )?.text;

    if (!informativeTopicText) {
      return "";
    }

    if (!recentTopics.length) {
      return informativeTopicText;
    }

    const deduplicatedTopics = await chatAnthropic({
      systemP: [
        "You are an AI assistant trained to filter duplicate topics before writing articles.",
        'You will be given the "Recent Article Topics" and "New Topics" to write articles about.',
        "Both will be wrapped in <Recent Topics>, <New Topics> block, and each topic will be separated by new line(\n).",
        `For each topic of "New Topics", you must check if it's a duplicate of one of "Recent Article Topics".`,
        'If duplicate, remove it from the "New Topics"',
        'As result, you MUST ONLY RETURN THE "New Topics", WITHOUT DUPLICATES, WITHOUT BLOCK TAGS, JUST THE TOPICS, AS IT IS.',
      ].join(" "),
      message: [
        `<Recent Topics>\n${recentTopics.join("\n")}\n</Recent Topics>`,
        `<New Topics>\n${informativeTopicText}</New Topics>`,
      ].join("\n\n"),
    });

    const deduplicatedTopicText = deduplicatedTopics.find((c) =>
      c.type === "text"
    )?.text;

    if (!deduplicatedTopicText) {
      return "";
    }

    const endTime = performance.now();

    console.info(
      "\x1b[32m",
      `[...] AI Topic Filtering Finished (${
        deduplicatedTopicText.split("\n").length
      }).`,
      "\x1b[0m",
      `(Took ${(endTime - startTime) / 1000}s)`,
    );

    return deduplicatedTopicText ?? "";
  };

  static writeArticles = async (topics: string[]) => {
    const startTime = performance.now();

    const articlePromise = topics.map((t) =>
      chatPerplexity({
        systemP:
          `You are an AI assistant trained to summarize the news on a topic.
You will be given a topic in the "gaming world".
Do a research on the topic and write the title and the key points of the news.
If there's a room for a table data, add it optionally.

Your answer MUST BE RETURNED IN JSON: {"title":"","key_points":[],"table":{header:[],rows:[]}}.

Title Guidelines:
- The title should be written in a 6th-grade reading level.
- The title should not be longer than 10 words.
- Remove unnecessary words and keep it simple.

Good/Bad Title Example #1
Bad: "The New Game Console from Sony is Expected to be Released in 2023"
Good: "Sony's New Console Coming in 2023"

Good/Bad Title Example #2
Bad: "Assassin's Creed Shadows Length Revealed: Shorter Than Valhalla"
Good: "Assassin's Creed Shadows Is Shorter Than Valhalla"

Good/Bad Title Example #3
Bad: "Real Ballerina Moves Power New Video Game Fight System"
Good: "Ballerina Moves Power The Game Fight System"

Good/Bad Title Example #4
Bad: "Lego Builds Own Game Studio After Hitting Record Sales"
Good: "Lego Builds Game Studio After Record Sales"

Key Points Guidelines:
- The key points should be 3 to 8 points.
- Each point must contain one short sentence.
- Each point must be easy to read.
- Do not include any emoji or special characters.
- Only include plain text. No markdown.

Key Points Example #1
["Sony announced a new console coming in 2023.","It is AAA title exclusive to the console."]

Key Points Example #2
["Recent leaks suggest the game has short play time.","Main story takes 30-40 hours to complete.","Its expansion Claws of Awaji adds extra 10 hours."]

Key Points Example #3
["Kinesiology experts designed fight sequences using real dancers' biomechanics.","It is a unique approach to game design.","The motions were captured using multi-sensor systems to create lifelike martial arts animations."]

Table Guidelines:
- The table is optional. 
- The table can be empty if it's not relavant to the article, or if there's no data to show.
- The table should be in the following format: {header:[],rows:[]}.
- Only include plain text. No markdown.

Table Example #1
{header:["Name","Age","Address"],rows:[["John Doe","25","123 Main St."],["Jane Doe","30","456 Elm St."]]}

Table Example #2
{header:["Title","Main Story","Full Completion"],rows:[["AC Origins","30 hrs","85 hrs"],["AC Odyssey","45 hrs","144 hrs"],["AC Valhalla","61 hrs","148 hrs"]]}

Table Example #4 (Empty Table)
{header:[],rows:[]}

IMPORTANT! DO NOT ADD ANY TEXT OTHER THAN THE JSON IN YOUR REPLY.`,
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

  static async finalArticleInspection(articles: string[]) {
    const startTime = performance.now();
    const systemPrompt =
      `You are an AI assistant to take charge of the final inspection of draft news articles before being published.
You will be given one draft article in the JSON format.

The ARTICLE FORMAT: {"title":"","key_points":[],"table":{header:[],rows:[]}}

Read the instructions below and return the polished article in the SAME FORMAT.

Here are the list of your jobs:
1. Text Style Inspection
2. Article Structure Check
3. Typo-Check

Text Style Inspection Guidelines
- The article must be in a plain text, without any styles.
- Strip all markdown attributes. (** or ()[] and etc)
- Strip all html tags. (<time>, <li>, and etc)
- Strip all citation marks ([1], [2])

Text Style Inspection Example #1
AS IS: <time datetime='late_25'>Late '25</time>
TO BE: Late '25

Text Style Inspection Example #2
AS IS: <ul><li>Partner-made design</li><li>Windows + Game Pass</li></ul>
TO BE: Partner-made design\nWindows + Game Pass

Text Style Inspection Example #3
AS IS: Performance gaps shrink significantly when playing at 4k resolution[1][6].
TO BE: Performance gaps shrink significantly when playing at 4k resolution.

Article Structure Check Guidelines
- Check if the given article is in the right format: {"title":"","key_points":[],"table":{header:[],rows:[]}}.
- Check if the table header and rows match. If it breaks, replace it with an empty table.
- Check if the article contains multi-line(\n) strings. Replace the "\n" with "\\n", so it doesn't break JSON parsing.

Article Structure Check Example #1 (Empty Table)
AS IS: {"title":"...","key_points":[],"table":{}}.
TO BE: {"title":"...","key_points":[],"table":{header:[],rows:[]}}.

Article Structure Check Example #2 (Breaking Table)
AS IS: {"title":"","key_points":[],"table":{header:["Name","Age","Address"],rows:[["John Doe","25"],["Jane Doe","30"]]}}.
TO BE: {"title":"","key_points":[],"table":{header:[],rows:[]}}.

Article Structure Check Example #3 (Multi-Line(\n) String)
AS IS: {"header":["Device","Release Window","Key Features"],"rows":[["Handheld","Late '25","Partner-made design\nWindows + Game Pass"]]}
TO BE: {"header":["Device","Release Window","Key Features"],"rows":[["Handheld","Late '25","Partner-made design\\nWindows + Game Pass"]]}

Typo-Check Guidelines
- Fix the typos in the article.
- Check if spaces and line breaks are properly set.
- Check if entity names are properly written.

Typo-Check Example #1
AS IS: The Ryzen9  995x³d beats all processors except its sibling R798x³d in most games
TO BE: The Ryzen9  995X3D beats all processors except its sibling R798X3D in most games

Typo-Check Example #2
AS IS: Performance gaps shrink significantly when playing at4k resolution
TO BE: Performance gaps shrink significantly when playing at 4k resolution

IMPORTANT! 
YOU MUST ONLY RETURN THE JSON FORMATTED ARTICLE.
DO NOT ADD ANY TEXT OTHER THAN THE JSON IN YOUR REPLY.

If you are unable to perform inspection or formatting due to the poor draft quality, JUST RETURN: <fail>`;

    const articlePromise = articles.map((t) =>
      chatAnthropic({
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
        const result = unstableJsonParser<ArticleFormat>({ maybeJson: v });
        if (!result) return;
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

  static async translateArticles(articles: string[]) {
    const startTime = performance.now();
    const systemPrompt =
      `You are an expert Korean translator with deep cultural knowledge of both English and Korean. 
You will be given one article on Gaming that is in the JSON format.

The ARTICLE FORMAT: {"title":"","key_points":[],"table":{header:[],rows:[]}}

Read the instructions below and return the Korean translated article in the SAME FORMAT.

Translation Guidelines:
- Do not translate sentences directly word-for-word. Focus on conveying the meaning naturally in Korean.
- Preserve the original tone and style, which is to keep the sentences SIMPLE.
- For the each key points, use "음슴체" for readability.
- When translating entities, such as companies, game titles, characters, use established Korean terminology rather than literal translations. It is recommended to put the original English name in parenthesis if you are unsure.
- Do not exchange the currency to KRW. Just use the original currency.
- If you see "\\n" in the text, PRESERVE IT AS IS because it is for JSON parsing.

Title Translation Example #1
Original: Disco Elysium Devs Reunite for New Game
Bad Translation: 디스코 엘리시움 개발자들 새 게임 위해 재결합
Good Translation: 디스코 엘리시움 개발자들, 새로운 게임을 위해 재결합 하다

Title Translation Example #2
Original: Heroes of the Storm Drops Major March Update with Big Changes
Bad Translation: 히어로즈 오브 더 스톰, 대규모 변화를 담은 3월 업데이트 공개
Good Translation: 히어로즈 오브 더 스톰, 3월 대규모 업데이트 발표

Title Translation Example #3
Original: Spectre Divide Shuts Down After Six Months; Studio Closes
Bad Translation: 스펙터 디바이드, 출시 6개월 만에 서비스 종료; 스튜디오 폐쇄
Good Translation: 스펙터 디바이드, 출시 6개월 만에 서비스 종료 - 스튜디오 폐쇄

"음슴체" Example #1
Original: The March 12 patch introduced talent reworks for Lucio alongside balance tweaks.
Translated: 3월 12일 패치에서 루시우의 특성 개편과 밸런스 조정이 이루어짐.

"음슴체" Example #2
Original: Multiple Brawl/Arena modes had AI pathing issues resolved.
Translated: 여러 난투/아레나 모드의 AI 경로 설정 문제가 해결됨.

"음슴체" Example #3
Original: Beats most CPUs except older Ryzen 7 98X3D by ~1%
Translated: 이전 라이젠 7 98X3D보다 약 1% 낮은 성능 외에는 대부분의 CPU를 압도

"음슴체" Example #4
Original: 22% lead over Intel Core Ultra 9 285K
Translated: 인텔 코어 울트라 9 285K보다 22% 앞선 성능 기록

Entity Translation Example #1
Original: Vampire Survivors Launches Ad-Free Wiki With Dev Support
Translated: 뱀파이어 서바이버스(Vampire Survivors), 개발자 지원을 받는 광고 없는 위키 출시

Entity Translation Example #2
Original: Steam Spring Sale Kicks Off With Big Discounts
Translated: 스팀 봄 세일 시작, 대규모 할인 진행

Entity Translation Example #3
Original: Introduces Huntress, a spear-wielding class teased in gameplay footage.
Translated: 게임플레이 영상에서 힌트를 줬던 창을 다루는 '사냥꾼(Huntress)' 클래스 소개.

Currency Example #1
Original: Preorders begin March 25 with Standard ($70) and Premium ($100) editions.
Translated: 예약 판매는 3월 25일부터 시작되며 스탠다드($70)와 프리미엄($100) 에디션으로 출시됨.

IMPORTANT! 
YOU MUST ONLY RETURN THE JSON FORMATTED ARTICLE.
DO NOT ADD ANY TEXT OTHER THAN THE JSON IN YOUR REPLY.

If you are unable to perform inspection or formatting due to the poor draft quality, JUST RETURN: <fail>`;

    const articlePromise = articles.map((t) =>
      chatAnthropic({
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
        const result = unstableJsonParser<ArticleFormat>({ maybeJson: v });
        if (!result) return;
        return JSON.stringify(result);
      })
      .filter((v) => typeof v === "string");
  }

  static async getHotTopicsLastFiveDays() {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const topics = await db.select().from(hotTopics).where(
      gte(hotTopics.createdAt, fiveDaysAgo.toISOString()),
    );

    const strs: string[] = [];
    topics.forEach((t) => {
      const json = JSON.parse(t.topics ?? "[]");
      strs.push(...json as string);
    });
    return strs;
  }

  static async getRecentArticles(languageCode: string = "en") {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const articlesWithTranslations = await db
      .select({
        id: articles.id,
        createdAt: articles.createdAt,
        citations: articles.citations,
        entities: articles.entities,
        thumbnail: articles.thumbnail,
        article: translations.article,
      })
      .from(articles)
      .innerJoin(
        translations,
        eq(translations.articleId, articles.id),
      )
      .where(
        and(
          gte(articles.createdAt, fiveDaysAgo.toISOString()),
          eq(translations.languageCode, languageCode),
        ),
      )
      .orderBy(desc(articles.createdAt));

    return articlesWithTranslations;
  }
}
