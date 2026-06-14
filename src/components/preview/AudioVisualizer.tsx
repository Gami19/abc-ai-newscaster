"use client";

import { useEffect, useRef } from "react";

type AudioVisualizerProps = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isActive: boolean;
};

const BAR_COUNT = 32;

export function AudioVisualizer({ audioRef, isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !isActive) return;

    const setup = async () => {
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
    };

    void setup();
  }, [audioRef, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawFlat = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ff8c00";
      const barWidth = width / BAR_COUNT;
      const flatHeight = 4;
      for (let i = 0; i < BAR_COUNT; i++) {
        ctx.fillRect(
          i * barWidth + 2,
          height / 2 - flatHeight / 2,
          barWidth - 4,
          flatHeight
        );
      }
    };

    const draw = () => {
      const analyser = analyserRef.current;
      if (!analyser || !isActive) {
        drawFlat();
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / BAR_COUNT;
      for (let i = 0; i < BAR_COUNT; i++) {
        const value = dataArray[i] ?? 0;
        const barHeight = (value / 255) * (height - 8);
        ctx.fillStyle = "#ff8c00";
        ctx.fillRect(
          i * barWidth + 2,
          height - barHeight,
          barWidth - 4,
          barHeight
        );
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={64}
      className="w-full rounded-lg bg-muted/30"
      aria-hidden
    />
  );
}
