import { getDemoMockDelayMs } from "@/lib/config/demo";
import { detectCategory } from "@/lib/theme/dreamTheme";
import { buildDefaultScript } from "@/lib/prompts/defaultScript";
import type { AIProviderInterface, GenerateScriptInput, GenerateScriptResult } from "@/types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateScript(
  input: GenerateScriptInput
): Promise<GenerateScriptResult> {
  const delayMs = getDemoMockDelayMs();
  if (delayMs > 0) {
    await sleep(delayMs);
  }
  return {
    script: buildDefaultScript(input),
    category: detectCategory(input.dream),
  };
}

export const mockProvider: AIProviderInterface = {
  generateScript,
};
