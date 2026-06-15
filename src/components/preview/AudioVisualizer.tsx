"use client";

import { useEffect, useRef } from "react";

type VisualizerMode = "analyser" | "pseudo" | "decorative";

type AudioVisualizerProps = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioContextRef: React.RefObject<AudioContext | null>;
  isActive: boolean;
};

const BAR_COUNT = 16;
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 80;

function barColor(normalized: number): string {
  if (normalized > 0.65) return "#FF4500";
  if (normalized > 0.35) return "#FF8C00";
  return "#FFD700";
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  centerY: number,
  barWidth: number,
  barHeight: number,
  color: string
) {
  const half = barHeight / 2;
  ctx.fillStyle = color;
  ctx.fillRect(x, centerY - half, barWidth - 4, barHeight);

  ctx.beginPath();
  ctx.arc(x + (barWidth - 4) / 2, centerY - half, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.3;
  ctx.fillRect(x, centerY + half + 2, barWidth - 4, half);
  ctx.globalAlpha = 1;
}

export function AudioVisualizer({
  audioRef,
  audioContextRef,
  isActive,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  const modeRef = useRef<VisualizerMode>("decorative");
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !isActive) return;

    const setup = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        const ctx = audioContextRef.current;
        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        if (!analyserRef.current) {
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 64;
        }

        if (connectedElementRef.current !== audioElement) {
          sourceRef.current = ctx.createMediaElementSource(audioElement);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
          connectedElementRef.current = audioElement;
        }

        modeRef.current = "analyser";
      } catch {
        modeRef.current = "pseudo";
      }
    };

    void setup();
  }, [audioRef, audioContextRef, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getBarHeights = (): number[] => {
      const mode = modeRef.current;
      const audio = audioRef.current;
      const analyser = analyserRef.current;

      if (mode === "analyser" && analyser && isActive) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        return Array.from({ length: BAR_COUNT }, (_, i) => {
          const value = dataArray[i] ?? 0;
          return (value / 255) * (CANVAS_HEIGHT - 16);
        });
      }

      if (mode === "pseudo" && audio && isActive && !audio.paused) {
        const t = audio.currentTime;
        return Array.from({ length: BAR_COUNT }, (_, i) => {
          const wave =
            (Math.sin(t * 8 + i * 0.5) + 1) / 2 * 0.6 +
            (Math.sin(t * 3 + i) + 1) / 2 * 0.4;
          return wave * (CANVAS_HEIGHT - 20);
        });
      }

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      return Array.from({ length: BAR_COUNT }, (_, i) => {
        const wave = (Math.sin(elapsed * 2 + i * 0.4) + 1) / 2;
        return isActive ? wave * (CANVAS_HEIGHT - 24) * 0.5 : 4;
      });
    };

    const draw = () => {
      const heights = getBarHeights();
      const centerY = CANVAS_HEIGHT / 2;
      const barWidth = CANVAS_WIDTH / (BAR_COUNT * 2);

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < BAR_COUNT; i++) {
        const height = Math.max(4, heights[i] ?? 4);
        const normalized = height / (CANVAS_HEIGHT - 16);
        const color = barColor(normalized);
        const leftX = CANVAS_WIDTH / 2 - (i + 1) * barWidth;
        const rightX = CANVAS_WIDTH / 2 + i * barWidth;
        drawBar(ctx, leftX, centerY, barWidth, height, color);
        drawBar(ctx, rightX, centerY, barWidth, height, color);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [audioRef, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full rounded-lg bg-muted/30"
      aria-hidden
    />
  );
}
