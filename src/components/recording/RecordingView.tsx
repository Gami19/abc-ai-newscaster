"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  NewsCanvas,
  type NewsCanvasHandle,
} from "@/components/canvas/NewsCanvas";
import { AudioVisualizer } from "@/components/recording/AudioVisualizer";
import { IntroOverlay } from "@/components/recording/IntroOverlay";
import { KaraokeScript } from "@/components/preview/KaraokeScript";
import { OnAirHeader } from "@/components/preview/OnAirHeader";
import { ModeSelector } from "@/components/recording/ModeSelector";
import { RecordingCountdown } from "@/components/recording/RecordingCountdown";
import { RecordingReview } from "@/components/recording/RecordingReview";
import { Button } from "@/components/ui/button";
import { useBlobObjectUrl } from "@/hooks/useBlobObjectUrl";
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

  const audioUrl = useBlobObjectUrl(
    useBrowserSpeechForTts ? null : audioBlob
  );

  const {
    broadcastPhase,
    recordingMode,
    countdownValue,
    recordedBlob,
    recordedDurationMs,
    isRecording,
    karaokeSegments,
    highlightIndex,
    newsIconLoaded,
    isPreparingCountdown,
    introStartTime,
    soundtrackDuration,
    countdownError,
    canvasModeRef,
    introStartTimeRef,
    fadeStartTimeRef,
    newsIconImageRef,
    showRecordingCanvas,
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

  const showIntroOverlay =
    (broadcastPhase === "intro" || broadcastPhase === "fade") &&
    introStartTime != null &&
    soundtrackDuration != null;

  return (
    <div className="space-y-4">
      {broadcastPhase === "choosing" ? (
        <ModeSelector onSelect={selectMode} />
      ) : null}

      {broadcastPhase === "countdown" ? (
        <RecordingCountdown
          countdownValue={countdownValue}
          newsIconLoaded={newsIconLoaded}
          isPreparing={isPreparingCountdown}
          errorMessage={countdownError}
          onStart={() => void startCountdown()}
        />
      ) : null}

      {broadcastPhase === "onair" ? (
        <OnAirHeader isOnAir={isRecording} />
      ) : null}

      {showRecordingCanvas ? (
        <div
          className={cn(
            "relative w-full",
            broadcastPhase === "countdown" &&
              "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          )}
        >
          <NewsCanvas
            ref={canvasRef}
            mode="live"
            videoStream={videoStream}
            enablePreviewLoop={false}
            scriptText={scriptText}
            userName={userInput?.name ?? ""}
            dreamCategory={resolvedCategory}
            dreamText={userInput?.dream ?? ""}
            canvasModeRef={canvasModeRef}
            introStartTimeRef={introStartTimeRef}
            fadeStartTimeRef={fadeStartTimeRef}
            newsIconImageRef={newsIconImageRef}
          />

          {showIntroOverlay ? (
            <IntroOverlay
              introStartTime={introStartTime}
              totalDuration={soundtrackDuration}
            />
          ) : null}
        </div>
      ) : null}

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

      {broadcastPhase === "review" &&
      recordedBlob &&
      recordedDurationMs != null ? (
        <RecordingReview
          videoBlob={recordedBlob}
          durationMs={recordedDurationMs}
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
