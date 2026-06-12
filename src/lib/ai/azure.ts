import type { AIProviderInterface, GenerateScriptInput } from "@/types";

export async function generateScript(
  _input: GenerateScriptInput
): Promise<string> {
  throw new Error("Azure OpenAI: coming soon");
}

export const azureProvider: AIProviderInterface = {
  generateScript,
};
