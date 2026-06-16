import { getHighlightIndexFromTime } from "@/lib/karaoke/scriptSegments";
import type { ScriptSegment } from "@/types";

function waitForFiniteDuration(
  audio: HTMLAudioElement
): Promise<void> {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onMeta = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
    };
    audio.addEventListener("loadedmetadata", onMeta, { once: true });
    audio.addEventListener("durationchange", onMeta, { once: true });
  });
}

function waitForPlaying(audio: HTMLAudioElement): Promise<void> {
  if (!audio.paused && audio.currentTime > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onPlaying = () => {
      audio.removeEventListener("playing", onPlaying);
      resolve();
    };
    audio.addEventListener("playing", onPlaying, { once: true });
  });
}

function runHighlightLoop(
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

/**
 * 音声の `playing` イベントと duration 確定後にハイライト同期を開始する。
 * Web Audio 経由の together モードでも可聴開始に合わせやすい。
 */
export function bindAudioHighlightSync(
  audio: HTMLAudioElement,
  segments: ScriptSegment[],
  onIndex: (index: number) => void
): () => void {
  let stopLoop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    await waitForFiniteDuration(audio);
    if (cancelled) return;
    await waitForPlaying(audio);
    if (cancelled) return;
    stopLoop = runHighlightLoop(audio, segments, onIndex);
  })();

  return () => {
    cancelled = true;
    stopLoop?.();
  };
}

/** @deprecated bindAudioHighlightSync を使用 */
export function startAudioHighlightSync(
  audio: HTMLAudioElement,
  segments: ScriptSegment[],
  onIndex: (index: number) => void
): () => void {
  return bindAudioHighlightSync(audio, segments, onIndex);
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
