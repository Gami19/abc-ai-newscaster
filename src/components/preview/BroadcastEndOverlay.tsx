"use client";

import { motion } from "framer-motion";

type BroadcastEndOverlayProps = {
  showEndBanner: boolean;
};

const CONFETTI_COLORS = ["#FF8C00", "#FF4500", "#FFFFFF", "#FF8C00"];

export function BroadcastEndOverlay({ showEndBanner }: BroadcastEndOverlayProps) {
  return (
    <>
      {showEndBanner ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
        >
          <p className="text-xl font-bold tracking-widest text-white">
            ////// 放 送 終 了 //////
          </p>
        </motion.div>
      ) : null}

      {showEndBanner ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg" aria-hidden>
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ y: -20, x: `${(i * 17) % 100}%`, opacity: 1 }}
              animate={{ y: 280, opacity: 0 }}
              transition={{
                duration: 2 + (i % 3) * 0.3,
                delay: i * 0.05,
                ease: "easeOut",
              }}
              className="absolute top-0 size-2 rounded-sm"
              style={{
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              }}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
