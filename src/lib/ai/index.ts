import { azureProvider } from "@/lib/ai/azure";
import { bedrockProvider } from "@/lib/ai/bedrock";
import { mockProvider } from "@/lib/ai/mock";
import { openaiProvider } from "@/lib/ai/openai";
import { shouldUseMockScript } from "@/lib/config/demo";
import type { AIProvider, GenerateScriptInput, GenerateScriptResult } from "@/types";

function resolveProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider === "azure" || provider === "bedrock" || provider === "openai") {
    return provider;
  }
  return "openai";
}

export async function generateScript(
  input: GenerateScriptInput
): Promise<GenerateScriptResult> {
  if (shouldUseMockScript()) {
    return mockProvider.generateScript(input);
  }

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
