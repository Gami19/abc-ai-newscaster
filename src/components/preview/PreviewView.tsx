"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  NewsCanvas,
  type NewsCanvasHandle,
} from "@/components/canvas/NewsCanvas";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generateVideo } from "@/lib/video";
import { useSessionStore } from "@/lib/store/useSessionStore";

export function PreviewView() {
  const router = useRouter();
  const scriptText = useSessionStore((s) => s.scriptText);
  const audioBlob = useSessionStore((s) => s.audioBlob);
  const photoBase64 = useSessionStore((s) => s.photoBase64);
  const setCanvasImage = useSessionStore((s) => s.setCanvasImage);
  const setVideo = useSessionStore((s) => s.setVideo);
  const setVideoMode = useSessionStore((s) => s.setVideoMode);
  const setBlobUrl = useSessionStore((s) => s.setBlobUrl);

  const canvasRef = useRef<NewsCanvasHandle>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasImageBlobRef = useRef<Blob | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (!scriptText || !audioBlob || !photoBase64) {
      router.replace("/");
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [scriptText, audioBlob, photoBase64, router]);

  const handleCanvasReady = useCallback(
    (blob: Blob) => {
      canvasImageBlobRef.current = blob;
      setCanvasImage(blob);
    },
    [setCanvasImage]
  );

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  }, []);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const uploadVideo = async (blob: Blob, mimeType: string) => {
    const formData = new FormData();
    const extension = mimeType.includes("webm") ? "webm" : "mp4";
    formData.append("file", blob, `abc-news-2035.${extension}`);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { url: string };
    return data.url;
  };

  const handleGenerateVideo = async () => {
    const canvas = canvasRef.current?.getCanvas();
    const imageBlob = canvasImageBlobRef.current;

    if (!canvas || !imageBlob || !audioBlob) {
      setVideoError("まだ画像の準備ができていないよ。少し待ってね。");
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError(null);
    setRemainingSeconds(null);

    try {
      const output = await generateVideo(
        { canvas, canvasImageBlob: imageBlob, audioBlob },
        {
          onProgress: (seconds) => setRemainingSeconds(seconds),
        }
      );

      if (output.type === "fallback") {
        setVideoMode("fallback");
        router.push("/result");
        return;
      }

      setVideo(output.blob, output.mimeType);
      setVideoMode(
        output.mimeType.includes("mp4") ? "ffmpeg" : "mediarecorder"
      );

      const url = await uploadVideo(output.blob, output.mimeType);
      if (url) setBlobUrl(url);

      router.push("/result");
    } catch (error) {
      console.error("[PreviewView] video generation failed", error);
      setVideoError("もう一度ためしてね！");
    } finally {
      setIsGeneratingVideo(false);
      setRemainingSeconds(null);
    }
  };

  if (!scriptText || !audioBlob || !photoBase64) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-bold text-abc-charcoal">
        きみの2035年ニュースができたよ！
      </h1>

      <NewsCanvas
        ref={canvasRef}
        photoBase64={photoBase64}
        scriptText={scriptText}
        onReady={handleCanvasReady}
      />

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="hidden"
        />
      ) : null}

      <Button
        type="button"
        onClick={handlePlayPause}
        disabled={isGeneratingVideo}
        className="h-12 w-full bg-abc-orange text-white hover:bg-abc-orange/90"
      >
        {isPlaying ? "停止" : "ニュースを読み上げる"}
      </Button>

      {isPlaying ? (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-xs text-abc-gray">再生中</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Button
          type="button"
          disabled={isGeneratingVideo}
          onClick={handleGenerateVideo}
          className="h-12 w-full bg-abc-red text-white hover:bg-abc-red/90 disabled:opacity-70"
        >
          {isGeneratingVideo ? "どうがをせいさく中..." : "どうがをつくる！"}
        </Button>
        {isGeneratingVideo && remainingSeconds !== null ? (
          <p className="text-center text-sm text-abc-gray">
            音声を録音中...（あと {remainingSeconds} 秒）
          </p>
        ) : null}
        {videoError ? (
          <p className="text-center text-sm text-abc-red">{videoError}</p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push("/camera")}
        disabled={isGeneratingVideo}
        className="w-full text-abc-gray"
      >
        ← もどる
      </Button>
    </div>
  );
}
