import type { AIProviderInterface, GenerateScriptInput, GenerateScriptResult } from "@/types";

export async function generateScript(
  _input: GenerateScriptInput
): Promise<GenerateScriptResult> {
  throw new Error("Amazon Bedrock: coming soon");
}

export const bedrockProvider: AIProviderInterface = {
  generateScript,
};
