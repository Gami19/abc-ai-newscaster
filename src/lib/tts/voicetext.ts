const VOICETEXT_API_URL = "https://api.voicetext.jp/v1/tts";

function getApiKey(): string {
  const apiKey = process.env.VOICETEXT_API_KEY;
  if (!apiKey) {
    throw new Error("VOICETEXT_API_KEY が設定されていません");
  }
  return apiKey;
}

function getSpeaker(): string {
  return process.env.VOICETEXT_SPEAKER ?? "haruka";
}

function buildAuthHeader(apiKey: string): string {
  const credentials = `${apiKey}:`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

async function requestTts(text: string): Promise<ArrayBuffer> {
  const apiKey = getApiKey();
  const body = new URLSearchParams({
    text,
    speaker: getSpeaker(),
    format: "wav",
    speed: "110",
    pitch: "120",
  });

  const response = await fetch(VOICETEXT_API_URL, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(apiKey),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (response.status === 401) {
    throw new Error("VoiceText APIキーが不正です");
  }

  if (response.status === 503) {
    throw new Error("VoiceText サーバーエラー");
  }

  if (!response.ok) {
    throw new Error(`VoiceText API エラー: ${response.status}`);
  }

  return response.arrayBuffer();
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  if (!text.trim()) {
    throw new Error("テキストが空です");
  }

  try {
    return await requestTts(text);
  } catch (error) {
    const isServerError =
      error instanceof Error && error.message === "VoiceText サーバーエラー";

    if (isServerError) {
      return requestTts(text);
    }

    throw error;
  }
}
