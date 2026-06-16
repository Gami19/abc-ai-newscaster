import { readFile } from "fs/promises";
import path from "path";

import { getDemoMockTtsAudioPath, hasOpenAiApiKey } from "@/lib/config/demo";
import { synthesizeSpeech as openaiSynthesizeSpeech } from "@/lib/tts/openai";
import type { TtsProviderInterface, TtsSynthesisResult } from "@/types";

async function loadStaticDemoAudio(): Promise<TtsSynthesisResult> {
  const relativePath = getDemoMockTtsAudioPath();
  const filePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    throw new Error(
      `デモ音声が見つかりません: ${relativePath}（scripts/generate-demo-tts-placeholder.mjs を実行してください）`
    );
  }

  const audio = new Uint8Array(buffer).buffer;
  const contentType = relativePath.endsWith(".wav")
    ? "audio/wav"
    : "audio/mpeg";

  return {
    audio,
    contentType,
    playback: "browser-speech",
  };
}

export async function synthesizeSpeech(
  text: string
): Promise<TtsSynthesisResult> {
  if (hasOpenAiApiKey()) {
    const result = await openaiSynthesizeSpeech(text);
    return { ...result, playback: "blob" };
  }

  void text;
  return loadStaticDemoAudio();
}

export const mockTtsProvider: TtsProviderInterface = {
  synthesizeSpeech,
};
