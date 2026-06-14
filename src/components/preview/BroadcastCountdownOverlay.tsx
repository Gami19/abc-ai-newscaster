"use client";

import { motion, AnimatePresence } from "framer-motion";

type BroadcastCountdownOverlayProps = {
  casterName: string;
  countdownValue: number | null;
};

export function BroadcastCountdownOverlay({
  casterName,
  countdownValue,
}: BroadcastCountdownOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-black/55 px-4 text-center"
      aria-live="polite"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
      >
        <p className="text-2xl font-bold text-white sm:text-3xl">
          🎬 まもなく放送開始
        </p>
        <p className="text-xl font-bold text-white sm:text-2xl">
          キャスター：{casterName} さん
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {countdownValue !== null ? (
          <motion.span
            key={countdownValue}
            initial={{ scale: 1.5, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="text-7xl font-bold text-abc-orange sm:text-8xl"
          >
            {countdownValue}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
