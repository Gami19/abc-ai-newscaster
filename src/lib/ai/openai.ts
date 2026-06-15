import OpenAI from "openai";

import { parseGenerateScriptResponse } from "@/lib/ai/parseScriptResponse";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/prompts/newsScript";
import type { AIProviderInterface, GenerateScriptInput, GenerateScriptResult } from "@/types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません");
  }
  return new OpenAI({ apiKey });
}

export async function generateScript(
  input: GenerateScriptInput
): Promise<GenerateScriptResult> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("OpenAI から原稿が返されませんでした");
  }

  return parseGenerateScriptResponse(raw, input);
}

export const openaiProvider: AIProviderInterface = {
  generateScript,
};
