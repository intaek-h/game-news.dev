import Anthropic from "@anthropic-ai/sdk";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");

if (!CLAUDE_API_KEY) {
  throw new Error("CLAUDE_API_KEY is required");
}

export const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});
