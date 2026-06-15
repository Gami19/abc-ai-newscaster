# 🎙 ABC AI Newscaster

> 「10年後の未来を、きみがニュースで伝える」  
> AI × 朝日放送テレビの技術で、小学生が未来のニュースキャスターになれる体験アプリ

---

## 💻 体験方法

**ローカル PC で `npm run dev` を起動し、Chrome で体験します。**

> Chrome 最新版 + カメラ付き PC 推奨  
> 公開デプロイ（Vercel 等）は行いません。イベント会場では各ブース PC でローカル起動します。

**動作確認について**

- 体験フロー全体（特に STEP 4 の放送演出・Web Audio 波形ビジュアライザー）は **Google Chrome** での検証を推奨します
- Safari では Web Audio API の制約により波形表示が不安定になる場合があります

---

## 📖 概要

朝日放送テレビ夏イベント向けの技術施策プロトタイプ。

小学生が名前・学年・夢・好きなことを入力するだけで、
AI が「2035年の未来ニュース原稿」を生成し、
本物のニューステンプレートに顔写真を合成した動画を
この PC にダウンロードして持ち帰れる体験アプリ。

```
入力（30秒）
  → 撮影（20秒）
  → AI生成（15秒）
  → プレビュー・音声読み上げ（40秒）
  → この PC で動画をダウンロード（20秒）

合計 約2分15秒 / 1人
5台並列運用で 約260人 / 時間 をさばける設計
```

---

## ✨ 機能

| 機能 | 説明 |
|------|------|
| 入力フォーム | 名前・学年（小1〜小6）・夢・好きなことをタッチ操作で入力 |
| カメラ撮影 | Webカメラで顔写真を撮影・ニュース風フレームで構図を誘導 |
| AI原稿生成 | GPT-4o が 2035年の未来ニュース原稿を150字で生成 |
| マルチプロバイダー | OpenAI / Azure OpenAI / Amazon Bedrock を環境変数で切り替え |
| 音声合成 | OpenAI TTS（Azure OpenAI TTS も切替可）による自然な日本語読み上げ |
| Canvas合成 | ニューステンプレート + 顔写真 + テロップをブラウザ内で合成 |
| 動画生成 | ffmpeg.wasm でブラウザ内 mp4 生成（顔写真がサーバーに送信されない） |
| 動画保存 | 同 PC へブラウザから直接ダウンロード |

---

## 🛠 技術スタック

| レイヤー | 技術 | 採用理由 |
|---------|------|---------|
| フレームワーク | Next.js 16 (App Router / TypeScript) | ローカル開発と API Routes を1リポジトリで完結 |
| UI | shadcn/ui + TailwindCSS | 高品質コンポーネント・ABCカラーへのカスタマイズ容易性 |
| アニメーション | Framer Motion | ページ遷移・カウントダウン・紙吹雪演出 |
| 状態管理 | Zustand | 5画面をまたぐ大きなデータ（Blob）を再レンダリングなしで管理 |
| テキスト生成 | OpenAI GPT-4o | 日本語品質・system prompt による安全制御 |
| 音声合成 | OpenAI TTS | 本番設計と同一・プロバイダー切替で Azure も検証可能 |
| 動画生成 | ffmpeg.wasm | ブラウザ内完結・顔写真のサーバー送信ゼロ（プライバシー優先） |
| 実行環境 | ローカル PC（`npm run dev`） | 会場ブースごとに独立起動・公開ホスティング不要 |

---

## 🏗 アーキテクチャ

### プロトタイプ構成

```
ブラウザ（Next.js SPA）
├── Canvas API         顔写真合成（サーバー送信なし）
├── ffmpeg.wasm        動画生成（ブラウザ内完結）
└── Zustand            セッション状態管理
        │
        │ localhost
        ▼
Next.js API Routes（同一 PC 上の開発サーバー）
├── POST /api/generate     GPT-4o → 未来ニュース原稿
└── POST /api/tts          OpenAI TTS → 音声 mp3
        │
        ▼
結果画面（/result）
└── 動画ファイル（mp4/webm）をこの PC にダウンロード
```

### 本番構成（移行計画）

```
ブラウザ（Next.js SPA）        ← 変更なし
        │
        ▼
AWS API Gateway
└── Lambda（FastAPI on Docker）
      ├── /api/generate     GPT-4o / Azure OpenAI / Bedrock
      ├── /api/tts          OpenAI TTS
      └── /api/video        ffmpeg（サーバーサイド）→ S3
              │
              ▼
        AWS S3（7日自動削除）
        └── CloudFront（エッジ配信）
              → 署名付きURL → QRコード
```

> プロトタイプと本番でコアロジックは共通。  
> 変わるのはインフラ層のみ。詳細は [`docs/prototype-to-production.md`](./docs/prototype-to-production.md) を参照。

---

## 📁 ディレクトリ構成

```
abc-ai-newscaster/
├── src/
│   ├── app/
│   │   ├── page.tsx                   # STEP 1: 入力フォーム
│   │   ├── camera/page.tsx            # STEP 2: カメラ撮影
│   │   ├── generating/page.tsx        # STEP 3: AI生成待機
│   │   ├── preview/page.tsx           # STEP 4: プレビュー・音声再生
│   │   ├── result/page.tsx            # STEP 5: 動画ダウンロード
│   │   └── api/
│   │       ├── generate/route.ts      # 原稿生成API
│   │       └── tts/route.ts           # 音声合成API
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui 自動生成
│   │   ├── layout/
│   │   │   ├── ABCLogo.tsx            # ヘッダーロゴ
│   │   │   └── StepIndicator.tsx      # ステップ進捗バー
│   │   ├── form/
│   │   │   ├── InputForm.tsx          # 入力フォーム本体
│   │   │   └── GradeSelector.tsx      # 学年ボタン選択
│   │   ├── camera/
│   │   │   ├── CameraView.tsx         # Webカメラプレビュー
│   │   │   └── CountdownOverlay.tsx   # カウントダウン演出
│   │   ├── canvas/
│   │   │   └── NewsCanvas.tsx         # テンプレ合成
│   │   └── effects/
│   │       └── Confetti.tsx           # 紙吹雪アニメーション
│   │
│   ├── lib/
│   │   ├── store/
│   │   │   └── useSessionStore.ts     # Zustand ストア
│   │   ├── ai/
│   │   │   ├── index.ts               # プロバイダー振り分け
│   │   │   ├── openai.ts              # OpenAI 実装
│   │   │   ├── azure.ts               # Azure OpenAI（スタブ）
│   │   │   └── bedrock.ts             # Amazon Bedrock（スタブ）
│   │   ├── tts/
│   │   │   ├── index.ts               # プロバイダー振り分け
│   │   │   ├── openai.ts              # OpenAI TTS
│   │   │   ├── azure.ts               # Azure OpenAI TTS
│   │   │   └── mock.ts                # デモ用固定音声
│   │   ├── video/
│   │   │   ├── index.ts               # 方針振り分け
│   │   │   ├── ffmpegVideo.ts         # 方針A: ffmpeg.wasm
│   │   │   ├── mediaRecorder.ts       # 方針B: MediaRecorder
│   │   │   └── fallback.ts            # 方針C: PNG+WAV別DL
│   │   └── prompts/
│   │       └── newsScript.ts          # プロンプト定義
│   │
│   └── types/
│       └── index.ts                   # 共通型定義
│
├── public/
│   └── templates/
│       └── news_template.png          # ニューステンプレート画像
│
├── docs/
│   └── prototype-to-production.md    # 本番移行計画
│
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 🚀 ローカルセットアップ

### 必要なもの

- Node.js 20以上
- カメラ付き PC（Webカメラ）
- OpenAI API Key（デモモード時は不要）

### 手順

```bash
# 1. クローン
git clone https://github.com/your-name/abc-ai-newscaster.git
cd abc-ai-newscaster

# 2. パッケージインストール
npm install

# 3. 環境変数を設定
cp .env.local.example .env.local
# .env.local を編集（下記参照）

# 4. 開発サーバー起動
npm run dev

# 5. ブラウザでアクセス
open http://localhost:3000
```

### 環境変数

```bash
# .env.local

# ─── AI プロバイダー選択 ───────────────────────────
# openai | azure | bedrock
AI_PROVIDER=openai

# ─── OpenAI ──────────────────────────────────────
OPENAI_API_KEY=sk-...

# ─── Azure OpenAI（AI_PROVIDER=azure の場合）──────
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT_NAME=

# ─── Amazon Bedrock（AI_PROVIDER=bedrock の場合）──
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# ─── TTS プロバイダー選択 ─────────────────────────
# openai | azure
TTS_PROVIDER=openai
OPENAI_TTS_MODEL=tts-1
OPENAI_TTS_VOICE=nova
OPENAI_TTS_SPEED=0.95

# ─── 動画生成方針 ─────────────────────────────────
# ffmpeg | mediarecorder | fallback
VIDEO_MODE=ffmpeg

# ─── デモ用 MOCK（APIキー不要）────────────────────
DEMO_MOCK_SCRIPT=true
DEMO_MOCK_TTS=true
DEMO_MOCK_DELAY_MS=1500
DEMO_MOCK_TTS_AUDIO_PATH=public/sounds/demo-tts.wav
```

### デモモード（APIキー不要）

イベント会場や審査デモで API キーなしで体験フローを通す場合、`.env.local` に以下を設定します。

```bash
DEMO_MOCK_SCRIPT=true   # 原稿生成を buildDefaultScript に差し替え
DEMO_MOCK_TTS=true      # TTS を固定サンプル音声に差し替え
```

| 項目 | 挙動 |
|------|------|
| カメラ撮影 | **実機のまま**（MOCK 対象外） |
| 原稿生成 | 入力名・夢・好きなことを反映したデフォルト原稿 |
| TTS | `public/sounds/demo-tts.wav`（固定サンプル） |
| 個別切替 | `DEMO_MOCK_SCRIPT` / `DEMO_MOCK_TTS` をそれぞれ `true` / `false` で制御 |

**注意**

- TTS MOCK は固定サンプルのため、画面上の原稿テキストと読み上げ内容・長さは一致しません。カラオケは音声の長さに按分して動きます。
- プレースホルダー音声の生成: `node scripts/generate-demo-tts-placeholder.mjs`
- 本番デモ用には、OpenAI TTS 等で録音したニュース風サンプル（約20〜30秒）を `demo-tts.wav` または `demo-tts.mp3` に差し替え、`DEMO_MOCK_TTS_AUDIO_PATH` でパスを指定できます。

### API Key の取得先

| サービス | 取得先 |
|---------|--------|
| OpenAI | [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Azure OpenAI | Azure Portal → Azure OpenAI |
| Amazon Bedrock | AWS Console → Bedrock → Model access |

---

## 🎨 デザインシステム

朝日放送テレビのブランドカラーに準拠。

| 名称 | カラーコード | 用途 |
|------|------------|------|
| サンライズオレンジ | `#FF8C00` | ロゴ・primary・フォーカスリング |
| チャコールグレー | `#333333` | 見出し・本文テキスト |
| ミディアムグレー | `#666666` | 補足テキスト・ボーダー |
| ピュアホワイト | `#FFFFFF` | ページ背景・カード |
| ビビッドレッド | `#FF4500` | CTAボタン・アクセント |

---

## 🔌 API リファレンス

### `POST /api/generate`

未来ニュース原稿を生成する。

**Request**
```json
{
  "name": "ゆうた",
  "grade": "小学3年生",
  "dream": "サッカー選手",
  "hobby": "ゲーム・ラーメン"
}
```

**Response 200**
```json
{
  "script": "こんばんは。キャスターのゆうたです。..."
}
```

**Response 400 / 500**
```json
{
  "error": "入力値が不正です",
  "code": "INVALID_INPUT",
  "retryable": false
}
```

---

### `POST /api/tts`

原稿テキストを音声合成する。

**Request**
```json
{
  "text": "こんばんは。キャスターのゆうたです。..."
}
```

**Response 200**
```
Content-Type: audio/mpeg
（音声バイナリ）
```

---

## 🧠 設計上のこだわり

### プライバシーファースト

顔写真の合成処理を Canvas API でブラウザ内に閉じることで、
**顔写真がサーバーに送信されない**設計にした。
個人情報（顔データ）の外部送信リスクをゼロにしつつ、
サーバーラウンドトリップ分のレイテンシも削減できる。

### AI失敗体験ゼロ

API生成に失敗した場合、エラー画面ではなく
**デフォルト原稿で自動的に体験を続行する**フォールバックを実装した。
小学生向けイベントで「失敗して終わり」という体験を作らないための設計判断。

### 動画生成の3段階フォールバック

```
方針A: ffmpeg.wasm（mp4・最優先）
  ↓ SharedArrayBuffer 問題が解決できない場合
方針B: MediaRecorder API（webm）
  ↓ それも不可の場合
方針C: PNG + WAV 別々にダウンロード
```

環境変数 `VIDEO_MODE` で切り替えられる設計にすることで、
会場の端末環境に合わせて即座に対応できる。

### マルチプロバイダーの差し替えコスト最小化

テキスト生成・音声合成・動画生成をそれぞれ独立したレイヤーに分離した。
`AI_PROVIDER` 環境変数を変えるだけで
OpenAI / Azure OpenAI / Amazon Bedrock を切り替えられる。

> Azure・Bedrock は現在スタブ実装。  
> インターフェースが統一されているため、APIキーを設定するだけで有効化できる。

---

## 📊 プロトタイプ → 本番 移行計画

| 変更点 | プロトタイプ | 本番 | 移行コスト |
|--------|------------|------|-----------|
| バックエンド | Next.js API Routes（ローカル） | FastAPI + AWS Lambda | 低（URLの差し替えのみ） |
| 音声合成 | OpenAI TTS | OpenAI TTS | なし |
| 動画生成 | ffmpeg.wasm（ブラウザ） | ffmpeg（Lambda） | 低（コマンド引数は同一） |
| 動画配信 | ブラウザ直接 DL | S3 + CloudFront + QR | 中（インフラ設定が必要） |

詳細は [`docs/prototype-to-production.md`](./docs/prototype-to-production.md) を参照。

---

## ⚠️ 既知の制限事項

- **Safari での動画再生**  
  `VIDEO_MODE=ffmpeg` の場合は mp4 で全デバイス対応。  
  `VIDEO_MODE=mediarecorder` の場合は webm のため Safari では再生できない場合がある。  
  → `VIDEO_MODE=fallback` に切り替えることで回避可能。

- **ffmpeg.wasm の COOP/COEP ヘッダー**  
  `VIDEO_MODE=ffmpeg` を使用する場合、SharedArrayBuffer のために  
  `Cross-Origin-Opener-Policy: same-origin` と  
  `Cross-Origin-Embedder-Policy: require-corp` が必要。  
  `next.config.ts` に設定済みだが、外部フォント等のリソースに影響する場合がある。

- **Azure OpenAI / Amazon Bedrock はスタブ実装**  
  現在 `AI_PROVIDER=openai` のみ動作確認済み。  
  Azure・Bedrock はインターフェースのみ実装しており、APIキー設定で有効化できる設計になっている。

- **カメラ使用には HTTPS 環境が必要**  
  `localhost` は HTTP でも動作する。

---

## 📄 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [`docs/prototype-to-production.md`](./docs/prototype-to-production.md) | プロトタイプ → 本番構成の移行計画 |
| [提案資料 PDF](./docs/proposal.pdf) | イベント施策コンセプト・体験フロー・アーキテクチャ設計 |

---