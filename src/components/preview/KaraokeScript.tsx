"use client";

import { motion } from "framer-motion";

type KaraokeScriptProps = {
  segments: string[];
  highlightIndex: number;
};

export function KaraokeScript({ segments, highlightIndex }: KaraokeScriptProps) {
  if (!segments.length) return null;

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="mb-2 text-xs font-medium text-abc-gray">【テロップエリア】</p>
      <div className="flex flex-wrap gap-2 leading-relaxed">
        {segments.map((segment, index) => {
          const isActive = index === highlightIndex;
          const isDone = highlightIndex > index;

          return (
            <motion.span
              key={`${index}-${segment.slice(0, 8)}`}
              animate={{ scale: isActive ? 1.05 : 1 }}
              className={`rounded px-2 py-1 text-base transition-colors ${
                isActive
                  ? "bg-abc-orange text-white"
                  : isDone
                    ? "text-abc-gray"
                    : "text-abc-charcoal"
              }`}
            >
              {segment}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
