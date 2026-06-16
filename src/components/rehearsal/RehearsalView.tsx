"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  NewsCanvas,
  type NewsCanvasHandle,
} from "@/components/canvas/NewsCanvas";
import { KaraokeScript } from "@/components/preview/KaraokeScript";
import { Button } from "@/components/ui/button";
import { useBlobObjectUrl } from "@/hooks/useBlobObjectUrl";
import { useRehearsalPlayback } from "@/hooks/useRehearsalPlayback";
import { detectCategory } from "@/lib/theme/dreamTheme";
import { useSessionStore } from "@/lib/store/useSessionStore";

export function RehearsalView() {
  const router = useRouter();
  const scriptText = useSessionStore((s) => s.scriptText);
  const audioBlob = useSessionStore((s) => s.audioBlob);
  const photoBase64 = useSessionStore((s) => s.photoBase64);
  const userInput = useSessionStore((s) => s.userInput);
  const dreamCategory = useSessionStore((s) => s.dreamCategory);
  const useBrowserSpeechForTts = useSessionStore(
    (s) => s.useBrowserSpeechForTts
  );

  const canvasRef = useRef<NewsCanvasHandle>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioUrl = useBlobObjectUrl(
    useBrowserSpeechForTts ? null : audioBlob
  );

  const {
    phase,
    karaokeSegments,
    highlightIndex,
    startPlayback,
    handleTimeUpdate,
    handleAudioEnded,
    replay,
  } = useRehearsalPlayback({
    audioRef,
    scriptText,
    useBrowserSpeech: useBrowserSpeechForTts,
  });

  const hasTtsReady = useBrowserSpeechForTts || Boolean(audioBlob);

  useEffect(() => {
    if (!scriptText || !hasTtsReady || !photoBase64) {
      router.replace("/");
    }
  }, [scriptText, hasTtsReady, photoBase64, router]);

  if (!scriptText || !hasTtsReady || !photoBase64) {
    return null;
  }

  const resolvedCategory =
    dreamCategory ?? (userInput ? detectCategory(userInput.dream) : "default");

  return (
    <div className="space-y-4">
      <h1 className="text-center text-2xl font-bold text-abc-charcoal">
        本番の前に練習してみよう！
      </h1>

      {useBrowserSpeechForTts ? (
        <p className="text-center text-xs text-abc-gray">
          デモモード：このパソコンの読み上げでお手本を聞けるよ
        </p>
      ) : null}

      <div className="mx-auto max-w-lg">
        <NewsCanvas
          ref={canvasRef}
          mode="static"
          photoBase64={photoBase64}
          scriptText={scriptText}
          userName={userInput?.name ?? ""}
          dreamCategory={resolvedCategory}
          dreamText={userInput?.dream ?? ""}
        />
      </div>

      {phase === "playing" || phase === "done" ? (
        <KaraokeScript
          segments={karaokeSegments}
          highlightIndex={highlightIndex}
        />
      ) : null}

      {phase === "ready" ? (
        <Button
          type="button"
          onClick={() => void startPlayback()}
          className="h-12 w-full bg-abc-red text-white hover:bg-abc-red/90"
        >
          ▶ AIのお手本を聞く
        </Button>
      ) : null}

      {phase === "done" ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={replay}
            className="h-12 flex-1"
          >
            もう一度
          </Button>
          <Button
            type="button"
            onClick={() => router.push("/recording")}
            className="h-12 flex-1 bg-abc-red text-white hover:bg-abc-red/90"
          >
            すすむ →
          </Button>
        </div>
      ) : null}

      {audioUrl && !useBrowserSpeechForTts ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      ) : null}
    </div>
  );
}
