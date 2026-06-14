import type { GenerateVideoInput, VideoOutput } from "@/types";

const FFMPEG_CORE_VERSION = "0.12.10";

export async function generateFfmpegVideo(
  input: GenerateVideoInput
): Promise<VideoOutput> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  const baseURL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  const frameData = await fetchFile(input.canvasImageBlob);
  const audioData = await fetchFile(input.audioBlob);

  const audioExt =
    input.audioBlob.type.includes("mpeg") || input.audioBlob.type.includes("mp3")
      ? "mp3"
      : "wav";

  await ffmpeg.writeFile("frame.jpg", frameData);
  await ffmpeg.writeFile(`audio.${audioExt}`, audioData);

  await ffmpeg.exec([
    "-loop",
    "1",
    "-i",
    "frame.jpg",
    "-i",
    `audio.${audioExt}`,
    "-shortest",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-pix_fmt",
    "yuv420p",
    "output.mp4",
  ]);

  const data = await ffmpeg.readFile("output.mp4");
  const bytes =
    data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));

  return {
    type: "video",
    blob: new Blob([new Uint8Array(bytes)], { type: "video/mp4" }),
    mimeType: "video/mp4",
  };
}
