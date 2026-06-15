const TRUTHY = new Set(["true", "1", "yes"]);

export function parseEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  return TRUTHY.has(value.trim().toLowerCase());
}

export function isDemoMockScript(): boolean {
  return parseEnvFlag(process.env.DEMO_MOCK_SCRIPT);
}

export function isDemoMockTts(): boolean {
  return parseEnvFlag(process.env.DEMO_MOCK_TTS);
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
