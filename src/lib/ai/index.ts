import { azureProvider } from "@/lib/ai/azure";
import { bedrockProvider } from "@/lib/ai/bedrock";
import { openaiProvider } from "@/lib/ai/openai";
import type { AIProvider, GenerateScriptInput } from "@/types";

function resolveProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider === "azure" || provider === "bedrock" || provider === "openai") {
    return provider;
  }
  return "openai";
}

export async function generateScript(
  input: GenerateScriptInput
): Promise<string> {
  const provider = resolveProvider();

  switch (provider) {
    case "azure":
      return azureProvider.generateScript(input);
    case "bedrock":
      return bedrockProvider.generateScript(input);
    case "openai":
    default:
      return openaiProvider.generateScript(input);
  }
}
