"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import {
  NewsCanvas,
  type NewsCanvasHandle,
} from "@/components/canvas/NewsCanvas";
import { AudioVisualizer } from "@/components/preview/AudioVisualizer";
import { BroadcastCountdownOverlay } from "@/components/preview/BroadcastCountdownOverlay";
import { BroadcastEndOverlay } from "@/components/preview/BroadcastEndOverlay";
import { BroadcastStartPanel } from "@/components/preview/BroadcastStartPanel";
import { KaraokeScript } from "@/components/preview/KaraokeScript";
import { NewsTicker } from "@/components/preview/NewsTicker";
import { OnAirHeader } from "@/components/preview/OnAirHeader";
import { Button } from "@/components/ui/button";
import { useBroadcastExperience } from "@/hooks/useBroadcastExperience";
import { buildTickerText } from "@/lib/karaoke/tickerMessages";
import { detectCategory } from "@/lib/theme/dreamTheme";
import { cn } from "@/lib/utils";
import { generateVideo } from "@/lib/video";
import { useSessionStore } from "@/lib/store/useSessionStore";

export function PreviewView() {
  const router = useRouter();
  const scriptText = useSessionStore((s) => s.scriptText);
  const audioBlob = useSessionStore((s) => s.audioBlob);
  const photoBase64 = useSessionStore((s) => s.photoBase64);
  const userInput = useSessionStore((s) => s.userInput);
  const dreamCategory = useSessionStore((s) => s.dreamCategory);
  const setCanvasImage = useSessionStore((s) => s.setCanvasImage);
  const setVideo = useSessionStore((s) => s.setVideo);
  const setVideoMode = useSessionStore((s) => s.setVideoMode);
  const setBroadcastPhase = useSessionStore((s) => s.setBroadcastPhase);
  const setHighlightIndex = useSessionStore((s) => s.setHighlightIndex);

  const canvasRef = useRef<NewsCanvasHandle>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasImageBlobRef = useRef<Blob | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const {
    broadcastPhase,
    casterName,
    countdownValue,
    showOnAirLit,
    showEndOverlay,
    showCompletionUI,
    isPlaying,
    karaokeSegments,
    highlightIndex,
    startBroadcast,
    handleAudioEnded,
    handleTimeUpdate,
    replayBroadcast,
  } = useBroadcastExperience({
    audioRef,
    audioContextRef,
    scriptText,
  });

  useEffect(() => {
    setBroadcastPhase("idle");
    setHighlightIndex(-1);
  }, [setBroadcastPhase, setHighlightIndex]);

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

  const handleCanvasReady = useCallback(
    (blob: Blob) => {
      canvasImageBlobRef.current = blob;
      setCanvasImage(blob);
    },
    [setCanvasImage]
  );

  const handleGenerateVideo = async () => {
    const canvas = canvasRef.current?.getCanvas();
    const imageBlob = canvasImageBlobRef.current;

    if (!canvas || !imageBlob || !audioBlob) {
      setVideoError("まだ画像の準備ができていないよ。少し待ってね。");
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError(null);
    setRemainingSeconds(null);

    try {
      const output = await generateVideo(
        { canvas, canvasImageBlob: imageBlob, audioBlob },
        {
          onProgress: (seconds) => setRemainingSeconds(seconds),
        }
      );

      if (output.type === "fallback") {
        setVideoMode("fallback");
        router.push("/result");
        return;
      }

      setVideo(output.blob, output.mimeType);
      setVideoMode(
        output.mimeType.includes("mp4") ? "ffmpeg" : "mediarecorder"
      );

      router.push("/result");
    } catch (error) {
      console.error("[PreviewView] video generation failed", error);
      setVideoError("もう一度ためしてね！");
    } finally {
      setIsGeneratingVideo(false);
      setRemainingSeconds(null);
    }
  };

  if (!scriptText || !audioBlob || !photoBase64) {
    return null;
  }

  const tickerText = userInput ? buildTickerText(userInput) : "";
  const resolvedCategory =
    dreamCategory ?? (userInput ? detectCategory(userInput.dream) : "default");
  const isCountdownPhase =
    broadcastPhase === "standby" || broadcastPhase === "countdown";
  const isIdle = broadcastPhase === "idle";
  const showBroadcastChrome = !isIdle && !showCompletionUI;
  const isOnAirHeaderLit =
    broadcastPhase === "onair" || (isCountdownPhase && showOnAirLit);

  return (
    <div className="space-y-4">
      {showCompletionUI ? (
        <h1 className="text-center text-2xl font-bold text-abc-charcoal">
          🎉 きみの news おかえり、とどいたよ！
        </h1>
      ) : null}

      {showBroadcastChrome ? (
        <OnAirHeader
          isOnAir={isOnAirHeaderLit}
          isEnded={broadcastPhase === "ended"}
        />
      ) : null}

      <div
        className={cn(
          "relative w-full",
          showCompletionUI && "mx-auto max-w-sm"
        )}
      >
        <NewsCanvas
          ref={canvasRef}
          photoBase64={photoBase64}
          scriptText={scriptText}
          userName={userInput?.name ?? ""}
          dreamCategory={resolvedCategory}
          dreamText={userInput?.dream ?? ""}
          onReady={handleCanvasReady}
        />

        {isCountdownPhase ? (
          <BroadcastCountdownOverlay
            casterName={casterName}
            countdownValue={countdownValue}
          />
        ) : null}

        <BroadcastEndOverlay showEndBanner={showEndOverlay} />
      </div>

      {isIdle ? (
        <BroadcastStartPanel
          casterName={casterName}
          onStart={startBroadcast}
        />
      ) : null}

      {!isIdle && !showCompletionUI ? (
        <div
          className={cn(
            "space-y-4",
            broadcastPhase !== "onair" && "invisible"
          )}
          aria-hidden={broadcastPhase !== "onair"}
        >
          <AudioVisualizer
            audioRef={audioRef}
            audioContextRef={audioContextRef}
            isActive={isPlaying}
          />
          <KaraokeScript
            segments={karaokeSegments}
            highlightIndex={highlightIndex}
          />
          {tickerText ? <NewsTicker text={tickerText} /> : null}
        </div>
      ) : null}

      {showCompletionUI ? (
        <>
          <div className="space-y-2">
            <Button
              type="button"
              disabled={isGeneratingVideo}
              onClick={handleGenerateVideo}
              className="h-12 w-full bg-abc-red text-white hover:bg-abc-red/90 disabled:opacity-70"
            >
              {isGeneratingVideo ? "どうがをせいさく中..." : "どうがをつくる！"}
            </Button>
            {isGeneratingVideo && remainingSeconds !== null ? (
              <p className="text-center text-sm text-abc-gray">
                音声を録音中...（あと {remainingSeconds} 秒）
              </p>
            ) : null}
            {videoError ? (
              <p className="text-center text-sm text-abc-red">{videoError}</p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={replayBroadcast}
            disabled={isGeneratingVideo}
            className="w-full text-abc-gray"
          >
            聞きなおす
          </Button>
        </>
      ) : null}

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      ) : null}

      {!showCompletionUI ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/camera")}
          disabled={isGeneratingVideo || !isIdle}
          className="w-full text-abc-gray"
        >
          ← もどる
        </Button>
      ) : null}
    </div>
  );
}
