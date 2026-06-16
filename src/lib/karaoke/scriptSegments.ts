import type { ScriptSegment } from "@/types";

/** ニュース読み（rate=1.0 付近）の目安 */
const JAPANESE_CHARS_PER_SEC = 5.2;
const PAUSE_AFTER_SENTENCE_SEC = 0.45;
const PAUSE_AFTER_COMMA_SEC = 0.12;

const SEGMENT_DELIMITERS = /(?<=[。！？])|\n+/;

export function splitScriptIntoSegments(script: string): string[] {
  const trimmed = script.replace(/\r\n/g, "\n").trim();
  if (!trimmed) return [];

  const parts = trimmed
    .split(SEGMENT_DELIMITERS)
    .map((part) => part.replace(/\s+/g, "").trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [trimmed.replace(/\s+/g, "")];
}

/** 1文節の発話時間ウェイト（秒相当） */
export function estimateSegmentSpeakSec(
  text: string,
  speechRate = 1
): number {
  const chars = text.replace(/\s/g, "").length;
  if (chars === 0) return 0;

  let seconds = chars / JAPANESE_CHARS_PER_SEC / speechRate;

  if (/[。！？]$/.test(text)) {
    seconds += PAUSE_AFTER_SENTENCE_SEC;
  } else if (/[、，]$/.test(text)) {
    seconds += PAUSE_AFTER_COMMA_SEC;
  }

  return seconds;
}

export function estimateScriptSpeakDuration(
  script: string,
  speechRate = 1
): number {
  const total = splitScriptIntoSegments(script).reduce(
    (sum, part) => sum + estimateSegmentSpeakSec(part, speechRate),
    0
  );
  return Math.max(1, total);
}

export function buildScriptSegments(
  script: string,
  speechRate = 1
): ScriptSegment[] {
  const segments = splitScriptIntoSegments(script);
  const weights = segments.map((text) =>
    estimateSegmentSpeakSec(text, speechRate)
  );
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight === 0) return [];

  let accumulated = 0;

  return segments.map((text, index) => {
    const startRatio = accumulated / totalWeight;
    accumulated += weights[index] ?? 0;
    const endRatio = accumulated / totalWeight;
    return { text, startRatio, endRatio };
  });
}

export function getHighlightIndexFromTime(
  segments: ScriptSegment[],
  currentTime: number,
  duration: number
): number {
  if (!segments.length || !duration || duration <= 0) return -1;

  const ratio = Math.min(Math.max(currentTime / duration, 0), 1);

  const index = segments.findIndex(
    (seg) => ratio >= seg.startRatio && ratio < seg.endRatio
  );

  if (index >= 0) return index;
  if (ratio >= 1) return segments.length - 1;
  return 0;
}

export function getHighlightIndexFromElapsed(
  segments: ScriptSegment[],
  elapsedSec: number,
  totalDurationSec: number
): number {
  return getHighlightIndexFromTime(segments, elapsedSec, totalDurationSec);
}
