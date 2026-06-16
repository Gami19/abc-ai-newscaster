"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Confetti } from "@/components/effects/Confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionStore } from "@/lib/store/useSessionStore";

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
  const userVoiceVideoBlob = useSessionStore((s) => s.userVoiceVideoBlob);
  const audioPermission = useSessionStore((s) => s.audioPermission);
  const reset = useSessionStore((s) => s.reset);

  const localVideoUrl = useMemo(
    () =>
      userVoiceVideoBlob ? URL.createObjectURL(userVoiceVideoBlob) : null,
    [userVoiceVideoBlob]
  );

  useEffect(() => {
    if (!userVoiceVideoBlob) {
      router.replace("/");
    }
  }, [userVoiceVideoBlob, router]);

  useEffect(() => {
    if (!localVideoUrl) return;
    return () => URL.revokeObjectURL(localVideoUrl);
  }, [localVideoUrl]);

  const handleReset = useCallback(() => {
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    reset();
    router.push("/");
  }, [localVideoUrl, reset, router]);

  const handleDownloadVideo = () => {
    if (!userVoiceVideoBlob) return;
    downloadBlob(userVoiceVideoBlob, "abc-news-2035.webm");
  };

  if (!userVoiceVideoBlob) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Confetti count={70} active />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-abc-charcoal">
          🎉 きみの news おかえり、できたよ！
        </h1>
      </div>

      {localVideoUrl ? (
        <video
          src={localVideoUrl}
          autoPlay
          loop
          playsInline
          controls
          className="aspect-video w-full rounded-lg border border-border bg-black"
        />
      ) : null}

      {!audioPermission ? (
        <p className="text-center text-sm text-abc-gray">
          このどうがには音声が入っていないよ。マイクを許可すると次は声も残せるよ。
        </p>
      ) : null}

      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 py-6">
          <p className="text-center text-sm text-abc-charcoal">
            このパソコンにどうがをほぞんしてね
          </p>
          {localVideoUrl ? (
            <a
              href={localVideoUrl}
              download="abc-news-2035.webm"
              className="inline-flex h-12 w-full max-w-sm items-center justify-center rounded-md bg-abc-red text-white hover:bg-abc-red/90"
            >
              どうがをダウンロード
            </a>
          ) : (
            <Button
              type="button"
              onClick={handleDownloadVideo}
              className="h-12 w-full max-w-sm bg-abc-red text-white hover:bg-abc-red/90"
            >
              どうがをダウンロード
            </Button>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-abc-charcoal">
        ほぞんしたどうがを
        <br />
        おうちにおかえりしよう！
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={handleReset}
        className="h-12 w-full"
      >
        つぎのキャスターへ 🎬
      </Button>
    </div>
  );
}
