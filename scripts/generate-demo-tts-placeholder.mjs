/**
 * demo-tts 用プレースホルダー音声を生成（約25秒・開発用）
 * 本番デモでは OpenAI TTS 等で録音したニュース風サンプルに差し替えてください。
 * 実行: node scripts/generate-demo-tts-placeholder.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const SAMPLE_RATE = 44100;
const DURATION = 25;
const OUT_DIR = path.join("public", "sounds");
const WAV_PATH = path.join(OUT_DIR, "demo-tts.wav");
const MP3_PATH = path.join(OUT_DIR, "demo-tts.mp3");

const samples = Math.floor(SAMPLE_RATE * DURATION);
const data = new Float32Array(samples);

for (let i = 0; i < samples; i++) {
  const t = i / SAMPLE_RATE;
  const phrase = Math.floor(t / 2.5);
  const localT = t - phrase * 2.5;
  const envelope =
    localT < 0.05
      ? localT / 0.05
      : localT > 2.2
        ? Math.max(0, 1 - (localT - 2.2) / 0.3)
        : 1;
  const baseFreq = 180 + (phrase % 4) * 20;
  const sample =
    (Math.sin(2 * Math.PI * baseFreq * t) * 0.15 +
      Math.sin(2 * Math.PI * (baseFreq * 1.5) * t) * 0.08) *
    envelope *
    0.35;
  data[i] = sample;
}

const numChannels = 1;
const bitsPerSample = 16;
const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
const blockAlign = numChannels * (bitsPerSample / 8);
const dataSize = samples * blockAlign;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bitsPerSample, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < samples; i++) {
  const intSample = Math.max(-1, Math.min(1, data[i])) * 0x7fff;
  buffer.writeInt16LE(intSample, 44 + i * 2);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(WAV_PATH, buffer);
console.log("Generated", WAV_PATH);

try {
  execSync(`ffmpeg -y -i "${WAV_PATH}" -codec:a libmp3lame -qscale:a 4 "${MP3_PATH}"`, {
    stdio: "pipe",
  });
  console.log("Generated", MP3_PATH);
} catch {
  fs.copyFileSync(WAV_PATH, MP3_PATH);
  console.warn(
    "ffmpeg が見つからないため demo-tts.mp3 は WAV コピーです。",
    "本番用は ffmpeg で変換するか、実録音の mp3 に差し替えてください。"
  );
}
