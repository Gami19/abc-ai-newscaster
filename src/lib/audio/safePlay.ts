/** play() / load 競合による AbortError を吸収し、メタデータ読込後に再生する */
export async function safePlayAudio(
  audio: HTMLAudioElement
): Promise<void> {
  try {
    if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      await audio.play();
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        void audio
          .play()
          .then(resolve)
          .catch((err: unknown) => {
            if (err instanceof DOMException && err.name === "AbortError") {
              resolve();
              return;
            }
            reject(err);
          });
      };

      const onError = () => {
        cleanup();
        reject(new Error("音声の読み込みに失敗しました"));
      };

      const cleanup = () => {
        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("error", onError);
      };

      audio.addEventListener("canplaythrough", onReady, { once: true });
      audio.addEventListener("error", onError, { once: true });
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return;
    }
    throw err;
  }
}

export async function safePlayVideo(video: HTMLVideoElement): Promise<void> {
  try {
    await video.play();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return;
    }
    console.warn("[safePlayVideo] play failed", err);
  }
}

export function stopVideoElement(video: HTMLVideoElement): void {
  video.pause();
  video.srcObject = null;
}
