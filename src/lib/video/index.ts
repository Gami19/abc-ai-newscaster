import type { GenerateVideoInput, VideoMode, VideoOutput } from "@/types";

import { generateFallbackVideo } from "./fallback";
import { generateFfmpegVideo } from "./ffmpegVideo";
import { generateMediaRecorderVideo } from "./mediaRecorder";

export type GenerateVideoOptions = {
  onProgress?: (remainingSeconds: number) => void;
};

function resolveVideoMode(): VideoMode {
  const mode = process.env.NEXT_PUBLIC_VIDEO_MODE?.toLowerCase();
  if (mode === "ffmpeg" || mode === "mediarecorder" || mode === "fallback") {
    return mode;
  }
  return "mediarecorder";
}

export async function generateVideo(
  input: GenerateVideoInput,
  options?: GenerateVideoOptions
): Promise<VideoOutput> {
  const mode = resolveVideoMode();

  if (mode === "fallback") {
    return generateFallbackVideo(input);
  }

  if (mode === "mediarecorder") {
    return generateMediaRecorderVideo(input, options?.onProgress);
  }

  try {
    return await generateFfmpegVideo(input);
  } catch (error) {
    console.error("[generateVideo] ffmpeg failed, falling back to MediaRecorder", error);
    return generateMediaRecorderVideo(input, options?.onProgress);
  }
}
