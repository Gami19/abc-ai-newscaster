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

/** Canvas 右上の REC 表示（録画プレビュー用・Canvas 外枠に重ねる） */
export function IntroRecBadge() {
  return (
    <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full bg-black/50 px-2.5 py-1">
      <motion.span
        className="inline-block h-3 w-3 rounded-full bg-red-500"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="text-sm font-bold text-white">REC</span>
    </div>
  );
}

/** イントロ中の案内 UI（Canvas の下に配置・録画には入らない） */
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
  const panelOpacity = phase === "fading" ? 0 : 1;

  return (
    <motion.div
      className="space-y-3 rounded-lg border border-border bg-abc-white px-4 py-4 shadow-sm"
      animate={{ opacity: panelOpacity }}
      transition={{ duration: 0.5 }}
      aria-live="polite"
    >
      <p className="text-right text-base font-medium leading-snug text-abc-charcoal">
        📱 保護者の方：お手元での動画撮影はお済みですか？
      </p>

      <AnimatePresence mode="wait">
        {phase === "early" ? (
          <motion.p
            key="early-sub"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center text-lg text-abc-charcoal/80"
          >
            げんこうを思い出しておこう 📖
          </motion.p>
        ) : phase === "late" ? (
          <motion.p
            key="late-sub"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center text-lg text-abc-charcoal/80"
          >
            背筋（せすじ）をのばして！⭐
          </motion.p>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === "early" ? (
          <motion.p
            key="early-main"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center text-2xl font-bold text-abc-charcoal"
          >
            🎬 もうすぐきみのばんだよ！
          </motion.p>
        ) : phase === "late" ? (
          <motion.p
            key="late-main"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center text-2xl font-bold text-[#FF4500]"
          >
            📺 カメラを見てね！
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-3 pt-1">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-abc-gray/20">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: barColor }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
        <span className="shrink-0 text-sm tabular-nums text-abc-charcoal">
          残り {remainingSec} 秒
        </span>
      </div>
    </motion.div>
  );
}
