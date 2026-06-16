import type { RefObject } from "react";

import type { DrawFrameCallback } from "@/types";
import { safePlayVideo } from "@/lib/audio/safePlay";

const PREFERRED_MIME = "video/webm;codecs=vp8,opus";
const FALLBACK_MIMES = ["video/webm", "video/webm;codecs=vp9,opus", ""];

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
  hasMicAudio: boolean;
};

export type LiveRecordingHandle = {
  stop: () => Promise<Blob>;
};

export function startLiveRecording(
  params: StartLiveRecordingParams
): LiveRecordingHandle {
  const { canvasRef, videoStream, onFrame, hasMicAudio } = params;

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

  const mimeType = resolveMimeType();

  const startPromise = safePlayVideo(videoEl).then(() => {
    const canvasStream = canvas.captureStream(30);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    if (hasMicAudio) {
      const micTracks = videoStream.getAudioTracks();
      tracks.push(...micTracks);
    }

    const combinedStream = new MediaStream(tracks);
    recorder = mimeType
      ? new MediaRecorder(combinedStream, { mimeType })
      : new MediaRecorder(combinedStream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.start(100);

    const loop = () => {
      if (stopped) return;
      onFrame(ctx, videoEl);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  });

  return {
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        void startPromise
          .then(() => {
            stopped = true;
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
            }

            if (!recorder || recorder.state === "inactive") {
              reject(new Error("録画が開始されていません"));
              return;
            }

            recorder.onstop = () => {
              const type = mimeType || "video/webm";
              resolve(new Blob(chunks, { type }));
            };

            recorder.stop();
          })
          .catch(reject);
      }),
  };
}
