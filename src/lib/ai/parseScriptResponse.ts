import {
  detectCategory,
  isDreamCategory,
} from "@/lib/theme/dreamTheme";
import type { DreamCategory, GenerateScriptInput, GenerateScriptResult } from "@/types";

export function parseGenerateScriptResponse(
  raw: string,
  input: GenerateScriptInput
): GenerateScriptResult {
  const trimmed = raw.trim();

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "script" in parsed &&
      typeof (parsed as { script: unknown }).script === "string"
    ) {
      const script = (parsed as { script: string }).script.trim();
      const categoryRaw = (parsed as { category?: unknown }).category;
      const category =
        typeof categoryRaw === "string" && isDreamCategory(categoryRaw)
          ? categoryRaw
          : detectCategory(input.dream);
      return { script, category };
    }
  } catch {
    // fall through to plain-text handling
  }

  return {
    script: trimmed,
    category: detectCategory(input.dream),
  };
}

export function normalizeCategory(
  category: string | undefined,
  dream: string
): DreamCategory {
  if (category && isDreamCategory(category)) {
    return category;
  }
  return detectCategory(dream);
}
