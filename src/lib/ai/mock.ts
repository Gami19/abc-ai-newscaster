import { getDemoMockDelayMs } from "@/lib/config/demo";
import { buildDefaultScript } from "@/lib/prompts/defaultScript";
import type { AIProviderInterface, GenerateScriptInput } from "@/types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateScript(
  input: GenerateScriptInput
): Promise<string> {
  const delayMs = getDemoMockDelayMs();
  if (delayMs > 0) {
    await sleep(delayMs);
  }
  return buildDefaultScript(input);
}

export const mockProvider: AIProviderInterface = {
  generateScript,
};
