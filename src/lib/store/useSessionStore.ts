import { create } from "zustand";

import type { BroadcastPhase, DreamCategory, UserInput, VideoMode } from "@/types";

type SessionState = {
  userInput: UserInput | null;
  photoBase64: string | null;
  scriptText: string | null;
  audioBlob: Blob | null;
  canvasImageBlob: Blob | null;
  videoBlob: Blob | null;
  videoMimeType: string | null;
  videoMode: VideoMode | null;
  dreamCategory: DreamCategory | null;
  broadcastPhase: BroadcastPhase;
  highlightIndex: number;
  setUserInput: (input: UserInput) => void;
  setPhoto: (base64: string) => void;
  setScript: (text: string) => void;
  setAudio: (blob: Blob) => void;
  setCanvasImage: (blob: Blob) => void;
  setVideo: (blob: Blob, mimeType: string) => void;
  setVideoMode: (mode: VideoMode) => void;
  setDreamCategory: (category: DreamCategory) => void;
  setBroadcastPhase: (phase: BroadcastPhase) => void;
  setHighlightIndex: (index: number) => void;
  reset: () => void;
};

const initialState = {
  userInput: null,
  photoBase64: null,
  scriptText: null,
  audioBlob: null,
  canvasImageBlob: null,
  videoBlob: null,
  videoMimeType: null,
  videoMode: null,
  dreamCategory: null as DreamCategory | null,
  broadcastPhase: "idle" as BroadcastPhase,
  highlightIndex: -1,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,
  setUserInput: (input) => set({ userInput: input }),
  setPhoto: (base64) => set({ photoBase64: base64 }),
  setScript: (text) => set({ scriptText: text }),
  setAudio: (blob) => set({ audioBlob: blob }),
  setCanvasImage: (blob) => set({ canvasImageBlob: blob }),
  setVideo: (blob, mimeType) => set({ videoBlob: blob, videoMimeType: mimeType }),
  setVideoMode: (mode) => set({ videoMode: mode }),
  setDreamCategory: (category) => set({ dreamCategory: category }),
  setBroadcastPhase: (phase) => set({ broadcastPhase: phase }),
  setHighlightIndex: (index) => set({ highlightIndex: index }),
  reset: () => set(initialState),
}));

export function isResultReady(state: {
  videoBlob: Blob | null;
  videoMode: VideoMode | null;
  canvasImageBlob: Blob | null;
  audioBlob: Blob | null;
}): boolean {
  if (state.videoBlob) return true;
  if (
    state.videoMode === "fallback" &&
    state.canvasImageBlob &&
    state.audioBlob
  ) {
    return true;
  }
  return false;
}
