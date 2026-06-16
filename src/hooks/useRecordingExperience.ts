"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { NewsCanvasHandle } from "@/components/canvas/NewsCanvas";
import { safePlayAudio } from "@/lib/audio/safePlay";
import {
  startAudioHighlightSync,
  startElapsedHighlightSync,
} from "@/lib/karaoke/karaokeHighlightSync";
import {
  buildScriptSegments,
  estimateScriptSpeakDuration,
} from "@/lib/karaoke/scriptSegments";
import { speakScript, type SpeechPlaybackHandle } from "@/lib/tts/clientSpeech";
import type { LiveRecordingHandle } from "@/lib/video/liveRecorder";
import { startLiveRecording } from "@/lib/video/liveRecorder";
import { useSessionStore } from "@/lib/store/useSessionStore";
import type { RecordingMode } from "@/types";

const CHIME_SRC = "/sounds/abc-chime.wav";
const TTS_SPEECH_RATE = 0.95;

type UseRecordingExperienceOptions = {
  canvasRef: RefObject<NewsCanvasHandle | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
  audioContextRef: RefObject<AudioContext | null>;
  scriptText: string | null;
  useBrowserSpeech: boolean;
};

export function useRecordingExperience({
  canvasRef,
  audioRef,
  audioContextRef,
  scriptText,
  useBrowserSpeech,
}: UseRecordingExperienceOptions) {
  const broadcastPhase = useSessionStore((s) => s.broadcastPhase);
  const setBroadcastPhase = useSessionStore((s) => s.setBroadcastPhase);
  const setRecordingMode = useSessionStore((s) => s.setRecordingMode);
  const setUserVoiceVideoBlob = useSessionStore((s) => s.setUserVoiceVideoBlob);
  const setHighlightIndex = useSessionStore((s) => s.setHighlightIndex);
  const recordingMode = useSessionStore((s) => s.recordingMode);
  const videoStream = useSessionStore((s) => s.videoStream);
  const audioPermission = useSessionStore((s) => s.audioPermission);
  const highlightIndex = useSessionStore((s) => s.highlightIndex);

  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const recordingHandleRef = useRef<LiveRecordingHandle | null>(null);
  const speechHandleRef = useRef<SpeechPlaybackHandle | null>(null);
  const stopHighlightSyncRef = useRef<(() => void) | null>(null);
  const speechStartedAtRef = useRef(0);
  const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const segments = scriptText
    ? buildScriptSegments(scriptText, TTS_SPEECH_RATE)
    : [];

  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach(clearTimeout);
    countdownTimersRef.current = [];
  }, []);

  const clearHighlightSync = useCallback(() => {
    stopHighlightSyncRef.current?.();
    stopHighlightSyncRef.current = null;
  }, []);

  useEffect(() => {
    setBroadcastPhase("choosing");
    return () => {
      clearCountdownTimers();
      clearHighlightSync();
      speechHandleRef.current?.stop();
      setHighlightIndex(-1);
    };
  }, [clearCountdownTimers, clearHighlightSync, setBroadcastPhase, setHighlightIndex]);

  const playGuideAudio = useCallback(async () => {
    if (!scriptText || segments.length === 0) return;

    clearHighlightSync();

    if (useBrowserSpeech) {
      const durationSec = estimateScriptSpeakDuration(
        scriptText,
        TTS_SPEECH_RATE
      );

      speechHandleRef.current = speakScript(scriptText, {
        rate: TTS_SPEECH_RATE,
        volume: 0.3,
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
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.3;
    audio.currentTime = 0;

    try {
      await safePlayAudio(audio);
      stopHighlightSyncRef.current = startAudioHighlightSync(
        audio,
        segments,
        setHighlightIndex
      );
    } catch (err) {
      console.warn("[useRecordingExperience] guide audio play failed", err);
    }
  }, [
    audioRef,
    clearHighlightSync,
    scriptText,
    segments,
    setHighlightIndex,
    useBrowserSpeech,
  ]);

  const playChime = useCallback(() => {
    const chime = new Audio(CHIME_SRC);
    chime.play().catch((err) => {
      console.warn("[useRecordingExperience] chime play failed", err);
    });
  }, []);

  const selectMode = useCallback(
    (mode: RecordingMode) => {
      setRecordingMode(mode);
      setBroadcastPhase("countdown");
      setCountdownValue(null);
    },
    [setBroadcastPhase, setRecordingMode]
  );

  const startCountdown = useCallback(async () => {
    if (!videoStream) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
    } catch (err) {
      console.warn("[useRecordingExperience] AudioContext resume failed", err);
    }

    clearCountdownTimers();
    setBroadcastPhase("countdown");

    const schedule = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      countdownTimersRef.current.push(id);
    };

    schedule(0, () => setCountdownValue(3));
    schedule(1000, () => setCountdownValue(2));
    schedule(2000, () => setCountdownValue(1));
    schedule(2500, () => playChime());
    schedule(3000, () => {
      setCountdownValue(null);
      setBroadcastPhase("onair");
      setIsRecording(true);
      setHighlightIndex(-1);

      const canvas = canvasRef.current?.getCanvas();
      const onFrame = canvasRef.current?.getDrawFrameCallback();
      if (!canvas || !onFrame) {
        console.error("[useRecordingExperience] canvas not ready");
        return;
      }

      const canvasRefObject = { current: canvas };
      const mode = recordingMode ?? "solo";

      recordingHandleRef.current = startLiveRecording({
        canvasRef: canvasRefObject,
        videoStream,
        onFrame,
        hasMicAudio: audioPermission,
      });

      if (mode === "together") {
        void playGuideAudio();
      }
    });
  }, [
    audioContextRef,
    audioPermission,
    canvasRef,
    clearCountdownTimers,
    playChime,
    playGuideAudio,
    recordingMode,
    setBroadcastPhase,
    setHighlightIndex,
    videoStream,
  ]);

  const handleTimeUpdate = useCallback(() => {
    // ハイライトは rAF 同期（karaokeHighlightSync）で更新
  }, []);

  const stopRecording = useCallback(async () => {
    const handle = recordingHandleRef.current;
    if (!handle) return;

    setIsRecording(false);
    clearHighlightSync();
    speechHandleRef.current?.stop();
    speechHandleRef.current = null;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }

    try {
      const blob = await handle.stop();
      setRecordedBlob(blob);
      setBroadcastPhase("review");
      setHighlightIndex(-1);
    } catch (err) {
      console.error("[useRecordingExperience] stop failed", err);
    } finally {
      recordingHandleRef.current = null;
    }
  }, [
    audioRef,
    clearHighlightSync,
    setBroadcastPhase,
    setHighlightIndex,
  ]);

  const retake = useCallback(() => {
    setRecordedBlob(null);
    recordingHandleRef.current = null;
    speechHandleRef.current?.stop();
    speechHandleRef.current = null;
    clearHighlightSync();
    setBroadcastPhase("choosing");
    setCountdownValue(null);
    setHighlightIndex(-1);
  }, [clearHighlightSync, setBroadcastPhase, setHighlightIndex]);

  const confirmRecording = useCallback(() => {
    if (!recordedBlob) return;
    setUserVoiceVideoBlob(recordedBlob);
    setBroadcastPhase("ended");
  }, [recordedBlob, setBroadcastPhase, setUserVoiceVideoBlob]);

  const karaokeSegments = segments.map((s) => s.text);

  return {
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
  };
}
