"use client";

import { motion } from "framer-motion";

export function FutureRadar() {
  return (
    <div className="relative mx-auto flex size-48 items-center justify-center">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="absolute rounded-full border-2 border-abc-orange/40 bg-gradient-to-br from-abc-orange/30 to-abc-orange/5"
          initial={{ width: 48, height: 48, opacity: 0.8 }}
          animate={{
            width: [48, 192],
            height: [48, 192],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: index * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
      <span className="relative z-10 text-4xl" aria-hidden>
        🌐
      </span>
    </div>
  );
}
