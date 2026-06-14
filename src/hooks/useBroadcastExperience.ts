"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import {
  buildScriptSegments,
  getHighlightIndexFromTime,
} from "@/lib/karaoke/scriptSegments";
import { useSessionStore } from "@/lib/store/useSessionStore";
import type { ScriptSegment } from "@/types";

const CHIME_SRC = "/sounds/abc-chime.wav";

/** Phase C: 放送終了オーバーレイの表示時間（ms） */
const PHASE_C_OVERLAY_START_MS = 1000;
const PHASE_C_OVERLAY_DURATION_MS = 4000;
const PHASE_C_COMPLETION_MS =
  PHASE_C_OVERLAY_START_MS + PHASE_C_OVERLAY_DURATION_MS + 500;

type UseBroadcastExperienceOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  scriptText: string | null;
};

export function useBroadcastExperience({
  audioRef,
  scriptText,
}: UseBroadcastExperienceOptions) {
  const broadcastPhase = useSessionStore((s) => s.broadcastPhase);
  const setBroadcastPhase = useSessionStore((s) => s.setBroadcastPhase);
  const setHighlightIndex = useSessionStore((s) => s.setHighlightIndex);
  const userInput = useSessionStore((s) => s.userInput);

  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [showOnAirLit, setShowOnAirLit] = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [showCompletionUI, setShowCompletionUI] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const segmentsRef = useRef<ScriptSegment[]>([]);
  const phaseATimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseCTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearPhaseATimers = () => {
    phaseATimersRef.current.forEach(clearTimeout);
    phaseATimersRef.current = [];
  };

  const clearPhaseCTimers = () => {
    phaseCTimersRef.current.forEach(clearTimeout);
    phaseCTimersRef.current = [];
  };

  const playChime = useCallback(() => {
    const chime = new Audio(CHIME_SRC);
    chime.play().catch((err) => {
      console.warn("[useBroadcastExperience] chime play failed", err);
    });
  }, []);

  const startOnAir = useCallback(async () => {
    setBroadcastPhase("onair");
    setCountdownValue(null);
    setShowOnAirLit(true);

    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.currentTime = 0;
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("[useBroadcastExperience] audio play failed", err);
      setIsPlaying(false);
    }
  }, [audioRef, setBroadcastPhase]);

  const runPhaseA = useCallback(() => {
    clearPhaseATimers();
    setShowEndOverlay(false);
    setShowCompletionUI(false);
    setShowOnAirLit(false);
    setCountdownValue(null);
    setHighlightIndex(-1);
    setBroadcastPhase("standby");

    const schedule = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      phaseATimersRef.current.push(id);
    };

    schedule(1000, () => {
      setBroadcastPhase("countdown");
      setCountdownValue(3);
    });
    schedule(2000, () => setCountdownValue(2));
    schedule(3000, () => setCountdownValue(1));
    schedule(3500, () => playChime());
    schedule(4000, () => setShowOnAirLit(true));
    schedule(5000, () => void startOnAir());
  }, [playChime, setBroadcastPhase, setHighlightIndex, startOnAir]);

  const startBroadcast = useCallback(() => {
    runPhaseA();
  }, [runPhaseA]);

  const runPhaseC = useCallback(() => {
    clearPhaseCTimers();
    setIsPlaying(false);
    setBroadcastPhase("ended");
    setShowOnAirLit(false);
    setHighlightIndex(-1);

    const schedule = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      phaseCTimersRef.current.push(id);
    };

    schedule(PHASE_C_OVERLAY_START_MS, () => setShowEndOverlay(true));
    schedule(PHASE_C_COMPLETION_MS, () => {
      setShowEndOverlay(false);
      setShowCompletionUI(true);
    });
  }, [setBroadcastPhase, setHighlightIndex]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    runPhaseC();
  }, [runPhaseC]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    const segments = segmentsRef.current;
    if (!audio || !segments.length || broadcastPhase !== "onair") return;

    const index = getHighlightIndexFromTime(
      segments,
      audio.currentTime,
      audio.duration
    );
    setHighlightIndex(index);
  }, [audioRef, broadcastPhase, setHighlightIndex]);

  const replayBroadcast = useCallback(() => {
    clearPhaseCTimers();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setShowCompletionUI(false);
    setShowEndOverlay(false);
    setBroadcastPhase("idle");
  }, [audioRef, setBroadcastPhase]);

  useEffect(() => {
    if (!scriptText) {
      segmentsRef.current = [];
      return;
    }
    segmentsRef.current = buildScriptSegments(scriptText);
  }, [scriptText]);

  useEffect(() => {
    return () => {
      clearPhaseATimers();
      clearPhaseCTimers();
    };
  }, []);

  const karaokeSegments = scriptText
    ? buildScriptSegments(scriptText).map((s) => s.text)
    : [];

  const highlightIndex = useSessionStore((s) => s.highlightIndex);

  return {
    broadcastPhase,
    casterName: userInput?.name ?? "",
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
  };
}
