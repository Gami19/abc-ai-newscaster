"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  NewsCanvas,
  type NewsCanvasHandle,
} from "@/components/canvas/NewsCanvas";
import { AudioVisualizer } from "@/components/recording/AudioVisualizer";
import { KaraokeScript } from "@/components/preview/KaraokeScript";
import { OnAirHeader } from "@/components/preview/OnAirHeader";
import { ModeSelector } from "@/components/recording/ModeSelector";
import { RecordingCountdown } from "@/components/recording/RecordingCountdown";
import { RecordingReview } from "@/components/recording/RecordingReview";
import { Button } from "@/components/ui/button";
import { useRecordingExperience } from "@/hooks/useRecordingExperience";
import { detectCategory } from "@/lib/theme/dreamTheme";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/lib/store/useSessionStore";

export function RecordingView() {
  const router = useRouter();
  const scriptText = useSessionStore((s) => s.scriptText);
  const audioBlob = useSessionStore((s) => s.audioBlob);
  const photoBase64 = useSessionStore((s) => s.photoBase64);
  const userInput = useSessionStore((s) => s.userInput);
  const dreamCategory = useSessionStore((s) => s.dreamCategory);
  const useBrowserSpeechForTts = useSessionStore(
    (s) => s.useBrowserSpeechForTts
  );
  const videoStream = useSessionStore((s) => s.videoStream);
  const audioPermission = useSessionStore((s) => s.audioPermission);

  const canvasRef = useRef<NewsCanvasHandle>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const audioUrl = useMemo(
    () => (audioBlob ? URL.createObjectURL(audioBlob) : null),
    [audioBlob]
  );

  useEffect(() => {
    if (!audioUrl) return;
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const {
    broadcastPhase,
    recordingMode,
    countdownValue,
    recordedBlob,
    isRecording,
    karaokeSegments,
    highlightIndex,
    selectMode,
    startCountdown,
    stopRecording,
    retake,
    confirmRecording,
    handleTimeUpdate,
  } = useRecordingExperience({
    canvasRef,
    audioRef,
    audioContextRef,
    scriptText,
    useBrowserSpeech: useBrowserSpeechForTts,
  });

  useEffect(() => {
    if (!scriptText || !photoBase64) {
      router.replace("/");
    }
  }, [scriptText, photoBase64, router]);

  useEffect(() => {
    if (broadcastPhase === "ended") {
      router.push("/result");
    }
  }, [broadcastPhase, router]);

  if (!scriptText || !photoBase64) {
    return null;
  }

  const resolvedCategory =
    dreamCategory ?? (userInput ? detectCategory(userInput.dream) : "default");

  const showOnAirChrome =
    broadcastPhase === "onair" || broadcastPhase === "countdown";

  return (
    <div className="space-y-4">
      {broadcastPhase === "choosing" ? (
        <ModeSelector onSelect={selectMode} />
      ) : null}

      {broadcastPhase === "countdown" ? (
        <RecordingCountdown
          countdownValue={countdownValue}
          onStart={() => void startCountdown()}
        />
      ) : null}

      {showOnAirChrome ? (
        <OnAirHeader isOnAir={broadcastPhase === "onair" || isRecording} />
      ) : null}

      {broadcastPhase === "onair" || broadcastPhase === "countdown" ? (
        <>
          <NewsCanvas
            ref={canvasRef}
            mode="live"
            videoStream={videoStream}
            enablePreviewLoop={broadcastPhase !== "onair"}
            scriptText={scriptText}
            userName={userInput?.name ?? ""}
            dreamCategory={resolvedCategory}
            dreamText={userInput?.dream ?? ""}
          />

          {broadcastPhase === "onair" ? (
            <div className="space-y-4">
              <AudioVisualizer
                mediaStream={videoStream}
                audioContextRef={audioContextRef}
                isActive={isRecording}
              />

              <KaraokeScript
                segments={karaokeSegments}
                highlightIndex={
                  recordingMode === "together" ? highlightIndex : -1
                }
              />

              {!audioPermission ? (
                <p className="text-center text-xs text-abc-gray">
                  マイクが使えないので、映像だけ録画します
                </p>
              ) : null}

              <Button
                type="button"
                onClick={() => void stopRecording()}
                className={cn(
                  "h-14 w-full bg-abc-red text-lg font-bold text-white hover:bg-abc-red/90"
                )}
              >
                ■ 読みおわった！
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {broadcastPhase === "review" && recordedBlob ? (
        <RecordingReview
          videoBlob={recordedBlob}
          onRetake={retake}
          onConfirm={confirmRecording}
        />
      ) : null}

      {audioUrl && !useBrowserSpeechForTts ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          className="hidden"
        />
      ) : null}
    </div>
  );
}
