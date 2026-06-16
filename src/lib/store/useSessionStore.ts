import { create } from "zustand";

import type {
  BroadcastPhase,
  DreamCategory,
  RecordingMode,
  UserInput,
} from "@/types";

type SessionState = {
  userInput: UserInput | null;
  photoBase64: string | null;
  scriptText: string | null;
  audioBlob: Blob | null;
  canvasImageBlob: Blob | null;
  videoStream: MediaStream | null;
  audioPermission: boolean;
  recordingMode: RecordingMode | null;
  userVoiceVideoBlob: Blob | null;
  useBrowserSpeechForTts: boolean;
  dreamCategory: DreamCategory | null;
  broadcastPhase: BroadcastPhase;
  highlightIndex: number;
  setUserInput: (input: UserInput) => void;
  setPhoto: (base64: string) => void;
  setScript: (text: string) => void;
  setAudio: (blob: Blob) => void;
  setCanvasImage: (blob: Blob) => void;
  setVideoStream: (stream: MediaStream | null) => void;
  setAudioPermission: (ok: boolean) => void;
  setRecordingMode: (mode: RecordingMode) => void;
  setUserVoiceVideoBlob: (blob: Blob) => void;
  setUseBrowserSpeechForTts: (enabled: boolean) => void;
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
  videoStream: null,
  audioPermission: false,
  recordingMode: null as RecordingMode | null,
  userVoiceVideoBlob: null,
  useBrowserSpeechForTts: false,
  dreamCategory: null as DreamCategory | null,
  broadcastPhase: "standby" as BroadcastPhase,
  highlightIndex: -1,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,
  setUserInput: (input) => set({ userInput: input }),
  setPhoto: (base64) => set({ photoBase64: base64 }),
  setScript: (text) => set({ scriptText: text }),
  setAudio: (blob) => set({ audioBlob: blob }),
  setCanvasImage: (blob) => set({ canvasImageBlob: blob }),
  setVideoStream: (stream) => set({ videoStream: stream }),
  setAudioPermission: (ok) => set({ audioPermission: ok }),
  setRecordingMode: (mode) => set({ recordingMode: mode }),
  setUserVoiceVideoBlob: (blob) => set({ userVoiceVideoBlob: blob }),
  setUseBrowserSpeechForTts: (enabled) =>
    set({ useBrowserSpeechForTts: enabled }),
  setDreamCategory: (category) => set({ dreamCategory: category }),
  setBroadcastPhase: (phase) => set({ broadcastPhase: phase }),
  setHighlightIndex: (index) => set({ highlightIndex: index }),
  reset: () => {
    const { videoStream } = get();
    videoStream?.getTracks().forEach((track) => track.stop());
    set({ ...initialState });
  },
}));
