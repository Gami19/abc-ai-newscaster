import {
  estimateScriptSpeakDuration,
} from "@/lib/karaoke/scriptSegments";

export type SpeechPlaybackHandle = {
  stop: () => void;
  finished: Promise<void>;
};

type SpeakScriptOptions = {
  rate?: number;
  volume?: number;
  onStart?: () => void;
};

export function speakScript(
  text: string,
  options?: SpeakScriptOptions
): SpeechPlaybackHandle {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return {
      stop: () => undefined,
      finished: Promise.resolve(),
    };
  }

  const rate = options?.rate ?? 0.95;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = rate;
  utterance.volume = options?.volume ?? 1;

  const voices = speechSynthesis.getVoices();
  const japaneseVoice = voices.find((voice) => voice.lang.startsWith("ja"));
  if (japaneseVoice) {
    utterance.voice = japaneseVoice;
  }

  let resolveFinished!: () => void;
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  utterance.onstart = () => {
    options?.onStart?.();
  };
  utterance.onend = () => resolveFinished();
  utterance.onerror = () => resolveFinished();

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);

  return {
    stop: () => {
      speechSynthesis.cancel();
      resolveFinished();
    },
    finished,
  };
}

export function primeSpeechVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}

/** @deprecated estimateScriptSpeakDuration を使用 */
export function estimateSpeechDurationSec(
  text: string,
  speechRate = 0.95
): number {
  return estimateScriptSpeakDuration(text, speechRate);
}
