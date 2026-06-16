"use client";

import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";

type RecordingCountdownProps = {
  countdownValue: number | null;
  newsIconLoaded: boolean;
  isPreparing: boolean;
  errorMessage: string | null;
  onStart: () => void;
};

export function RecordingCountdown({
  countdownValue,
  newsIconLoaded,
  isPreparing,
  errorMessage,
  onStart,
}: RecordingCountdownProps) {
  const isCounting = countdownValue !== null;
  const canStart = newsIconLoaded && !isPreparing;

  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-bold text-abc-charcoal">
        本番の準備ができたよ！
      </h1>

      {errorMessage ? (
        <p className="text-center text-sm text-abc-red">{errorMessage}</p>
      ) : null}

      {!isCounting ? (
        <Button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className="h-16 w-full bg-abc-red text-xl font-bold text-white hover:bg-abc-red/90 disabled:opacity-60"
        >
          {isPreparing
            ? "じゅんびちゅう..."
            : !newsIconLoaded
              ? "じゅんびちゅう..."
              : "ほうそうスタート！"}
        </Button>
      ) : (
        <AnimatePresence mode="wait">
          <motion.p
            key={countdownValue}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-center text-7xl font-bold text-abc-red"
          >
            {countdownValue}
          </motion.p>
        </AnimatePresence>
      )}
    </div>
  );
}
