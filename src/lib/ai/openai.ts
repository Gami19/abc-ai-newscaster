import OpenAI from "openai";

import { parseGenerateScriptResponse } from "@/lib/ai/parseScriptResponse";
import {
  buildSystemPrompt,
  buildUserPrompt,
  FEWSHOT_USER,
  getFewShotAssistant,
  gradeToGroup,
} from "@/lib/prompts/newsScript";
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
  const group = gradeToGroup(input.grade);

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: buildSystemPrompt(group) },
      { role: "user", content: FEWSHOT_USER },
      { role: "assistant", content: getFewShotAssistant(group) },
      { role: "user", content: buildUserPrompt(input, group) },
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
