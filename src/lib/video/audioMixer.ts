import type { AudioMixer } from "@/types";

export type CreateAudioMixerParams = {
  soundtrackUrl: string;
  microphoneStream: MediaStream | null;
  ttsAudioElement?: HTMLAudioElement | null;
};

export async function createAudioMixer(
  params: CreateAudioMixerParams
): Promise<AudioMixer> {
  const { soundtrackUrl, microphoneStream, ttsAudioElement } = params;

  const audioCtx = new AudioContext();

  const response = await fetch(soundtrackUrl);
  if (!response.ok) {
    throw new Error("サウンドトラックの読み込みに失敗しました");
  }

  const arrayBuffer = await response.arrayBuffer();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    throw new Error("サウンドトラックのデコードに失敗しました");
  }

  const soundtrackSource = audioCtx.createBufferSource();
  soundtrackSource.buffer = audioBuffer;
  soundtrackSource.loop = false;

  const soundtrackGain = audioCtx.createGain();
  soundtrackGain.gain.value = 0;

  const monitorGain = audioCtx.createGain();
  monitorGain.gain.value = 0;

  const micGain = audioCtx.createGain();
  micGain.gain.value = 0;

  const togetherGain = audioCtx.createGain();
  togetherGain.gain.value = 0;

  const destination = audioCtx.createMediaStreamDestination();

  soundtrackSource.connect(soundtrackGain);
  soundtrackGain.connect(destination);
  soundtrackGain.connect(monitorGain);
  monitorGain.connect(audioCtx.destination);

  if (microphoneStream && microphoneStream.getAudioTracks().length > 0) {
    try {
      const micSource = audioCtx.createMediaStreamSource(microphoneStream);
      micSource.connect(micGain);
      micGain.connect(destination);
    } catch {
      // マイク接続失敗時はサウンドトラックのみ
    }
  }

  if (ttsAudioElement) {
    try {
      const ttsSource = audioCtx.createMediaElementSource(ttsAudioElement);
      ttsSource.connect(togetherGain);
      togetherGain.connect(destination);
      togetherGain.connect(audioCtx.destination);
    } catch (err) {
      console.warn("[createAudioMixer] TTS element connect failed", err);
    }
  }

  let stopped = false;

  return {
    stream: destination.stream,

    startSoundtrack() {
      if (stopped) return;
      if (audioCtx.state === "suspended") {
        void audioCtx.resume();
      }
      soundtrackSource.start(0);
      soundtrackGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
      monitorGain.gain.setValueAtTime(0.55, audioCtx.currentTime);
    },

    fadeToMic(duration: number) {
      if (stopped) return;
      const t = audioCtx.currentTime;
      soundtrackGain.gain.linearRampToValueAtTime(0.0, t + duration);
      monitorGain.gain.linearRampToValueAtTime(0.0, t + duration);
      micGain.gain.linearRampToValueAtTime(1.0, t + duration);
      togetherGain.gain.linearRampToValueAtTime(0.3, t + duration);
    },

    getSoundtrackDuration() {
      return audioBuffer.duration;
    },

    stop() {
      if (stopped) return;
      stopped = true;
      try {
        soundtrackSource.stop();
      } catch {
        // already stopped
      }
      void audioCtx.close();
    },
  };
}
