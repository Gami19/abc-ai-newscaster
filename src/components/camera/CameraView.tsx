"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionStore } from "@/lib/store/useSessionStore";

type CameraPhase = "idle" | "preview";

export function CameraView() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const setPhoto = useSessionStore((s) => s.setPhoto);
  const [phase, setPhase] = useState<CameraPhase>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleUserMediaError = useCallback(() => {
    setCameraError(
      "カメラが使えないみたい。設定を確認して、もう一度ためしてね。"
    );
  }, []);

  const capturePhoto = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot({
      width: 1280,
      height: 720,
    });

    if (!screenshot) {
      setCameraError("写真が撮れなかったよ。もう一度ためしてね。");
      return;
    }

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
          ニュースキャスターになろう！
        </h1>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
          {phase === "idle" ? (
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: "user",
              }}
              onUserMediaError={handleUserMediaError}
              className="h-full w-full object-cover"
            />
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
            className="h-12 w-full bg-abc-red text-lg text-white hover:bg-abc-red/90"
          >
            撮影する
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
