import { create } from "zustand";

import type { UserInput } from "@/types";

type SessionState = {
  userInput: UserInput | null;
  photoBase64: string | null;
  scriptText: string | null;
  audioBlob: Blob | null;
  videoBlob: Blob | null;
  blobUrl: string | null;
  setUserInput: (input: UserInput) => void;
  setPhoto: (base64: string) => void;
  setScript: (text: string) => void;
  setAudio: (blob: Blob) => void;
  setVideo: (blob: Blob) => void;
  setBlobUrl: (url: string) => void;
  reset: () => void;
};

const initialState = {
  userInput: null,
  photoBase64: null,
  scriptText: null,
  audioBlob: null,
  videoBlob: null,
  blobUrl: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,
  setUserInput: (input) => set({ userInput: input }),
  setPhoto: (base64) => set({ photoBase64: base64 }),
  setScript: (text) => set({ scriptText: text }),
  setAudio: (blob) => set({ audioBlob: blob }),
  setVideo: (blob) => set({ videoBlob: blob }),
  setBlobUrl: (url) => set({ blobUrl: url }),
  reset: () => set(initialState),
}));
