/**
 * abc-chime.wav を生成（0.5秒・短いチャイム）
 * 実行: node scripts/generate-chime.mjs
 */
import fs from "fs";
import path from "path";

const SAMPLE_RATE = 44100;
const DURATION = 0.5;
const FREQUENCIES = [523.25, 659.25, 783.99]; // C5 E5 G5

const samples = Math.floor(SAMPLE_RATE * DURATION);
const data = new Float32Array(samples);

for (let i = 0; i < samples; i++) {
  const t = i / SAMPLE_RATE;
  const envelope = Math.exp(-t * 6);
  let sample = 0;
  for (const freq of FREQUENCIES) {
    sample += Math.sin(2 * Math.PI * freq * t);
  }
  sample /= FREQUENCIES.length;
  data[i] = sample * envelope * 0.4;
}

// WAV header
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

const outDir = path.join("public", "sounds");
fs.mkdirSync(outDir, { recursive: true });

const wavPath = path.join(outDir, "abc-chime.wav");
fs.writeFileSync(wavPath, buffer);

// mp3 互換のため同ファイルを mp3 名でもコピー（ブラウザは wav として再生可能な場合あり）
// 実際は wav を使用し、フックのパスを wav に変更
console.log("Generated", wavPath);
