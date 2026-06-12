import type { AIProviderInterface, GenerateScriptInput } from "@/types";

export async function generateScript(
  _input: GenerateScriptInput
): Promise<string> {
  throw new Error("Amazon Bedrock: coming soon");
}

export const bedrockProvider: AIProviderInterface = {
  generateScript,
};
