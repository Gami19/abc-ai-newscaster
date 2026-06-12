import type { GenerateVideoInput, VideoOutput } from "@/types";

export function generateFallbackVideo(
  input: GenerateVideoInput
): VideoOutput {
  return {
    type: "fallback",
    imageBlob: input.canvasImageBlob,
    audioBlob: input.audioBlob,
  };
}
