"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { NewsCanvasHandle } from "@/components/canvas/NewsCanvas";
import {
  startAudioHighlightSync,
  startElapsedHighlightSync,
} from "@/lib/karaoke/karaokeHighlightSync";
import {
  buildScriptSegments,
  estimateScriptSpeakDuration,
} from "@/lib/karaoke/scriptSegments";
import { speakScript, type SpeechPlaybackHandle } from "@/lib/tts/clientSpeech";
import { createAudioMixer } from "@/lib/video/audioMixer";
import type { LiveRecordingHandle } from "@/lib/video/liveRecorder";
import { startLiveRecording } from "@/lib/video/liveRecorder";
import { useSessionStore } from "@/lib/store/useSessionStore";
import type { AudioMixer, NewsCanvasMode, RecordingMode } from "@/types";

const CHIME_SRC = "/sounds/abc-chime.wav";
const SOUNDTRACK_SRC = "/intro/news-soundtrack.mp3";
const NEWS_ICON_SRC = "/intro/news-icon.png";
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
  const audioBlob = useSessionStore((s) => s.audioBlob);
  const highlightIndex = useSessionStore((s) => s.highlightIndex);

  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [newsIconLoaded, setNewsIconLoaded] = useState(false);
  const [isPreparingCountdown, setIsPreparingCountdown] = useState(false);
  const [introStartTime, setIntroStartTime] = useState<number | null>(null);
  const [soundtrackDuration, setSoundtrackDuration] = useState<number | null>(
    null
  );
  const [countdownError, setCountdownError] = useState<string | null>(null);

  const recordingHandleRef = useRef<LiveRecordingHandle | null>(null);
  const speechHandleRef = useRef<SpeechPlaybackHandle | null>(null);
  const stopHighlightSyncRef = useRef<(() => void) | null>(null);
  const speechStartedAtRef = useRef(0);
  const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioMixerRef = useRef<AudioMixer | null>(null);
  const canvasModeRef = useRef<NewsCanvasMode>("intro");
  const introStartTimeRef = useRef<number | null>(null);
  const fadeStartTimeRef = useRef<number | null>(null);
  const newsIconImageRef = useRef<HTMLImageElement | null>(null);
  const guideAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const guideAudioUrlRef = useRef<string | null>(null);

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

  const cleanupGuideAudio = useCallback(() => {
    if (guideAudioElementRef.current) {
      guideAudioElementRef.current.pause();
      guideAudioElementRef.current = null;
    }
    if (guideAudioUrlRef.current) {
      URL.revokeObjectURL(guideAudioUrlRef.current);
      guideAudioUrlRef.current = null;
    }
  }, []);

  const cleanupAudioMixer = useCallback(() => {
    audioMixerRef.current?.stop();
    audioMixerRef.current = null;
  }, []);

  const resetIntroState = useCallback(() => {
    canvasModeRef.current = "intro";
    introStartTimeRef.current = null;
    fadeStartTimeRef.current = null;
    setIntroStartTime(null);
    setSoundtrackDuration(null);
  }, []);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      newsIconImageRef.current = image;
      setNewsIconLoaded(true);
    };
    image.onerror = () => {
      console.error("[useRecordingExperience] news-icon load failed");
    };
    image.src = NEWS_ICON_SRC;

    setBroadcastPhase("choosing");
    return () => {
      clearCountdownTimers();
      clearHighlightSync();
      cleanupGuideAudio();
      cleanupAudioMixer();
      speechHandleRef.current?.stop();
      setHighlightIndex(-1);
    };
  }, [
    cleanupAudioMixer,
    cleanupGuideAudio,
    clearCountdownTimers,
    clearHighlightSync,
    setBroadcastPhase,
    setHighlightIndex,
  ]);

  const createGuideAudioElement = useCallback((): HTMLAudioElement | null => {
    if (!audioBlob) return null;
    cleanupGuideAudio();
    const url = URL.createObjectURL(audioBlob);
    guideAudioUrlRef.current = url;
    const audio = new Audio(url);
    guideAudioElementRef.current = audio;
    return audio;
  }, [audioBlob, cleanupGuideAudio]);

  const playGuideAudioAfterIntro = useCallback(async () => {
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

    const audio = guideAudioElementRef.current ?? audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;

    try {
      await audio.play();
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
      setCountdownError(null);
    },
    [setBroadcastPhase, setRecordingMode]
  );

  const startCountdown = useCallback(async () => {
    if (!videoStream || isPreparingCountdown) return;

    setIsPreparingCountdown(true);
    setCountdownError(null);

    try {
      cleanupAudioMixer();
      cleanupGuideAudio();

      const mode = recordingMode ?? "solo";
      let ttsElement: HTMLAudioElement | undefined;

      if (mode === "together" && !useBrowserSpeech && audioBlob) {
        const guideAudio = createGuideAudioElement();
        ttsElement = guideAudio ?? undefined;
      }

      const mixer = await createAudioMixer({
        soundtrackUrl: SOUNDTRACK_SRC,
        microphoneStream: audioPermission ? videoStream : null,
        ttsAudioElement: ttsElement,
      });

      audioMixerRef.current = mixer;
      const duration = mixer.getSoundtrackDuration();
      setSoundtrackDuration(duration);

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const visualizerCtx = audioContextRef.current;
      if (visualizerCtx.state === "suspended") {
        await visualizerCtx.resume();
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
        setHighlightIndex(-1);

        const canvas = canvasRef.current?.getCanvas();
        const onFrame = canvasRef.current?.getDrawFrameCallback();
        if (!canvas || !onFrame || !audioMixerRef.current) {
          console.error("[useRecordingExperience] canvas or mixer not ready");
          setCountdownError("録画の準備に失敗しました。もう一度ためしてね。");
          setBroadcastPhase("countdown");
          return;
        }

        const startedAt = performance.now();
        introStartTimeRef.current = startedAt;
        setIntroStartTime(startedAt);
        canvasModeRef.current = "intro";
        fadeStartTimeRef.current = null;

        setBroadcastPhase("intro");
        setIsRecording(true);

        const canvasRefObject = { current: canvas };

        recordingHandleRef.current = startLiveRecording({
          canvasRef: canvasRefObject,
          videoStream,
          onFrame,
          audioMixer: audioMixerRef.current,
          soundtrackDuration: duration,
          canvasModeRef,
          fadeStartTimeRef,
          onIntroEnd: () => {
            setBroadcastPhase("onair");
            if (mode === "together") {
              void playGuideAudioAfterIntro();
            }
          },
        });
      });
    } catch (err) {
      console.error("[useRecordingExperience] startCountdown failed", err);
      cleanupAudioMixer();
      cleanupGuideAudio();
      setCountdownError(
        "サウンドの準備に失敗しました。もう一度ためしてね。"
      );
      setBroadcastPhase("countdown");
    } finally {
      setIsPreparingCountdown(false);
    }
  }, [
    audioBlob,
    audioContextRef,
    audioPermission,
    canvasRef,
    cleanupAudioMixer,
    cleanupGuideAudio,
    clearCountdownTimers,
    createGuideAudioElement,
    isPreparingCountdown,
    playChime,
    playGuideAudioAfterIntro,
    recordingMode,
    setBroadcastPhase,
    setHighlightIndex,
    useBrowserSpeech,
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

    const audio = guideAudioElementRef.current ?? audioRef.current;
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
      cleanupAudioMixer();
    }
  }, [
    audioRef,
    cleanupAudioMixer,
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
    cleanupAudioMixer();
    cleanupGuideAudio();
    resetIntroState();
    setBroadcastPhase("choosing");
    setCountdownValue(null);
    setCountdownError(null);
    setIsRecording(false);
    setHighlightIndex(-1);
  }, [
    cleanupAudioMixer,
    cleanupGuideAudio,
    clearHighlightSync,
    resetIntroState,
    setBroadcastPhase,
    setHighlightIndex,
  ]);

  const confirmRecording = useCallback(() => {
    if (!recordedBlob) return;
    setUserVoiceVideoBlob(recordedBlob);
    setBroadcastPhase("ended");
  }, [recordedBlob, setBroadcastPhase, setUserVoiceVideoBlob]);

  const karaokeSegments = segments.map((s) => s.text);

  const showRecordingCanvas =
    broadcastPhase === "countdown" ||
    broadcastPhase === "intro" ||
    broadcastPhase === "fade" ||
    broadcastPhase === "onair";

  return {
    broadcastPhase,
    recordingMode,
    countdownValue,
    recordedBlob,
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
  };
}
