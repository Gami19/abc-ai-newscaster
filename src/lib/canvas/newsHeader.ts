export const NEWS_HEADER_HEIGHT = 90;
export const NEWS_CANVAS_WIDTH = 1280;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatNewsHeaderDateTime(): string {
  const now = new Date();
  const weekday = WEEKDAYS[now.getDay()];
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `2035.${month}.${day}（${weekday}）18:00`;
}

/** ライブ放送と同じオレンジヘッダー（🔴 LIVE / news おかえり 2035） */
export function drawNewsHeader(ctx: CanvasRenderingContext2D) {
  const width = ctx.canvas.width;

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#FF8C00");
  gradient.addColorStop(1, "#FF6000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, NEWS_HEADER_HEIGHT);

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("ABC", 24, 36);
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("news おかえり 2035", 24, 62);

  const liveX = width / 2;
  ctx.beginPath();
  ctx.arc(liveX - 36, NEWS_HEADER_HEIGHT / 2, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#FF4500";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("LIVE", liveX - 20, NEWS_HEADER_HEIGHT / 2);

  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 4;
  ctx.fillText(formatNewsHeaderDateTime(), width - 24, NEWS_HEADER_HEIGHT / 2);
  ctx.restore();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, NEWS_HEADER_HEIGHT);
  ctx.lineTo(width, NEWS_HEADER_HEIGHT);
  ctx.stroke();
}
