const TRUTHY = new Set(["true", "1", "yes"]);

export function parseEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  return TRUTHY.has(value.trim().toLowerCase());
}

export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function isDemoMockScript(): boolean {
  return parseEnvFlag(process.env.DEMO_MOCK_SCRIPT);
}

export function isDemoMockTts(): boolean {
  return parseEnvFlag(process.env.DEMO_MOCK_TTS);
}

/** 明示的 MOCK または OpenAI キー未設定時はモック原稿を使う */
export function shouldUseMockScript(): boolean {
  return isDemoMockScript() || !hasOpenAiApiKey();
}

/** 明示的 MOCK または OpenAI キー未設定時はモック TTS を使う */
export function shouldUseMockTts(): boolean {
  return isDemoMockTts() || !hasOpenAiApiKey();
}

export function getDemoMockDelayMs(): number {
  const raw = process.env.DEMO_MOCK_DELAY_MS;
  if (!raw) return 1500;
  const ms = Number(raw);
  if (Number.isNaN(ms) || ms < 0) return 1500;
  return ms;
}

export function getDemoMockTtsAudioPath(): string {
  return process.env.DEMO_MOCK_TTS_AUDIO_PATH ?? "public/sounds/demo-tts.wav";
}
