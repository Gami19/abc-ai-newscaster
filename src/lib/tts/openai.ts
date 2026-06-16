import OpenAI from "openai";

import type { TtsProviderInterface, TtsSynthesisResult } from "@/types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません");
  }
  return new OpenAI({ apiKey });
}

function getVoice(): OpenAI.Audio.SpeechCreateParams["voice"] {
  // nova: ABCキャスター文化の「真面目さと親しみやすさの両立」に最も近い声質
  // alloy に変更すると MC 横山太一風の男性声にも対応可能
  const voice = process.env.OPENAI_TTS_VOICE ?? "nova";
  const allowed: OpenAI.Audio.SpeechCreateParams["voice"][] = [
    "alloy",
    "echo",
    "fable",
    "onyx",
    "nova",
    "shimmer",
  ];
  if (allowed.includes(voice as OpenAI.Audio.SpeechCreateParams["voice"])) {
    return voice as OpenAI.Audio.SpeechCreateParams["voice"];
  }
  return "nova";
}

function getSpeed(): number {
  // 0.95: ABCアナウンサーの丁寧な語り・news おかえりの落ち着いたテンポを再現
  const raw = process.env.OPENAI_TTS_SPEED;
  if (!raw) return 0.95;
  const speed = Number(raw);
  if (Number.isNaN(speed) || speed < 0.25 || speed > 4) return 0.95;
  return speed;
}

export async function synthesizeSpeech(text: string): Promise<TtsSynthesisResult> {
  const client = getClient();

  const response = await client.audio.speech.create({
    model: process.env.OPENAI_TTS_MODEL ?? "tts-1",
    voice: getVoice(),
    input: text,
    response_format: "mp3",
    speed: getSpeed(),
  });

  const audio = await response.arrayBuffer();

  return {
    audio,
    contentType: "audio/mpeg",
  };
}

export const openaiTtsProvider: TtsProviderInterface = {
  synthesizeSpeech,
};
