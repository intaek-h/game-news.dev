import { GoogleGenAI } from "@google/genai";
import { ResultAsync } from "neverthrow";

const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY") ?? "";

if (!GOOGLE_GEMINI_API_KEY) {
  throw new Error("GOOGLE_GEMINI_API_KEY is required");
}

const ai = new GoogleGenAI({ apiKey: GOOGLE_GEMINI_API_KEY });

export async function chatGoogleGemini(
  d: { systemP: string; message: string; model?: string },
) {
  const { systemP, message, model } = d;
  const response = await ai.models.generateContent({
    model: model ?? "gemini-2.5-pro-exp-03-25",
    contents: message,
    config: {
      systemInstruction: systemP,
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 65536,
      responseModalities: [],
    },
  });

  return response;
}

export function chatGoogleGemini2(d: { systemP: string; message: string; model?: string }) {
  const { systemP, message, model } = d;

  return ResultAsync.fromPromise(
    ai.models.generateContent({
      model: model ?? "gemini-2.5-pro-exp-03-25",
      contents: message,
      config: {
        systemInstruction: systemP,
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 65536,
        responseModalities: [],
      },
    }),
    (err) => ({ err, message: "Failed to request Google Gemini" }),
  );
}
