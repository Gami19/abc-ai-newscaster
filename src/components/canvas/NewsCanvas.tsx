"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const PHOTO_SIZE = 240;
const PHOTO_X = CANVAS_WIDTH - PHOTO_SIZE - 48;
const PHOTO_Y = 48;
const PHOTO_RADIUS = 16;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

type NewsCanvasProps = {
  photoBase64: string;
  scriptText: string;
  onReady?: (blob: Blob) => void;
};

export type NewsCanvasHandle = {
  getCanvas: () => HTMLCanvasElement | null;
};

function formatNewsDate(): string {
  const now = new Date();
  const weekday = WEEKDAYS[now.getDay()];
  return `2035年 ${now.getMonth() + 1}月 ${now.getDate()}日（${weekday}）`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    image.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let current = "";

  for (const char of text) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();

  ctx.strokeStyle = "#ff8c00";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.stroke();
}

async function composeNewsCanvas(
  canvas: HTMLCanvasElement,
  photoBase64: string,
  scriptText: string
): Promise<Blob> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context を取得できません");

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const [template, photo] = await Promise.all([
    loadImage("/templates/news_template.png"),
    loadImage(photoBase64),
  ]);

  ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawRoundedImage(ctx, photo, PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, PHOTO_RADIUS);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("ABC NEWS 2035", 48, 56);

  ctx.font = "bold 22px sans-serif";
  ctx.fillText(formatNewsDate(), 48, 96);

  const telopX = 48;
  const telopY = CANVAS_HEIGHT - 200;
  const telopWidth = CANVAS_WIDTH - 96;
  const telopHeight = 140;

  ctx.fillStyle = "rgba(51, 51, 51, 0.85)";
  ctx.fillRect(telopX, telopY, telopWidth, telopHeight);

  ctx.fillStyle = "#ffffff";
  ctx.font = "24px sans-serif";
  const lines = wrapText(ctx, scriptText, telopWidth - 32);
  lines.slice(0, 4).forEach((line, index) => {
    ctx.fillText(line, telopX + 16, telopY + 36 + index * 32);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas の合成に失敗しました"));
      },
      "image/jpeg",
      0.92
    );
  });
}

export const NewsCanvas = forwardRef<NewsCanvasHandle, NewsCanvasProps>(
  function NewsCanvas({ photoBase64, scriptText, onReady }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let cancelled = false;

      const run = async () => {
        try {
          const blob = await composeNewsCanvas(canvas, photoBase64, scriptText);
          if (!cancelled) {
            onReady?.(blob);
          }
        } catch (err) {
          if (!cancelled) {
            console.error("[NewsCanvas]", err);
            setError("ニュース画像の合成に失敗しました");
          }
        }
      };

      void run();

      return () => {
        cancelled = true;
      };
    }, [photoBase64, scriptText, onReady]);

    if (error) {
      return <p className="text-center text-sm text-abc-red">{error}</p>;
    }

    return (
      <canvas
        ref={canvasRef}
        className="aspect-video w-full max-w-full rounded-lg border border-border shadow-sm"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
    );
  }
);
