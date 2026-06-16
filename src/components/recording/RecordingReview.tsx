"use client";

import { useState } from "react";

import { Confetti } from "@/components/effects/Confetti";
import { Button } from "@/components/ui/button";
import { useBlobObjectUrl } from "@/hooks/useBlobObjectUrl";

type RecordingReviewProps = {
  videoBlob: Blob;
  onRetake: () => void;
  onConfirm: () => void;
};

export function RecordingReview({
  videoBlob,
  onRetake,
  onConfirm,
}: RecordingReviewProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const videoUrl = useBlobObjectUrl(videoBlob);

  const handleConfirmClick = () => {
    setPendingConfirm(true);
    setShowConfetti(true);
  };

  const handleConfettiComplete = () => {
    if (pendingConfirm) {
      onConfirm();
    }
  };

  return (
    <div className="space-y-4">
      {showConfetti ? (
        <Confetti
          count={20}
          active
          onComplete={handleConfettiComplete}
        />
      ) : null}

      <h1 className="text-center text-2xl font-bold text-abc-charcoal">
        できあがりを確認してね！
      </h1>

      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          playsInline
          className="aspect-video w-full rounded-lg border border-border bg-black"
        />
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onRetake}
          disabled={pendingConfirm}
          className="h-12 flex-1"
        >
          ↩ もう一度とる
        </Button>
        <Button
          type="button"
          onClick={handleConfirmClick}
          disabled={pendingConfirm}
          className="h-12 flex-1 bg-abc-red text-white hover:bg-abc-red/90"
        >
          ✅ これでOK！
        </Button>
      </div>
    </div>
  );
}
