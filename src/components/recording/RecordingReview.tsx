"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Confetti } from "@/components/effects/Confetti";
import { Button } from "@/components/ui/button";
import { useBlobObjectUrl } from "@/hooks/useBlobObjectUrl";
import { formatMediaTime } from "@/lib/video/formatMediaTime";

type RecordingReviewProps = {
  videoBlob: Blob;
  /** 録画停止時に計測した長さ（シークバー総時間の固定表示用） */
  durationMs: number;
  onRetake: () => void;
  onConfirm: () => void;
};

export function RecordingReview({
  videoBlob,
  durationMs,
  onRetake,
  onConfirm,
}: RecordingReviewProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = useBlobObjectUrl(videoBlob);

  const fixedDurationMs = Math.max(0, durationMs);

  const handleConfirmClick = () => {
    setPendingConfirm(true);
    setShowConfetti(true);
  };

  const handleConfettiComplete = () => {
    if (pendingConfirm) {
      onConfirm();
    }
  };

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("[RecordingReview] play failed", err);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSeek = useCallback(
    (nextMs: number) => {
      const video = videoRef.current;
      if (!video || fixedDurationMs <= 0) return;

      const clampedMs = Math.min(Math.max(0, nextMs), fixedDurationMs);
      video.currentTime = clampedMs / 1000;
      setCurrentMs(clampedMs);
    },
    [fixedDurationMs]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (isSeeking) return;
      setCurrentMs(Math.min(video.currentTime * 1000, fixedDurationMs));
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentMs(fixedDurationMs);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [fixedDurationMs, isSeeking, videoUrl]);

  useEffect(() => {
    setCurrentMs(0);
    setIsPlaying(false);
    setIsSeeking(false);
  }, [videoUrl]);

  return (
    <div className="space-y-4">
      {showConfetti ? (
        <Confetti
          count={20}
          active
          onComplete={handleConfettiComplete}
        />
      ) : null}

      <h1 className="text-center text-2xl font-bold text-abc-charcoal">
        できあがりを確認してね！
      </h1>

      {videoUrl ? (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border border-border bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              className="aspect-video w-full"
              onClick={() => void togglePlay()}
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-abc-white px-2 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void togglePlay()}
              disabled={pendingConfirm}
              className="shrink-0 px-3"
              aria-label={isPlaying ? "一時停止" : "再生"}
            >
              {isPlaying ? "⏸" : "▶"}
            </Button>

            <input
              type="range"
              min={0}
              max={fixedDurationMs}
              step={100}
              value={Math.min(currentMs, fixedDurationMs)}
              disabled={pendingConfirm || fixedDurationMs <= 0}
              aria-label="再生位置"
              className="h-2 flex-1 cursor-pointer accent-abc-red"
              onPointerDown={() => setIsSeeking(true)}
              onPointerUp={() => setIsSeeking(false)}
              onChange={(event) => {
                handleSeek(Number(event.target.value));
              }}
            />

            <span
              className="shrink-0 tabular-nums text-sm text-abc-charcoal"
              aria-live="polite"
            >
              {formatMediaTime(currentMs)} / {formatMediaTime(fixedDurationMs)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onRetake}
          disabled={pendingConfirm}
          className="h-12 flex-1"
        >
          ↩ もう一度とる
        </Button>
        <Button
          type="button"
          onClick={handleConfirmClick}
          disabled={pendingConfirm}
          className="h-12 flex-1 bg-abc-red text-white hover:bg-abc-red/90"
        >
          ✅ これでOK！
        </Button>
      </div>
    </div>
  );
}
