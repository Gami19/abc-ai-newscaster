"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const CONFETTI_COLORS = ["#FF8C00", "#E63946", "#FFFFFF"] as const;
const DURATION_SEC = 3;

type Particle = {
  id: number;
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
  drift: number;
};

type ConfettiProps = {
  count?: number;
  active?: boolean;
  onComplete?: () => void;
};

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: Math.random() * 100,
    size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length] ?? "#FF8C00",
    delay: Math.random() * 0.4,
    duration: 1.8 + Math.random() * 1.4,
    rotate: Math.random() * 720 - 360,
    drift: (Math.random() - 0.5) * 120,
  }));
}

export function Confetti({
  count = 70,
  active = true,
  onComplete,
}: ConfettiProps) {
  const [visible, setVisible] = useState(active);
  const particles = useMemo(() => createParticles(count), [count]);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, DURATION_SEC * 1000);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden
    >
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          initial={{
            opacity: 1,
            x: `${particle.x}vw`,
            y: "-5vh",
            rotate: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            y: "105vh",
            x: `calc(${particle.x}vw + ${particle.drift}px)`,
            rotate: particle.rotate,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "linear",
            opacity: {
              duration: DURATION_SEC,
              times: [0, 0.7, 1],
              ease: "easeOut",
            },
          }}
          style={{
            position: "absolute",
            width: particle.size,
            height: particle.size * 0.6,
            backgroundColor: particle.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
