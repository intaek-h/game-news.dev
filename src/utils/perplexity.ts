import { PerplexityResponse } from "~/src/models/perplexity.ts";

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

if (!PERPLEXITY_API_KEY) {
  throw new Error("PERPLEXITY_API_KEY not found in environment variables");
}

/**
 * Extracts <think>...</think> blocks from content and separates them from the rest of the text
 */
const extractThinkBlocks = (
  content: string,
): { think: string; reply: string } => {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const thinkMatch = content.match(thinkRegex);

  let think = "";
  let reply = content;

  if (thinkMatch && thinkMatch[1]) {
    think = thinkMatch[1].trim();
    // Remove the think block from the reply
    reply = content.replace(thinkRegex, "").trim();
  }

  return { think, reply };
};

export const chatPerplexity = async (
  d: { message: string; systemP?: string },
) => {
  const { message, systemP } = d;

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "temperature": 0.4,
      "top_p": 0.9,
      "search_domain_filter": [],
      "return_images": false,
      "return_related_questions": false,
      "top_k": 0,
      "stream": false,
      "presence_penalty": 0,
      "frequency_penalty": 1,
      "model": "sonar-reasoning-pro",
      "messages": systemP
        ? [
          {
            "role": "system",
            "content": systemP,
          },
          {
            "role": "user",
            "content": message,
          },
        ]
        : [
          {
            "role": "user",
            "content": message,
          },
        ],
      "max_tokens": 4096,
    }),
  };

  const response = await fetch(
    "https://api.perplexity.ai/chat/completions",
    options,
  );
  const data = await response.json() as PerplexityResponse;

  if (data.choices.length > 0 && data.choices[0].message) {
    const content = data.choices[0].message.content || "";
    const { reply, think } = extractThinkBlocks(content);

    return { think, reply, citations: data.citations ?? [] };
  }
};
