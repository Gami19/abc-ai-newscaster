"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { CameraNewsOverlay } from "@/components/camera/CameraNewsOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionStore } from "@/lib/store/useSessionStore";

type CameraPhase = "idle" | "preview";

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export function CameraView() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const setPhoto = useSessionStore((s) => s.setPhoto);
  const setVideoStream = useSessionStore((s) => s.setVideoStream);
  const setAudioPermission = useSessionStore((s) => s.setAudioPermission);
  const videoStream = useSessionStore((s) => s.videoStream);

  const [phase, setPhase] = useState<CameraPhase>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);

  const streamReady = Boolean(videoStream);

  useEffect(() => {
    if (videoStream) {
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }
      return;
    }

    let mounted = true;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: VIDEO_CONSTRAINTS,
          audio: true,
        });
        if (!mounted) return;
        setVideoStream(stream);
        setAudioPermission(true);
        setMicDenied(false);
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: VIDEO_CONSTRAINTS,
          });
          if (!mounted) return;
          setVideoStream(stream);
          setAudioPermission(false);
          setMicDenied(true);
        } catch {
          if (mounted) {
            setCameraError(
              "カメラが使えないみたい。設定を確認して、もう一度ためしてね。"
            );
          }
        }
      }
    };

    void initCamera();

    return () => {
      mounted = false;
    };
  }, [setAudioPermission, setVideoStream, videoStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoStream) return;
    video.srcObject = videoStream;
    void video.play().catch(() => undefined);
  }, [videoStream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setCameraError("写真が撮れなかったよ。もう一度ためしてね。");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("写真が撮れなかったよ。もう一度ためしてね。");
      return;
    }

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, 1280, 720);
    ctx.restore();
    const screenshot = canvas.toDataURL("image/jpeg", 0.92);

    setPreviewUrl(screenshot);
    setPhase("preview");
    setCameraError(null);
  }, []);

  const retake = () => {
    setPreviewUrl(null);
    setPhase("idle");
  };

  const confirmPhoto = () => {
    if (!previewUrl) return;
    setPhoto(previewUrl);
    router.push("/generating");
  };

  if (cameraError) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="space-y-6 py-8 text-center">
          <p className="text-base text-abc-charcoal">{cameraError}</p>
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => {
                setCameraError(null);
                setPhase("idle");
              }}
              className="h-12 bg-abc-red text-white hover:bg-abc-red/90"
            >
              もう一度ためす
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="h-12"
            >
              もどる
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardContent className="space-y-4 p-4">
        <h1 className="text-center text-2xl font-bold text-abc-charcoal">
          ABCキャスターっぽくすわってね！📺
        </h1>

        {micDenied ? (
          <p className="text-center text-xs text-abc-gray">
            マイクがつかえないので、AIの声でほうそうします
          </p>
        ) : null}

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
          {phase === "idle" ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full scale-x-[-1] object-cover"
              />
              <CameraNewsOverlay />
            </>
          ) : previewUrl ? (
            <Image
              src={previewUrl}
              alt="撮影プレビュー"
              fill
              unoptimized
              className="object-cover"
            />
          ) : null}
        </div>

        {phase === "idle" ? (
          <Button
            type="button"
            onClick={capturePhoto}
            disabled={!streamReady}
            className="h-12 w-full bg-abc-red text-lg text-white hover:bg-abc-red/90 disabled:opacity-70"
          >
            さつえいする！
          </Button>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={retake}
              className="h-12 flex-1"
            >
              とりなおす
            </Button>
            <Button
              type="button"
              onClick={confirmPhoto}
              className="h-12 flex-1 bg-abc-red text-white hover:bg-abc-red/90"
            >
              これでOK!
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
