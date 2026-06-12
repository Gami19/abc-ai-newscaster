import { azureTtsProvider } from "@/lib/tts/azure";
import { openaiTtsProvider } from "@/lib/tts/openai";
import type { TtsProvider, TtsSynthesisResult } from "@/types";

function resolveProvider(): TtsProvider {
  const provider = process.env.TTS_PROVIDER?.toLowerCase();
  if (provider === "azure" || provider === "openai") {
    return provider;
  }
  return "openai";
}

export async function synthesizeSpeech(text: string): Promise<TtsSynthesisResult> {
  if (!text.trim()) {
    throw new Error("テキストが空です");
  }

  const provider = resolveProvider();

  switch (provider) {
    case "azure":
      return azureTtsProvider.synthesizeSpeech(text);
    case "openai":
    default:
      return openaiTtsProvider.synthesizeSpeech(text);
  }
}
