import Anthropic from "@anthropic-ai/sdk";
import { ResultAsync } from "neverthrow";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");

if (!CLAUDE_API_KEY) {
  throw new Error("CLAUDE_API_KEY is required");
}

export const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

export const chatAnthropicSonnet = ({ message, systemP }: { systemP: string; message: string }) =>
  ResultAsync.fromPromise(
    anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 4096,
      temperature: 1,
      system: systemP,
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": message,
            },
          ],
        },
      ],
      thinking: {
        "type": "enabled",
        "budget_tokens": 3277,
      },
    }),
    (err) => ({ err, message: "Failed to create message" }),
  )
    .map((data) => data.content);

export const chatAnthropicHaiku = ({ message, systemP }: { systemP: string; message: string }) =>
  ResultAsync.fromPromise(
    anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 4096,
      temperature: 1,
      system: systemP,
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": message,
            },
          ],
        },
      ],
    }),
    (err) => ({ err, message: "Failed to create message" }),
  )
    .map((data) => data.content);
