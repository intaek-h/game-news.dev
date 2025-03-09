import { anthropic } from "~/src/models/anthropic.ts";

export const chatAnthropic = async (
  d: { systemP: string; message: string },
) => {
  const { systemP, message } = d;
  const msg = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
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
  });

  return msg.content;
};
