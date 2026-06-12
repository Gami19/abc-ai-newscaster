import type { GenerateVideoInput, VideoOutput } from "@/types";

function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration || 10);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("音声の読み込みに失敗しました"));
    });
  });
}

export async function generateMediaRecorderVideo(
  input: GenerateVideoInput,
  onProgress?: (remainingSeconds: number) => void
): Promise<VideoOutput> {
  const canvas = input.canvas;
  const duration = await getAudioDuration(input.audioBlob);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
    ? "video/webm;codecs=vp8,opus"
    : "video/webm";

  const videoStream = canvas.captureStream(30);
  const audioContext = new AudioContext();
  const arrayBuffer = await input.audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  const destination = audioContext.createMediaStreamDestination();
  source.connect(destination);

  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...destination.stream.getAudioTracks(),
  ]);

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, { mimeType });

  const recordingDone = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType.split(";")[0] }));
    };
    recorder.onerror = () => reject(new Error("動画の録画に失敗しました"));
  });

  const startTime = performance.now();
  const progressTimer = window.setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    const remaining = Math.max(0, Math.ceil(duration - elapsed));
    onProgress?.(remaining);
  }, 500);

  recorder.start(200);
  source.start(0);

  await new Promise<void>((resolve) => {
    source.onended = () => resolve();
  });

  recorder.stop();
  window.clearInterval(progressTimer);
  await audioContext.close();

  const blob = await recordingDone;

  return {
    type: "video",
    blob,
    mimeType: blob.type || "video/webm",
  };
}
