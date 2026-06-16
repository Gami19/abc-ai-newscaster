import {
  clamp,
  easeOutBounce,
  easeOutCubic,
} from "@/lib/utils/easing";
import { drawNewsHeader } from "@/lib/canvas/newsHeader";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

/** 録画開始直後に Canvas アニメを止めておく秒数 */
export const INTRO_ANIMATION_HOLD_SEC = 1.0;

function drawIntroBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#1a2942");
  gradient.addColorStop(0.5, "#2d3e5f");
  gradient.addColorStop(1, "#1a2942");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawIntroSpotlight(ctx: CanvasRenderingContext2D, elapsed: number) {
  if (elapsed <= 0.3) return;

  const opacity = Math.min(1, (elapsed - 0.3) / 0.5);
  const spotlight = ctx.createRadialGradient(640, 200, 50, 640, 200, 600);
  spotlight.addColorStop(0, `rgba(255, 200, 120, ${0.25 * opacity})`);
  spotlight.addColorStop(1, "rgba(255, 200, 120, 0)");
  ctx.fillStyle = spotlight;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawRotatingRays(ctx: CanvasRenderingContext2D, elapsed: number) {
  if (elapsed < 4.0) return;

  const rotationDeg = (elapsed - 4.0) * 5;
  const rotationRad = (rotationDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(640, 360);
  ctx.rotate(rotationRad);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * 500, Math.sin(angle) * 500);
    ctx.stroke();
  }

  ctx.restore();
}

function drawNewsIcon(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  newsIconImage: HTMLImageElement | null
) {
  if (!newsIconImage || elapsed < 0.5) return;

  let scale = 1;
  let alpha = 1;

  if (elapsed < 1.0) {
    scale = easeOutBounce((elapsed - 0.5) / 0.5);
  } else if (elapsed >= 7.5) {
    alpha = 1.0 - (elapsed - 7.5) / 0.5;
  }

  const size = 300 * scale;
  const cx = 640;
  const cy = 280;

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.shadowColor = "#FF8C00";
  ctx.shadowBlur = 30 * scale;
  ctx.drawImage(newsIconImage, cx - size / 2, cy - size / 2, size, size);
  ctx.restore();
}

function drawSlideText(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  start: number,
  duration: number,
  fadeOutStart: number,
  fadeOutEnd: number,
  draw: (alpha: number) => void
) {
  if (elapsed < start) return;

  let alpha = 1;
  if (elapsed >= fadeOutStart) {
    alpha = 1.0 - (elapsed - fadeOutStart) / (fadeOutEnd - fadeOutStart);
  }

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  draw(clamp(alpha, 0, 1));
  ctx.restore();
}

export function renderIntroFrame(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  userName: string,
  newsIconImage: HTMLImageElement | null
) {
  ctx.canvas.width = CANVAS_WIDTH;
  ctx.canvas.height = CANVAS_HEIGHT;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawIntroBackground(ctx);
  drawNewsHeader(ctx);

  const animElapsed = Math.max(0, elapsed - INTRO_ANIMATION_HOLD_SEC);

  drawIntroSpotlight(ctx, animElapsed);
  drawRotatingRays(ctx, animElapsed);
  drawNewsIcon(ctx, animElapsed, newsIconImage);

  drawSlideText(ctx, animElapsed, 2.0, 0.5, 7.5, 8.0, () => {
    const progress = easeOutCubic(clamp((animElapsed - 2.0) / 0.5, 0, 1));
    const x = -300 + 300 * progress;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 52px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("news おかえり", x + 300, 480);
  });

  drawSlideText(ctx, animElapsed, 2.2, 0.5, 7.5, 8.0, () => {
    const progress = easeOutCubic(clamp((animElapsed - 2.2) / 0.5, 0, 1));
    const x = 1280 - (1280 - 750) * progress;
    ctx.fillStyle = "#FF8C00";
    ctx.font = "bold 80px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("2035", x, 500);
  });

  drawSlideText(ctx, animElapsed, 4.0, 0.5, 7.5, 8.0, () => {
    const progress = easeOutCubic(clamp((animElapsed - 4.0) / 0.5, 0, 1));
    const y = 560 + 20 * (1 - progress);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ABC", 640, y);
  });

  if (elapsed >= 6.0) {
    let bandAlpha = 1;
    if (elapsed >= 7.5) {
      bandAlpha = 1.0 - (elapsed - 7.5) / 0.3;
    }

    const slideProgress =
      elapsed < 6.5
        ? easeOutCubic(clamp((elapsed - 6.0) / 0.5, 0, 1))
        : 1;
    const bandX = -1280 + 1280 * slideProgress;

    ctx.save();
    ctx.globalAlpha = clamp(bandAlpha, 0, 1);

    const bandY = 620;
    const bandH = 80;
    const gradient = ctx.createLinearGradient(bandX, bandY, bandX + 1280, bandY);
    gradient.addColorStop(0, "#FF8C00");
    gradient.addColorStop(1, "#FF6000");
    ctx.fillStyle = gradient;
    ctx.fillRect(bandX, bandY, 1280, bandH);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `本日のキャスター：${userName}`,
      bandX + 20,
      bandY + bandH / 2
    );
    ctx.restore();
  }

  if (elapsed >= 7.5) {
    const blackAlpha = clamp((elapsed - 7.5) / 0.5, 0, 1);
    ctx.fillStyle = `rgba(0, 0, 0, ${blackAlpha})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}

export function renderFadeFrame(
  ctx: CanvasRenderingContext2D,
  progress: number,
  renderLive: () => void
) {
  ctx.canvas.width = CANVAS_WIDTH;
  ctx.canvas.height = CANVAS_HEIGHT;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.globalAlpha = clamp(progress, 0, 1);
  renderLive();
  ctx.restore();
}

export const INTRO_CANVAS_WIDTH = CANVAS_WIDTH;
export const INTRO_CANVAS_HEIGHT = CANVAS_HEIGHT;
