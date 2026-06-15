import type { AIProviderInterface, GenerateScriptInput, GenerateScriptResult } from "@/types";

export async function generateScript(
  _input: GenerateScriptInput
): Promise<GenerateScriptResult> {
  throw new Error("Azure OpenAI: coming soon");
}

export const azureProvider: AIProviderInterface = {
  generateScript,
};
