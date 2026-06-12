import { AzureOpenAI } from "openai";

import type { TtsProviderInterface, TtsSynthesisResult } from "@/types";

function getClient(): AzureOpenAI {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

  if (!apiKey) {
    throw new Error("AZURE_OPENAI_API_KEY が設定されていません");
  }
  if (!endpoint) {
    throw new Error("AZURE_OPENAI_ENDPOINT が設定されていません");
  }

  return new AzureOpenAI({
    apiKey,
    endpoint,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview",
  });
}

function getDeploymentName(): string {
  const deployment =
    process.env.AZURE_OPENAI_TTS_DEPLOYMENT_NAME ??
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  if (!deployment) {
    throw new Error("AZURE_OPENAI_TTS_DEPLOYMENT_NAME が設定されていません");
  }

  return deployment;
}

function getVoice(): string {
  return process.env.OPENAI_TTS_VOICE ?? "nova";
}

function getSpeed(): number {
  const raw = process.env.OPENAI_TTS_SPEED;
  if (!raw) return 0.95;
  const speed = Number(raw);
  if (Number.isNaN(speed) || speed < 0.25 || speed > 4) return 0.95;
  return speed;
}

export async function synthesizeSpeech(text: string): Promise<TtsSynthesisResult> {
  const client = getClient();

  const response = await client.audio.speech.create({
    model: getDeploymentName(),
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

export const azureTtsProvider: TtsProviderInterface = {
  synthesizeSpeech,
};
