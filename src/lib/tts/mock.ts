import { readFile } from "fs/promises";
import path from "path";

import { getDemoMockTtsAudioPath } from "@/lib/config/demo";
import type { TtsProviderInterface, TtsSynthesisResult } from "@/types";

export async function synthesizeSpeech(
  _text: string
): Promise<TtsSynthesisResult> {
  const relativePath = getDemoMockTtsAudioPath();
  const filePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    throw new Error(
      `demo-tts.mp3 が見つかりません: ${relativePath}（scripts/generate-demo-tts-placeholder.mjs を実行してください）`
    );
  }

  const audio = new Uint8Array(buffer).buffer;

  const contentType = relativePath.endsWith(".wav")
    ? "audio/wav"
    : "audio/mpeg";

  return { audio, contentType };
}

export const mockTtsProvider: TtsProviderInterface = {
  synthesizeSpeech,
};
