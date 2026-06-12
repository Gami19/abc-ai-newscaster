"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { NewsPreviewCard } from "@/components/preview/NewsPreviewCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSessionStore } from "@/lib/store/useSessionStore";

export function PreviewView() {
  const router = useRouter();
  const scriptText = useSessionStore((s) => s.scriptText);
  const audioBlob = useSessionStore((s) => s.audioBlob);
  const photoBase64 = useSessionStore((s) => s.photoBase64);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!scriptText || !audioBlob || !photoBase64) {
      router.replace("/");
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [scriptText, audioBlob, photoBase64, router]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  }, []);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
  }, []);

  if (!scriptText || !audioBlob || !photoBase64) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-bold text-abc-charcoal">
        きみの2035年ニュースができたよ！
      </h1>

      <NewsPreviewCard scriptText={scriptText} photoBase64={photoBase64} />

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="hidden"
        />
      ) : null}

      <Button
        type="button"
        onClick={handlePlayPause}
        className="h-12 w-full bg-abc-orange text-white hover:bg-abc-orange/90"
      >
        {isPlaying ? "停止" : "ニュースを読み上げる"}
      </Button>

      {isPlaying ? (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-xs text-abc-gray">再生中</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Button
          type="button"
          disabled
          className="h-12 w-full bg-abc-red text-white opacity-50"
        >
          どうがをつくる！
        </Button>
        <p className="text-center text-xs text-abc-gray">Day 3 で有効化</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push("/camera")}
        className="w-full text-abc-gray"
      >
        ← もどる
      </Button>
    </div>
  );
}
