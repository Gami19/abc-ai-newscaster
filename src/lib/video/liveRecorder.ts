import type { MutableRefObject, RefObject } from "react";

import { safePlayVideo } from "@/lib/audio/safePlay";
import type { AudioMixer, DrawFrameCallback, NewsCanvasMode } from "@/types";

import { fixRecordedWebm } from "./fixRecordedWebm";

const PREFERRED_MIME = "video/webm;codecs=vp8,opus";
const FALLBACK_MIMES = ["video/webm", "video/webm;codecs=vp9,opus", ""];

const FADE_DURATION_MS = 500;

function resolveMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder is not supported");
  }
  if (MediaRecorder.isTypeSupported(PREFERRED_MIME)) {
    return PREFERRED_MIME;
  }
  for (const mime of FALLBACK_MIMES) {
    if (mime && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return "";
}

export type StartLiveRecordingParams = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  videoStream: MediaStream;
  onFrame: DrawFrameCallback;
  audioMixer: AudioMixer;
  soundtrackDuration: number;
  canvasModeRef: MutableRefObject<NewsCanvasMode>;
  fadeStartTimeRef: MutableRefObject<number | null>;
  onIntroEnd: () => void;
};

export type LiveRecordingResult = {
  blob: Blob;
  durationMs: number;
};

export type LiveRecordingHandle = {
  stop: () => Promise<LiveRecordingResult>;
};

export function startLiveRecording(
  params: StartLiveRecordingParams
): LiveRecordingHandle {
  const {
    canvasRef,
    videoStream,
    onFrame,
    audioMixer,
    soundtrackDuration,
    canvasModeRef,
    fadeStartTimeRef,
    onIntroEnd,
  } = params;

  const canvas = canvasRef.current;
  if (!canvas) {
    throw new Error("Canvas が見つかりません");
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context を取得できません");
  }

  const videoEl = document.createElement("video");
  videoEl.srcObject = videoStream;
  videoEl.muted = true;
  videoEl.playsInline = true;

  const chunks: Blob[] = [];
  let rafId: number | null = null;
  let recorder: MediaRecorder | null = null;
  let stopped = false;
  let introEndTimer: ReturnType<typeof setTimeout> | null = null;
  let fadeCompleteTimer: ReturnType<typeof setTimeout> | null = null;
  let recordingStartedAt = 0;

  const mimeType = resolveMimeType();

  canvasModeRef.current = "intro";
  fadeStartTimeRef.current = null;

  const clearIntroTimers = () => {
    if (introEndTimer !== null) {
      clearTimeout(introEndTimer);
      introEndTimer = null;
    }
    if (fadeCompleteTimer !== null) {
      clearTimeout(fadeCompleteTimer);
      fadeCompleteTimer = null;
    }
  };

  const startPromise = safePlayVideo(videoEl).then(() => {
    const canvasStream = canvas.captureStream(30);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    const mixerTracks = audioMixer.stream.getAudioTracks();
    tracks.push(...mixerTracks);

    const combinedStream = new MediaStream(tracks);
    recorder = mimeType
      ? new MediaRecorder(combinedStream, { mimeType })
      : new MediaRecorder(combinedStream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recordingStartedAt = performance.now();
    recorder.start();
    audioMixer.startSoundtrack();

    introEndTimer = setTimeout(() => {
      audioMixer.fadeToMic(FADE_DURATION_MS / 1000);
      canvasModeRef.current = "fade";
      fadeStartTimeRef.current = performance.now();

      fadeCompleteTimer = setTimeout(() => {
        canvasModeRef.current = "live";
        onIntroEnd();
      }, FADE_DURATION_MS);
    }, soundtrackDuration * 1000);

    const loop = () => {
      if (stopped) return;
      onFrame(ctx, videoEl);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  });

  return {
    stop: () =>
      new Promise<LiveRecordingResult>((resolve, reject) => {
        void startPromise
          .then(() => {
            stopped = true;
            clearIntroTimers();

            if (rafId !== null) {
              cancelAnimationFrame(rafId);
            }

            if (!recorder || recorder.state === "inactive") {
              reject(new Error("録画が開始されていません"));
              return;
            }

            recorder.onstop = () => {
              void (async () => {
                const type = mimeType || "video/webm";
                const rawBlob = new Blob(chunks, { type });
                const durationMs =
                  recordingStartedAt > 0
                    ? performance.now() - recordingStartedAt
                    : 0;
                const blob = await fixRecordedWebm(rawBlob, durationMs);
                resolve({ blob, durationMs });
              })();
            };

            if (recorder.state === "recording") {
              recorder.requestData();
            }
            recorder.stop();
          })
          .catch(reject);
      }),
  };
}
