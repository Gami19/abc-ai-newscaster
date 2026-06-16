"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { IntroPhase } from "@/types";

type IntroOverlayProps = {
  introStartTime: number;
  totalDuration: number;
};

function getIntroPhase(elapsedSec: number): IntroPhase {
  if (elapsedSec < 6) return "early";
  if (elapsedSec < 7.5) return "late";
  return "fading";
}

export function IntroOverlay({
  introStartTime,
  totalDuration,
}: IntroOverlayProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    let rafId: number;

    const tick = () => {
      setElapsedMs(performance.now() - introStartTime);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [introStartTime]);

  const elapsedSec = elapsedMs / 1000;
  const phase = getIntroPhase(elapsedSec);
  const progress = Math.min(1, elapsedSec / totalDuration);
  const remainingSec = Math.max(0, Math.ceil(totalDuration - elapsedSec));
  const barColor = progress >= 0.75 ? "#FF4500" : "#FF8C00";

  const overlayOpacity = phase === "fading" ? 0 : 1;

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-10"
      animate={{ opacity: overlayOpacity }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <motion.span
          className="inline-block h-3 w-3 rounded-full bg-red-500"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="text-sm font-bold text-white">REC</span>
      </div>

      <p className="absolute bottom-20 right-4 max-w-[160px] text-right text-xs text-white/50">
        📱 保護者の方：お手元での動画撮影はお済みですか？
      </p>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-4 pb-4 pt-16"
        style={{
          height: "35%",
          background:
            "linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.75))",
        }}
      >
        <AnimatePresence mode="wait">
          {phase === "early" ? (
            <motion.p
              key="early-sub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-2 text-center text-xl text-white/80"
            >
              げんこうを思い出しておこう 📖
            </motion.p>
          ) : phase === "late" ? (
            <motion.p
              key="late-sub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-2 text-center text-xl text-white/80"
            >
              よいしせいで！⭐
            </motion.p>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {phase === "early" ? (
            <motion.p
              key="early-main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 text-center text-2xl font-bold text-white"
            >
              🎬 もうすぐきみのばんだよ！
            </motion.p>
          ) : phase === "late" ? (
            <motion.p
              key="late-main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 text-center text-2xl font-bold text-[#FF4500]"
            >
              📺 カメラを見てね！
            </motion.p>
          ) : null}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: barColor }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
          <span className="shrink-0 text-sm text-white">
            残り {remainingSec} 秒
          </span>
        </div>
      </div>
    </motion.div>
  );
}
