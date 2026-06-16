/**
 * news_template.png を生成する（開発用スクリプト）
 * テキスト・テロップ帯は Canvas 側で動的描画するため、背景レイアウトのみ
 * 実行: node scripts/generate-news-template.mjs
 */
import { createCanvas } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";

const W = 1280;
const H = 720;
const HEADER_HEIGHT = 96;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// メインエリア（チャコールグレー）
ctx.fillStyle = "#333333";
ctx.fillRect(0, 0, W, H);

// ヘッダー帯（サンライズオレンジ・テキストは Canvas で描画）
ctx.fillStyle = "#FF8C00";
ctx.fillRect(0, 0, W, HEADER_HEIGHT);

// 区切りライン
ctx.fillRect(0, HEADER_HEIGHT, W, 4);

const out = path.join("public", "templates", "news_template.png");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, canvas.toBuffer("image/png"));
console.log("Generated", out);
