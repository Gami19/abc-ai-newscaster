"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import {
  startAudioHighlightSync,
  startElapsedHighlightSync,
} from "@/lib/karaoke/karaokeHighlightSync";
import {
  buildScriptSegments,
  estimateScriptSpeakDuration,
} from "@/lib/karaoke/scriptSegments";
import { safePlayAudio } from "@/lib/audio/safePlay";
import { speakScript, type SpeechPlaybackHandle } from "@/lib/tts/clientSpeech";
import { useSessionStore } from "@/lib/store/useSessionStore";

const TTS_SPEECH_RATE = 0.95;

type RehearsalPhase = "ready" | "playing" | "done";

type UseRehearsalPlaybackOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  scriptText: string | null;
  useBrowserSpeech: boolean;
};

export function useRehearsalPlayback({
  audioRef,
  scriptText,
  useBrowserSpeech,
}: UseRehearsalPlaybackOptions) {
  const setHighlightIndex = useSessionStore((s) => s.setHighlightIndex);
  const highlightIndex = useSessionStore((s) => s.highlightIndex);

  const [phase, setPhase] = useState<RehearsalPhase>("ready");
  const speechHandleRef = useRef<SpeechPlaybackHandle | null>(null);
  const stopHighlightSyncRef = useRef<(() => void) | null>(null);
  const speechStartedAtRef = useRef(0);

  const segments = scriptText
    ? buildScriptSegments(scriptText, TTS_SPEECH_RATE)
    : [];

  const clearHighlightSync = useCallback(() => {
    stopHighlightSyncRef.current?.();
    stopHighlightSyncRef.current = null;
  }, []);

  useEffect(() => {
    setHighlightIndex(-1);
    return () => {
      setHighlightIndex(-1);
      clearHighlightSync();
      speechHandleRef.current?.stop();
    };
  }, [clearHighlightSync, setHighlightIndex]);

  const startPlayback = useCallback(async () => {
    if (!scriptText || segments.length === 0) return;

    setPhase("playing");
    setHighlightIndex(-1);
    clearHighlightSync();

    if (useBrowserSpeech) {
      const durationSec = estimateScriptSpeakDuration(
        scriptText,
        TTS_SPEECH_RATE
      );

      speechHandleRef.current?.stop();
      speechHandleRef.current = speakScript(scriptText, {
        rate: TTS_SPEECH_RATE,
        onStart: () => {
          speechStartedAtRef.current = performance.now();
          stopHighlightSyncRef.current = startElapsedHighlightSync(
            segments,
            durationSec,
            setHighlightIndex,
            () => speechStartedAtRef.current
          );
        },
      });

      await speechHandleRef.current.finished;
      clearHighlightSync();
      setPhase("done");
      setHighlightIndex(-1);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;

    try {
      await safePlayAudio(audio);
      stopHighlightSyncRef.current = startAudioHighlightSync(
        audio,
        segments,
        setHighlightIndex
      );
    } catch (err) {
      console.error("[useRehearsalPlayback] audio play failed", err);
      setPhase("ready");
    }
  }, [
    audioRef,
    clearHighlightSync,
    scriptText,
    segments,
    setHighlightIndex,
    useBrowserSpeech,
  ]);

  const handleAudioEnded = useCallback(() => {
    if (useBrowserSpeech) return;
    clearHighlightSync();
    setPhase("done");
    setHighlightIndex(-1);
  }, [clearHighlightSync, setHighlightIndex, useBrowserSpeech]);

  const replay = useCallback(() => {
    clearHighlightSync();
    speechHandleRef.current?.stop();
    speechHandleRef.current = null;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPhase("ready");
    setHighlightIndex(-1);
  }, [audioRef, clearHighlightSync, setHighlightIndex]);

  const karaokeSegments = segments.map((s) => s.text);

  return {
    phase,
    karaokeSegments,
    highlightIndex,
    startPlayback,
    handleTimeUpdate: () => undefined,
    handleAudioEnded,
    replay,
  };
}
