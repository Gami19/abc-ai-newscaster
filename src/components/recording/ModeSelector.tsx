"use client";

import { Button } from "@/components/ui/button";
import type { RecordingMode } from "@/types";

type ModeSelectorProps = {
  onSelect: (mode: RecordingMode) => void;
};

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-center text-2xl font-bold text-abc-charcoal">
        どっちで読む？
      </h1>
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={() => onSelect("solo")}
          className="h-16 bg-abc-red text-lg text-white hover:bg-abc-red/90"
        >
          🎤 ひとりで読む
        </Button>
        <Button
          type="button"
          onClick={() => onSelect("together")}
          className="h-16 bg-abc-orange text-lg text-white hover:bg-abc-orange/90"
        >
          🤝 AIといっしょに読む
        </Button>
      </div>
    </div>
  );
}
