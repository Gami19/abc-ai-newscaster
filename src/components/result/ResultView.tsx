"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isResultReady, useSessionStore } from "@/lib/store/useSessionStore";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ResultView() {
  const router = useRouter();
  const videoBlob = useSessionStore((s) => s.videoBlob);
  const videoMimeType = useSessionStore((s) => s.videoMimeType);
  const videoMode = useSessionStore((s) => s.videoMode);
  const canvasImageBlob = useSessionStore((s) => s.canvasImageBlob);
  const audioBlob = useSessionStore((s) => s.audioBlob);
  const blobUrl = useSessionStore((s) => s.blobUrl);
  const reset = useSessionStore((s) => s.reset);

  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const isFallback = videoMode === "fallback";

  useEffect(() => {
    if (!isResultReady({ videoBlob, videoMode, canvasImageBlob, audioBlob })) {
      router.replace("/");
      return;
    }

    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setLocalVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    if (isFallback && canvasImageBlob) {
      const url = URL.createObjectURL(canvasImageBlob);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [
    videoBlob,
    videoMode,
    canvasImageBlob,
    audioBlob,
    isFallback,
    router,
  ]);

  const handleReset = useCallback(() => {
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    reset();
    router.push("/");
  }, [localVideoUrl, imagePreviewUrl, reset, router]);

  const handleDownloadVideo = () => {
    if (!videoBlob) return;
    const ext = videoMimeType?.includes("webm") ? "webm" : "mp4";
    downloadBlob(videoBlob, `abc-news-2035.${ext}`);
  };

  const handleDownloadImage = () => {
    if (!canvasImageBlob) return;
    downloadBlob(canvasImageBlob, "abc-news-2035.jpg");
  };

  const handleDownloadAudio = () => {
    if (!audioBlob) return;
    const ext = audioBlob.type.includes("mpeg") ? "mp3" : "wav";
    downloadBlob(audioBlob, `abc-news-2035.${ext}`);
  };

  if (!isResultReady({ videoBlob, videoMode, canvasImageBlob, audioBlob })) {
    return null;
  }

  const downloadHref = blobUrl ?? localVideoUrl ?? undefined;
  const downloadExt = videoMimeType?.includes("webm") ? "webm" : "mp4";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-abc-charcoal">
          🎉 きみの news おかえり、完成！
        </h1>
        <div
          className="mt-2 h-8"
          aria-hidden
          data-confetti-placeholder
        />
      </div>

      {isFallback ? (
        <Card className="border-border shadow-sm">
          <CardContent className="space-y-4 py-6">
            <p className="text-center text-sm text-abc-charcoal">
              画像と音声を保存してね！
            </p>
            {imagePreviewUrl ? (
              <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-lg">
                <Image
                  src={imagePreviewUrl}
                  alt="ニュース画像プレビュー"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : null}
            <Button
              type="button"
              onClick={handleDownloadImage}
              className="h-12 w-full bg-abc-orange text-white hover:bg-abc-orange/90"
            >
              画像をほぞんする
            </Button>
            <Button
              type="button"
              onClick={handleDownloadAudio}
              variant="outline"
              className="h-12 w-full"
            >
              おとをほぞんする
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {localVideoUrl ? (
            <video
              src={localVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls
              className="aspect-video w-full rounded-lg border border-border bg-black"
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {blobUrl ? (
              <Card className="border-border shadow-sm">
                <CardContent className="flex flex-col items-center gap-3 py-6">
                  <p className="text-sm font-medium text-abc-charcoal">QRコード</p>
                  <QRCodeSVG value={blobUrl} size={160} />
                  <p className="text-center text-xs text-abc-gray">
                    保護者のスマホで読み取ってね
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border shadow-sm">
                <CardContent className="py-6 text-center text-sm text-abc-gray">
                  QRコードは Blob 設定後に表示されます。
                  <br />
                  いまはこの端末でダウンロードしてね。
                </CardContent>
              </Card>
            )}

            <Card className="border-border shadow-sm">
              <CardContent className="flex flex-col justify-center gap-3 py-6">
                {downloadHref ? (
                  <a
                    href={downloadHref}
                    download={`abc-news-2035.${downloadExt}`}
                    className="inline-flex h-12 w-full items-center justify-center rounded-md bg-abc-red text-white hover:bg-abc-red/90"
                  >
                    ダウンロード
                  </a>
                ) : (
                  <Button
                    type="button"
                    onClick={handleDownloadVideo}
                    className="h-12 w-full bg-abc-red text-white hover:bg-abc-red/90"
                  >
                    ダウンロード
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-abc-charcoal">
            このQRをよみとると
            <br />
            どうががおうちにおかえりするよ！
          </p>
        </>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleReset}
        className="h-12 w-full"
      >
        つぎのキャスターへ
      </Button>
    </div>
  );
}
