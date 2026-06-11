## 確定事項の最終整理 → Day 1実装計画

---

### 朝日放送テレビ カラーテーマ

```
朝日放送テレビ（ABC TV）ブランドカラー

  サンライズオレンジ  : #FF8C00  メインカラー
  チャコールグレー     : #333333   見出し・強調
  ミディアムグレー     : #666666   補足テキスト・border
  ピュアホワイト   : #FFFFFF   ページ背景
  ビビッドレッド    : #FF4500   アクセント・CTAボタン

  ※ 実装時は tailwind.config.ts の extend.colors に定義
```

---

### 全確定事項まとめ

| 項目 | 決定内容 |
|------|---------|
| フレームワーク | Next.js 15 (App Router / TypeScript) |
| UIライブラリ | shadcn/ui + TailwindCSS |
| アニメーション | Framer Motion |
| 状態管理 | Zustand |
| テキスト生成 | OpenAI（動作確認）/ Azure・Bedrock（スタブ） |
| プロバイダー切替 | 環境変数（.env.local）|
| TTS | VoiceText (HOYA) で全プロバイダー共通 |
| 動画生成 | ffmpeg.wasm（Day 3で可否判断） |
| テーマカラー | サンライズオレンジ #FF8C00 / チャコールグレー #333333 / ミディアムグレー #666666 / ピュアホワイト #FFFFFF / ビビッドレッド #FF4500 |
| ロゴ | テキスト「ABC NEWS 2035」のみ（公式画像は使用しない） |
| デプロイ | Vercel |

---

## Day 1 実装計画

### 目標
```
├── プロジェクト基盤の完成
├── デザインシステムの確立（ABCカラー）
├── Zustandストアの設計・実装
├── APIルート設計の確定
├── STEP 1（入力フォーム）画面の完成
└── STEP 2（カメラ撮影）画面の完成
```

---

### タスク一覧

#### 🔧 セットアップ（午前）

```
□ 1-1. プロジェクト作成
      npx create-next-app@latest
      - TypeScript: Yes
      - TailwindCSS: Yes
      - App Router: Yes
      - src/ directory: Yes

□ 1-2. 依存パッケージのインストール
      - shadcn/ui の初期化
      - shadcn/ui コンポーネント追加（後述の最小セット）
      - framer-motion
      - zustand
      - react-webcam
      - qrcode.react
      - @ffmpeg/ffmpeg @ffmpeg/util （Day3用に先行インストール）

      shadcn/ui Day 1 最小セット：
      ├── button      CTAボタン・学年選択ボタン
      ├── input       テキスト入力欄
      ├── label       入力欄ラベル
      ├── card        フォームカード・プレースホルダー
      ├── badge       ステップ番号表示
      ├── progress    AI生成待機のプログレスバー（Day 2用・先行追加）
      └── separator   画面内のセクション区切り（Day 2用・先行追加）

      ※ 以下はカスタム実装（shadcn/ui 不使用）：
         StepIndicator / GradeSelector / CountdownOverlay（Day 4）

□ 1-3. tailwind.config.ts にABCカラーを定義
      colors:
        abc-orange  : #FF8C00   サンライズオレンジ（メイン）
        abc-charcoal: #333333   チャコールグレー（見出し・強調）
        abc-gray    : #666666   ミディアムグレー（テキスト）
        abc-white   : #FFFFFF   ピュアホワイト（背景）
        abc-red     : #FF4500   ビビッドレッド（アクセント・CTA）

□ 1-4. shadcn/ui のテーマカスタマイズ
      globals.css の CSS変数をABCカラーに上書き
      --primary              → #FF8C00   サンライズオレンジ
      --primary-foreground   → #FFFFFF
      --background           → #FFFFFF   ピュアホワイト
      --foreground           → #333333   チャコールグレー
      --muted-foreground     → #666666   ミディアムグレー
      --destructive          → #FF4500   ビビッドレッド
      --border               → #666666   ミディアムグレー（薄め）
      --ring                 → #FF8C00   サンライズオレンジ

□ 1-5. .env.local.example の作成
      （後述の環境変数設計を参照）

□ 1-6. プロジェクト構成のディレクトリ作成
      （後述のディレクトリ構成を参照）
```

---

#### 🎨 `tailwind.config.ts` 詳細仕様

```
theme: {
  extend: {
    colors: {
      abc: {
        orange  : "#FF8C00",   // サンライズオレンジ：ロゴ・primary・強調枠
        charcoal: "#333333",   // チャコールグレー  ：見出し・ボディテキスト
        gray    : "#666666",   // ミディアムグレー  ：補足テキスト・border
        white   : "#FFFFFF",   // ピュアホワイト    ：背景・カード
        red     : "#FF4500",   // ビビッドレッド    ：CTAボタン・アクセント
      }
    },
    fontFamily: {
      sans: ["Noto Sans JP", "sans-serif"],  // 日本語最適化
    }
  }
}

※ Noto Sans JP は layout.tsx で next/font/google から読み込む

使用例（Tailwindクラス）：
  bg-abc-white         ページ背景
  text-abc-charcoal    見出しテキスト
  text-abc-gray        補足・プレースホルダー
  bg-abc-orange        primaryボタン・ロゴ背景
  bg-abc-red           CTAボタン（つぎへ・さつえいする）
  border-abc-orange    入力欄フォーカス枠
  ring-abc-orange      shadcn/ui のfocus ring
```

---

#### 🎨 `globals.css` 完全版

```css
@layer base {
  :root {
    /* ─── ABCカラー（ライトモード） ─── */

    /* メイン：サンライズオレンジ */
    --primary            : 33 100% 50%;    /* #FF8C00 */
    --primary-foreground : 0 0% 100%;      /* #FFFFFF */

    /* 背景：ピュアホワイト */
    --background         : 0 0% 100%;     /* #FFFFFF */
    --card               : 0 0% 100%;
    --card-foreground    : 0 0% 20%;      /* #333333 */
    --popover            : 0 0% 100%;
    --popover-foreground : 0 0% 20%;

    /* テキスト：チャコールグレー */
    --foreground         : 0 0% 20%;      /* #333333 */

    /* 補足：ミディアムグレー */
    --muted              : 0 0% 95%;
    --muted-foreground   : 0 0% 40%;      /* #666666 */

    /* アクセント */
    --accent             : 33 100% 50%;   /* #FF8C00 */
    --accent-foreground  : 0 0% 100%;

    /* CTA・エラー：ビビッドレッド */
    --destructive        : 16 100% 50%;   /* #FF4500 */
    --destructive-foreground: 0 0% 100%;

    /* ボーダー・入力 */
    --border             : 0 0% 40%;      /* #666666 */
    --input              : 0 0% 40%;
    --ring               : 33 100% 50%;   /* #FF8C00 */

    --radius             : 0.75rem;
  }

  /* ダークモードは今回使用しないため定義しない */
}
```

---

#### 🎨 カラーの用途マッピング（設計ガイド）

```
コンポーネント           使用カラー           Tailwindクラス
────────────────────────────────────────────────────────────
ページ背景               ピュアホワイト       bg-white / bg-abc-white
ヘッダー背景             サンライズオレンジ   bg-abc-orange
ロゴ・ブランドテキスト    ピュアホワイト       text-white（on orange bg）
見出し（h1/h2）          チャコールグレー     text-abc-charcoal
本文テキスト             チャコールグレー     text-abc-charcoal
補足・placeholder        ミディアムグレー     text-abc-gray
入力欄 border            ミディアムグレー     border-abc-gray
入力欄 focus ring        サンライズオレンジ   ring-abc-orange
学年選択ボタン（未選択） ミディアムグレー枠   border-abc-gray text-abc-gray
学年選択ボタン（選択済） サンライズオレンジ   bg-abc-orange text-white
CTAボタン（つぎへ等）    ビビッドレッド       bg-abc-red text-white
StepIndicator（完了）    サンライズオレンジ   bg-abc-orange
StepIndicator（現在）    ビビッドレッド       bg-abc-red（パルスアニメ）
StepIndicator（未来）    ミディアムグレー     bg-abc-gray
カウントダウン数字       サンライズオレンジ   text-abc-orange
カメラフレーム枠         サンライズオレンジ   border-abc-orange
ニュースオーバーレイ枠   サンライズオレンジ   bg-abc-orange/80
エラーテキスト           ビビッドレッド       text-abc-red
```

---

#### 🗂 ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx                  # ルートレイアウト
│   ├── page.tsx                    # STEP 1：入力フォーム
│   ├── camera/
│   │   └── page.tsx                # STEP 2：カメラ撮影
│   ├── generating/
│   │   └── page.tsx                # STEP 3：AI生成待機
│   ├── preview/
│   │   └── page.tsx                # STEP 4：プレビュー
│   ├── result/
│   │   └── page.tsx                # STEP 5：QR表示
│   └── api/
│       ├── generate/
│       │   └── route.ts            # 原稿生成API
│       ├── tts/
│       │   └── route.ts            # 音声合成API
│       └── upload/
│           └── route.ts            # Vercel Blob アップロード（Day 3）
│
├── components/
│   ├── ui/                         # shadcn/ui 自動生成
│   ├── layout/
│   │   ├── StepIndicator.tsx       # ステップ進捗バー
│   │   └── ABCLogo.tsx             # テキスト「ABC NEWS 2035」のみ
│   ├── form/
│   │   ├── InputForm.tsx           # 入力フォーム本体
│   │   └── GradeSelector.tsx       # 学年ボタン選択UI
│   └── camera/
│       ├── CameraView.tsx          # Webカメラプレビュー
│       └── CountdownOverlay.tsx    # 3・2・1カウントダウン（Day 4で実装）
│
├── lib/
│   ├── store/
│   │   └── useSessionStore.ts      # Zustandストア定義
│   ├── ai/
│   │   ├── index.ts                # プロバイダー振り分け
│   │   ├── openai.ts               # OpenAI実装
│   │   ├── azure.ts                # Azure OpenAI（スタブ・Day 2）
│   │   └── bedrock.ts              # Amazon Bedrock（スタブ・Day 2）
│   ├── tts/
│   │   └── voicetext.ts            # VoiceText (HOYA) 実装
│   └── prompts/
│       ├── newsScript.ts           # GPTプロンプト定義
│       └── defaultScript.ts        # AI失敗時デフォルト原稿（Day 2）
│
├── types/
│   └── index.ts                    # 共通型定義
│
public/
└── templates/
    └── news_template.png           # 仮画像（Day 1）→ 本番テンプレ（Day 3）
```

---

#### 📄 プレースホルダーページ（STEP 3〜5）

```
/generating, /preview, /result は Day 1 でプレースホルダーを作成する

内容：
  ABCLogo + StepIndicator + 「工事中」テキスト
  → 画面遷移の動線確認ができる最低限
  → ルーティングエラーを防ぐ

カメラ OK 後：
  /generating（プレースホルダー）へ遷移確認のみでよい
  → Zustand に photoBase64 が保存されるか確認できれば OK
```

---

#### 🛡 直接アクセス防止ガード（全画面・Day 1 から実装）

```
各ページ先頭にガードを入れる（3〜5行）：

  /camera：
    userInput が null → / にリダイレクト

  /generating：
    photoBase64 が null → / にリダイレクト

  /preview：
    scriptText が null → / にリダイレクト

  /result：
    videoBlob が null → / にリダイレクト
    ※ Day 3 以降は blobUrl も確認可能
```

---

#### 🖼 news_template.png 仮画像（Day 1）

```
Day 1 で仮画像を public/templates/ に配置する

仮画像仕様：
  1280 × 720px
  背景色：abc-charcoal (#333333)
  中央に "ABC NEWS 2035" テキスト（白）
  → Day 3 の Canvas 合成時にファイル不在エラーを防ぐ
```

---

#### 📷 写真データ形式

```
撮影時：
  形式   : JPEG（quality 0.92）
  保存   : canvas.toDataURL("image/jpeg", 0.92) → photoBase64

Canvas合成解像度：
  1280 × 720px（16:9）固定
```

---

#### 🗃 環境変数設計

```bash
# .env.local.example

# ─────────────────────────────────────
# AI プロバイダー選択
# openai | azure | bedrock
# ─────────────────────────────────────
AI_PROVIDER=openai

# ─────────────────────────────────────
# OpenAI
# ─────────────────────────────────────
OPENAI_API_KEY=

# ─────────────────────────────────────
# Azure OpenAI
# ─────────────────────────────────────
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT_NAME=

# ─────────────────────────────────────
# Amazon Bedrock
# ─────────────────────────────────────
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
BEDROCK_MODEL_ID=

# ─────────────────────────────────────
# VoiceText (HOYA) ※ 全プロバイダー共通
# ─────────────────────────────────────
VOICETEXT_API_KEY=
VOICETEXT_SPEAKER=haruka   # show | haruka | hikari | bear | takeru
```

---

#### 🔌 APIルート設計

##### `POST /api/generate`

```
概要：
  ユーザー入力を受け取り、AIが未来ニュース原稿を生成する

Request Body:
  {
    name    : string   // ニックネーム（1〜10文字）
    grade   : string   // 学年（"小学1年生" 〜 "小学6年生"）
    dream   : string   // 将来の夢（1〜20文字）
    hobby   : string   // 好きなこと（1〜20文字）
  }

Response:
  200 OK
  {
    script : string   // 生成された原稿テキスト（150字程度）
  }

  400 Bad Request
  { error: "入力値が不正です" }

  500 Internal Server Error
  { error: "原稿の生成に失敗しました" }

Day 1 の完成度：
  ✅ Request Body のバリデーション実装
  ✅ 200 / 400 / 500 のレスポンス形式確定
  ⬜ AI 呼び出しロジック（→ Day 2）
  ✅ TODO コメントで実装箇所を明記

処理フロー（Day 2 完成時）：
  1. Request Bodyのバリデーション
  2. AI_PROVIDER環境変数を読み取り
  3. lib/ai/index.ts のgenerateScript()を呼び出し
  4. プロバイダーに応じてopenai.ts / azure.ts / bedrock.tsへ振り分け
  5. 生成されたscriptを返却

プロンプト設計（newsScript.ts）：
  system：
    "あなたは子供向けイベントのニュース原稿ライターです。
     明るく前向きな内容で、教育的な原稿を生成してください。
     暴力・差別・不適切な表現は絶対に含めないでください。"

  user：
    "以下の子供の情報をもとに、2035年のABCニュースの
     原稿を150字以内で生成してください。
     名前：{name}、学年：{grade}、
     夢：{dream}、好きなこと：{hobby}"
```

##### `POST /api/tts`

```
概要：
  原稿テキストをVoiceText(HOYA)で音声合成し、
  音声バイナリをそのまま返す

Request Body:
  {
    text : string   // 読み上げる原稿テキスト
  }

Response:
  200 OK
  Content-Type: audio/wav
  （音声バイナリをそのままストリーム返却）

  400 Bad Request
  { error: "テキストが空です" }

  500 Internal Server Error
  { error: "音声生成に失敗しました" }

Day 1 の完成度：
  ✅ text のバリデーション（空文字チェック）
  ✅ 200 / 400 / 500 のレスポンス形式確定
  ⬜ VoiceText API 呼び出し（→ Day 2）
  ✅ TODO コメントで実装箇所を明記

処理フロー（Day 2 完成時）：
  1. textのバリデーション（空文字チェック）
  2. VoiceText API に POST リクエスト
       URL    : https://api.voicetext.jp/v1/tts
       Auth   : Basic認証（VOICETEXT_API_KEY）
       Params : text / speaker / format=wav / speed / pitch
  3. 受け取った音声バイナリをそのままResponse返却

フロントでの受け取り：
  → fetch → blob() → URL.createObjectURL()
  → <audio> タグに渡して再生
```

---

#### 📦 Zustandストア設計

```
型定義（types/index.ts）

  UserInput {
    name    : string
    grade   : string
    dream   : string
    hobby   : string
  }

  SessionState {
    // データ
    userInput    : UserInput | null
    photoBase64  : string | null
    scriptText   : string | null
    audioBlob    : Blob | null
    videoBlob    : Blob | null
    blobUrl      : string | null   // Vercel Blob 公開URL（Day 3）

    // アクション
    setUserInput    : (input: UserInput) => void
    setPhoto        : (base64: string) => void
    setScript       : (text: string) => void
    setAudio        : (blob: Blob) => void
    setVideo        : (blob: Blob) => void
    setBlobUrl      : (url: string) => void
    reset           : () => void   // 体験終了後の初期化
  }

設計ポイント：
  ├── 各setterは対応するフィールドのみ更新
  │     → 無関係なコンポーネントの再レンダリングを防ぐ
  ├── reset()で全フィールドをnullに戻す
  │     → 次の体験者のためにクリア
  └── persist ミドルウェアは使わない
        → 顔写真・音声を永続化しないことでプライバシー保護
```

---

#### 🎨 UI実装（午後）

##### STEP 1：入力フォームページ（`/`）

```
レイアウト：
  ┌────────────────────────────────┐
  │  "ABC NEWS 2035"               │  ← ABCLogo.tsx（テキストのみ・bg-abc-orange）
  │  ステップインジケーター 1/5     │  ← StepIndicator.tsx
  ├────────────────────────────────┤
  │                                │
  │  「きみの未来を教えて！」        │  ← 見出し (abc-charcoal / #333333)
  │                                │
  │  ニックネーム  [       ]        │  ← shadcn/ui Input
  │                                │
  │  学年         [小1][小2][小3]  │  ← GradeSelector.tsx
  │               [小4][小5][小6]  │    2列×3行・中学は表示しない
  │                                │
  │  将来の夢     [       ]         │  ← shadcn/ui Input
  │  （例：サッカー選手）            │
  │                                │
  │  好きなこと   [       ]         │  ← shadcn/ui Input
  │  （例：ゲーム・ラーメン）        │
  │                                │
  │  ┌──────────────────────────┐  │
  │  │  つぎへ →                │  │  ← CTAボタン (abc-red / #FF4500)
  │  └──────────────────────────┘  │
  │                                │
  └────────────────────────────────┘

学年マッピング：
  ボタン表示   保存値
  小1        "小学1年生"
  小2        "小学2年生"
    ...
  小6        "小学6年生"

バリデーション（Day 1 から実装）：
  ニックネーム  最小1文字・最大10文字（絵文字可）
  将来の夢      最小1文字・最大20文字
  好きなこと    最小1文字・最大20文字

  実装方法：
    react-hook-form は使わない
    → shadcn/ui Input の onChange + useState でリアルタイム検証

  エラー表示：
    入力欄の下に text-abc-red で
    「10文字以内で入れてね」などやさしい表現

UX上の工夫：
  ├── 全フィールド入力＋バリデーション通過前はつぎへボタンを disabled
  ├── 学年はボタン選択式（キーボード不要）
  ├── 入力欄は大きめフォントサイズ（子供が見やすい・最低18px）
  └── Framer Motionで画面入場アニメーション
```

##### STEP 2：カメラ撮影ページ（`/camera`）

```
レイアウト：
  ┌────────────────────────────────┐
  │  "ABC NEWS 2035"               │  ← ABCLogo.tsx（テキストのみ）
  │  ステップインジケーター 2/5      │
  ├────────────────────────────────┤
  │                                │
  │  「カメラに向かってすわってね！」 │
  │                                │
  │  ┌──────────────────────────┐  │
  │  │                          │  │
  │  │   Webカメラ プレビュー     │  │  ← react-webcam
  │  │                          │  │
  │  └──────────────────────────┘  │
  │                                │
  │  ┌──────────────────────────┐  │
  │  │  📷  さつえいする！       │  │  ← 撮影ボタン (abc-red / #FF4500)
  │  └──────────────────────────┘  │
  │                                │
  └────────────────────────────────┘

撮影後：
  ┌────────────────────────────────┐
  │   撮影した写真のプレビュー        │
  │                                │
  │  [  とりなおす  ] [  これでOK!  ]│
  └────────────────────────────────┘

Day 1 で実装する（コア）：
  ✅ Webカメラプレビュー表示
  ✅ 撮影ボタン → photoBase64 取得（JPEG quality 0.92）
  ✅ 撮影後プレビュー（とりなおす / OK）
  ✅ OK → Zustand 保存 → /generating 遷移
  ✅ userInput が null なら / にリダイレクト

Day 4 で追加する（演出）：
  ⬜ 3・2・1カウントダウンアニメーション
  ⬜ シャッター音（効果音）
  ⬜ ニュース風フレームオーバーレイ（abc-orange）
  ⬜ 撮影時のフラッシュ演出
```

---

#### ⚠️ Day 3 懸念事項（先行記録）

```
ffmpeg.wasm × Next.js 15 の既知リスク

  問題1：SharedArrayBuffer の要件
    → next.config.ts に以下を追加が必須
      Cross-Origin-Opener-Policy: same-origin
      Cross-Origin-Embedder-Policy: require-corp

  問題2：COEPヘッダーとWebカメラの競合
    → COEP有効化でreact-webcamが動作しない可能性
    → Day 3で検証し、問題発生時は
      「静止画(PNG) + 音声(mp3)を別々にDL」に切替

  問題3：Vercelでのヘッダー設定
    → vercel.json に明示的に追加が必要
```

---

### Day 1 時系列ゴール

```
午前中（〜12:00）
  ✅ プロジェクト作成・パッケージ install 完了
  ✅ ABCカラー tailwind.config.ts 反映
  ✅ shadcn/ui テーマカスタマイズ完了
  ✅ ディレクトリ構成作成
  ✅ Zustand ストア型定義完成
  ✅ .env.local.example 完成

午後前半（〜15:00）
  ✅ ABCLogo / StepIndicator コンポーネント完成
  ✅ 全5画面のプレースホルダー作成（遷移動線確認）
  ✅ 直接アクセス防止ガード実装
  ✅ STEP 1 入力フォーム + バリデーション 完成
  ✅ /api/generate・/api/tts バリデーション骨格完成

午後後半（〜18:00）
  ✅ STEP 2 カメラ撮影画面（コア機能）完成
  ✅ news_template.png 仮画像配置
  ✅ Vercel 初回デプロイ成功
```

---

### Day 1 完了定義

```
✅ npm run dev でエラーなく起動する
✅ ABCカラーがデザインシステムに反映されている
✅ 入力フォーム（バリデーション含む）→ カメラ撮影 → /generating 遷移が動く
✅ 全5画面のプレースホルダー + 直接アクセスガードが実装されている
✅ Zustandストアに型定義が完成している
✅ /api/generate・/api/tts のバリデーション骨格が完成している
✅ news_template.png 仮画像が配置されている
✅ .env.local.example が完成している
✅ Vercelへの初回デプロイが成功している
```

---