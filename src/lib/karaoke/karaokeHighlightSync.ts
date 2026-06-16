import { getHighlightIndexFromTime } from "@/lib/karaoke/scriptSegments";
import type { ScriptSegment } from "@/types";

export function startAudioHighlightSync(
  audio: HTMLAudioElement,
  segments: ScriptSegment[],
  onIndex: (index: number) => void
): () => void {
  let rafId: number | null = null;

  const tick = () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    const index = getHighlightIndexFromTime(
      segments,
      audio.currentTime,
      audio.duration
    );
    onIndex(index);

    if (!audio.paused && !audio.ended) {
      rafId = requestAnimationFrame(tick);
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
}

export function startElapsedHighlightSync(
  segments: ScriptSegment[],
  totalDurationSec: number,
  onIndex: (index: number) => void,
  getStartedAt: () => number
): () => void {
  let rafId: number | null = null;

  const tick = () => {
    const elapsedSec = (performance.now() - getStartedAt()) / 1000;
    const index = getHighlightIndexFromTime(
      segments,
      elapsedSec,
      totalDurationSec
    );
    onIndex(index);

    if (elapsedSec < totalDurationSec) {
      rafId = requestAnimationFrame(tick);
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
}
