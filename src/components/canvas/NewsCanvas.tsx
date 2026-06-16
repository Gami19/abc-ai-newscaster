"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import {
  getDreamTheme,
  seededRandom,
  type DreamTheme,
} from "@/lib/theme/dreamTheme";
import { renderFadeFrame, renderIntroFrame } from "@/lib/canvas/introFrame";
import { drawNewsHeader, NEWS_HEADER_HEIGHT } from "@/lib/canvas/newsHeader";
import {
  clamp,
} from "@/lib/utils/easing";
import { safePlayVideo, stopVideoElement } from "@/lib/audio/safePlay";
import type {
  DrawFrameCallback,
  DreamCategory,
  NewsCanvasMode,
} from "@/types";
import type { MutableRefObject } from "react";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const TELOP_HEIGHT = 140;
const TELOP_Y = CANVAS_HEIGHT - TELOP_HEIGHT;
const MAIN_CONTENT_MARGIN = 16;
const MAIN_BOTTOM = TELOP_Y - MAIN_CONTENT_MARGIN;

const NAME_PLATE_X = 80;
const NAME_PLATE_W = 320;
const NAME_PLATE_H = 80;

const PHOTO_SIZE = 320;
const PHOTO_X = 80;
const PHOTO_Y = 160;
const NAME_PLATE_Y = PHOTO_Y + PHOTO_SIZE + 16;
const PHOTO_RADIUS = 28;

const TELOP_MARGIN = 0;
const INTRO_NEWS_ICON_SRC = "/intro/news-icon.png";

export interface NewsCanvasProps {
  scriptText: string;
  userName: string;
  dreamCategory: DreamCategory;
  dreamText?: string;
  mode?: NewsCanvasMode;
  photoBase64?: string;
  videoStream?: MediaStream | null;
  enablePreviewLoop?: boolean;
  onReady?: (blob: Blob) => void;
  canvasModeRef?: MutableRefObject<NewsCanvasMode>;
  introStartTimeRef?: MutableRefObject<number | null>;
  fadeStartTimeRef?: MutableRefObject<number | null>;
  newsIconImageRef?: MutableRefObject<HTMLImageElement | null>;
  onNewsIconReady?: () => void;
}

export type NewsCanvasHandle = {
  getCanvas: () => HTMLCanvasElement | null;
  getDrawFrameCallback: () => DrawFrameCallback | null;
};

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

type TelopLayout = {
  lines: string[];
  fontSize: number;
  lineHeight: number;
};

function fitTelopLayout(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): TelopLayout {
  const configs: TelopLayout[] = [
    { lines: [], fontSize: 32, lineHeight: 38 },
    { lines: [], fontSize: 28, lineHeight: 34 },
    { lines: [], fontSize: 24, lineHeight: 30 },
    { lines: [], fontSize: 22, lineHeight: 26 },
  ];

  for (const cfg of configs) {
    ctx.font = `${cfg.fontSize}px sans-serif`;
    const lines = wrapText(ctx, text, maxWidth);
    const maxLines = cfg.fontSize >= 28 ? 4 : 5;
    if (lines.length <= maxLines) {
      return { ...cfg, lines };
    }
  }

  ctx.font = "22px sans-serif";
  let lines = wrapText(ctx, text, maxWidth);
  if (lines.length > 5) {
    lines = lines.slice(0, 5);
    let lastLine = lines[4] ?? "";
    while (
      lastLine.length > 0 &&
      ctx.measureText(`${lastLine}…`).width > maxWidth
    ) {
      lastLine = lastLine.slice(0, -1);
    }
    lines[4] = `${lastLine}…`;
  }

  return { lines, fontSize: 22, lineHeight: 26 };
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  mirror = false
) {
  const width =
    source instanceof HTMLVideoElement
      ? source.videoWidth
      : source instanceof HTMLImageElement
        ? source.width
        : dw;
  const height =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source instanceof HTMLImageElement
        ? source.height
        : dh;

  if (!width || !height) return;

  const srcAspect = width / height;
  const dstAspect = dw / dh;

  let sx = 0;
  let sy = 0;
  let sw = width;
  let sh = height;

  if (srcAspect > dstAspect) {
    sw = height * dstAspect;
    sx = (width - sw) / 2;
  } else {
    sh = width / dstAspect;
    sy = (height - sh) / 2;
  }

  if (mirror) {
    ctx.save();
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, dw, dh);
    ctx.restore();
    return;
  }

  ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawBackground(ctx: CanvasRenderingContext2D, bgTint: string) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#1a2942");
  gradient.addColorStop(0.5, "#2d3e5f");
  gradient.addColorStop(1, "#1a2942");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = bgTint;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const spotlight = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    120,
    0,
    CANVAS_WIDTH / 2,
    120,
    600
  );
  spotlight.addColorStop(0, "rgba(255, 200, 120, 0.25)");
  spotlight.addColorStop(1, "rgba(255, 200, 120, 0)");
  ctx.fillStyle = spotlight;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (let y = 0; y < CANVAS_HEIGHT; y += 24) {
    for (let x = 0; x < CANVAS_WIDTH; x += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawDreamDecorations(
  ctx: CanvasRenderingContext2D,
  theme: DreamTheme,
  seed: string
) {
  const centerX = 960;
  const centerY = 350;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * 500,
      centerY + Math.sin(angle) * 500
    );
    ctx.stroke();
  }
  ctx.restore();

  const rand = seededRandom(seed);
  const subIconXMin = 420;
  const subIconXMax = 1180;
  const subIconYMin = NEWS_HEADER_HEIGHT + 8;
  const subIconYMax = MAIN_BOTTOM - 8;
  ctx.font = "60px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < theme.subIcons.length; i++) {
    const icon = theme.subIcons[i] ?? "✨";
    const x = subIconXMin + rand() * (subIconXMax - subIconXMin);
    const y = subIconYMin + rand() * (subIconYMax - subIconYMin);
    ctx.globalAlpha = 0.55;
    ctx.fillText(icon, x, y);
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.font = "180px serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#FF8C00";
  ctx.fillText(theme.mainIcon, 820, 380);
  ctx.restore();
}

function drawFaceFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  mirror = false
) {
  ctx.save();
  ctx.shadowColor = "#FF8C00";
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.roundRect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, PHOTO_RADIUS);
  ctx.fillStyle = "#FF8C00";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, PHOTO_RADIUS);
  ctx.clip();
  drawImageCover(ctx, source, PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, mirror);
  ctx.restore();

  ctx.strokeStyle = "#FF8C00";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, PHOTO_RADIUS);
  ctx.stroke();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(
    PHOTO_X + 5,
    PHOTO_Y + 5,
    PHOTO_SIZE - 10,
    PHOTO_SIZE - 10,
    PHOTO_RADIUS - 2
  );
  ctx.stroke();

  ctx.fillStyle = "#FF4500";
  ctx.beginPath();
  ctx.roundRect(PHOTO_X + 12, PHOTO_Y + 12, 72, 28, 6);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LIVE", PHOTO_X + 48, PHOTO_Y + 26);
}

function drawNamePlate(
  ctx: CanvasRenderingContext2D,
  userName: string,
  accentColor: string
) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  const gradient = ctx.createLinearGradient(
    NAME_PLATE_X,
    NAME_PLATE_Y,
    NAME_PLATE_X + NAME_PLATE_W,
    NAME_PLATE_Y
  );
  gradient.addColorStop(0, accentColor);
  gradient.addColorStop(1, "#FF6000");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(NAME_PLATE_X, NAME_PLATE_Y, NAME_PLATE_W, NAME_PLATE_H, 20);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = "24px sans-serif";
  ctx.fillText(
    "⭐ キャスター",
    NAME_PLATE_X + NAME_PLATE_W / 2,
    NAME_PLATE_Y + 28
  );
  ctx.font = "bold 44px sans-serif";
  ctx.fillText(
    userName,
    NAME_PLATE_X + NAME_PLATE_W / 2,
    NAME_PLATE_Y + 62
  );
}

function drawTelop(
  ctx: CanvasRenderingContext2D,
  scriptText: string,
  accentColor: string
) {
  const gradient = ctx.createLinearGradient(0, TELOP_Y, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, accentColor);
  gradient.addColorStop(1, "#E07000");
  ctx.fillStyle = gradient;
  ctx.fillRect(TELOP_MARGIN, TELOP_Y, CANVAS_WIDTH, TELOP_HEIGHT);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, TELOP_Y);
  ctx.lineTo(CANVAS_WIDTH, TELOP_Y);
  ctx.stroke();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, TELOP_Y + 2);
  ctx.lineTo(CANVAS_WIDTH, TELOP_Y + 2);
  ctx.stroke();

  const boxW = 90;
  const boxH = 48;
  const boxX = 24;
  const boxY = TELOP_Y + 24;
  ctx.fillStyle = "#FF4500";
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("速報", boxX + boxW / 2, boxY + boxH / 2);

  const textX = boxX + boxW + 20;
  const textMaxWidth = CANVAS_WIDTH - textX - 24;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#FFFFFF";

  const { lines, fontSize, lineHeight } = fitTelopLayout(
    ctx,
    scriptText,
    textMaxWidth
  );
  ctx.font = `${fontSize}px sans-serif`;
  const textStartY = TELOP_Y + 28;
  lines.forEach((line, index) => {
    ctx.fillText(line, textX, textStartY + index * lineHeight);
  });
}

function drawTelopPreview(
  ctx: CanvasRenderingContext2D,
  scriptText: string,
  accentColor: string
) {
  const preview = scriptText.slice(0, 20);
  drawTelop(
    ctx,
    preview.length < scriptText.length ? `${preview}…` : preview,
    accentColor
  );
}

function renderLiveFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  theme: DreamTheme,
  seed: string,
  userName: string,
  scriptText: string
) {
  ctx.canvas.width = CANVAS_WIDTH;
  ctx.canvas.height = CANVAS_HEIGHT;
  drawBackground(ctx, theme.bgTint);
  drawDreamDecorations(ctx, theme, seed);
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    drawFaceFrame(ctx, video, true);
  }
  drawNamePlate(ctx, userName, theme.accentColor);
  drawNewsHeader(ctx);
  drawTelopPreview(ctx, scriptText, theme.accentColor);
}

async function composeStaticCanvas(
  canvas: HTMLCanvasElement,
  photoBase64: string,
  scriptText: string,
  userName: string,
  dreamCategory: DreamCategory,
  dreamText: string
): Promise<Blob> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context を取得できません");

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const theme = getDreamTheme(dreamCategory, dreamText);
  const photo = await loadImage(photoBase64);

  drawBackground(ctx, theme.bgTint);
  drawDreamDecorations(ctx, theme, `${dreamCategory}-${userName}`);
  drawFaceFrame(ctx, photo);
  drawNamePlate(ctx, userName, theme.accentColor);
  drawNewsHeader(ctx);
  drawTelop(ctx, scriptText, theme.accentColor);

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
  function NewsCanvas(
    {
      scriptText,
      userName,
      dreamCategory,
      dreamText,
      mode = "static",
      photoBase64,
      videoStream,
      enablePreviewLoop = true,
      onReady,
      canvasModeRef,
      introStartTimeRef,
      fadeStartTimeRef,
      newsIconImageRef,
      onNewsIconReady,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement | null>(null);
    const previewRafRef = useRef<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const theme = getDreamTheme(dreamCategory, dreamText ?? "");
    const seed = `${dreamCategory}-${userName}`;

    const getDrawFrameCallback = useCallback((): DrawFrameCallback | null => {
      return (ctx, video) => {
        const drawMode = canvasModeRef?.current ?? "live";

        if (
          drawMode === "intro" &&
          introStartTimeRef?.current != null
        ) {
          const elapsed =
            (performance.now() - introStartTimeRef.current) / 1000;
          renderIntroFrame(
            ctx,
            elapsed,
            userName,
            newsIconImageRef?.current ?? null
          );
          return;
        }

        if (drawMode === "fade" && fadeStartTimeRef?.current != null) {
          const progress = clamp(
            (performance.now() - fadeStartTimeRef.current) / 500,
            0,
            1
          );
          renderFadeFrame(ctx, progress, () => {
            renderLiveFrame(ctx, video, theme, seed, userName, scriptText);
          });
          return;
        }

        renderLiveFrame(ctx, video, theme, seed, userName, scriptText);
      };
    }, [
      canvasModeRef,
      fadeStartTimeRef,
      introStartTimeRef,
      newsIconImageRef,
      scriptText,
      seed,
      theme,
      userName,
    ]);

    useEffect(() => {
      if (onNewsIconReady && newsIconImageRef?.current) {
        onNewsIconReady();
        return;
      }

      const image = new Image();
      image.onload = () => {
        if (newsIconImageRef) {
          newsIconImageRef.current = image;
        }
        onNewsIconReady?.();
      };
      image.onerror = () => {
        console.error("[NewsCanvas] news-icon load failed");
      };
      image.src = INTRO_NEWS_ICON_SRC;

      return () => {
        image.onload = null;
        image.onerror = null;
      };
    }, [newsIconImageRef, onNewsIconReady]);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getDrawFrameCallback,
    }));

    useEffect(() => {
      if (mode !== "static" || !photoBase64) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      let cancelled = false;

      const run = async () => {
        try {
          const blob = await composeStaticCanvas(
            canvas,
            photoBase64,
            scriptText,
            userName,
            dreamCategory,
            dreamText ?? ""
          );
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
    }, [
      mode,
      photoBase64,
      scriptText,
      userName,
      dreamCategory,
      dreamText,
      onReady,
    ]);

    useEffect(() => {
      if (mode !== "live" || !videoStream || !enablePreviewLoop) return;

      const video = document.createElement("video");
      video.srcObject = videoStream;
      video.muted = true;
      video.playsInline = true;
      previewVideoRef.current = video;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      const loop = () => {
        if (ctx && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          renderLiveFrame(ctx, video, theme, seed, userName, scriptText);
        }
        previewRafRef.current = requestAnimationFrame(loop);
      };

      void safePlayVideo(video).then(() => {
        previewRafRef.current = requestAnimationFrame(loop);
      });

      return () => {
        if (previewRafRef.current !== null) {
          cancelAnimationFrame(previewRafRef.current);
        }
        stopVideoElement(video);
        previewVideoRef.current = null;
      };
    }, [mode, videoStream, enablePreviewLoop, theme, seed, userName, scriptText]);

    if (error) {
      return <p className="text-center text-sm text-abc-red">{error}</p>;
    }

    if (mode === "static" && !photoBase64) {
      return (
        <p className="text-center text-sm text-abc-red">
          写真の準備ができていません
        </p>
      );
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
