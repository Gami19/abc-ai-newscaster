import type { ScriptSegment } from "@/types";

const SEGMENT_DELIMITERS = /(?<=[。！？\n])/;

export function splitScriptIntoSegments(script: string): string[] {
  const normalized = script.replace(/\s+/g, "").trim();
  if (!normalized) return [];

  const parts = normalized
    .split(SEGMENT_DELIMITERS)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [normalized];
}

export function buildScriptSegments(script: string): ScriptSegment[] {
  const segments = splitScriptIntoSegments(script);
  const totalChars = segments.reduce((sum, seg) => sum + seg.length, 0);

  if (totalChars === 0) return [];

  let accumulated = 0;

  return segments.map((text) => {
    const startRatio = accumulated / totalChars;
    accumulated += text.length;
    const endRatio = accumulated / totalChars;
    return { text, startRatio, endRatio };
  });
}

export function getHighlightIndexFromTime(
  segments: ScriptSegment[],
  currentTime: number,
  duration: number
): number {
  if (!segments.length || !duration) return -1;

  const ratio = Math.min(currentTime / duration, 1);

  const index = segments.findIndex(
    (seg) => ratio >= seg.startRatio && ratio < seg.endRatio
  );

  if (index >= 0) return index;
  if (ratio >= 1) return segments.length - 1;
  return 0;
}
