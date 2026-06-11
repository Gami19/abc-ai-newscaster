## Day 2 実装計画

### 目標

```
├── lib/ai/ OpenAI 完全実装 + Azure/Bedrock スタブ
├── lib/tts/ VoiceText実装の完成
├── lib/prompts/ デフォルト原稿テンプレート（AI失敗時フォールバック）
├── /api/generate 完成（OpenAI 動作確認）
├── /api/tts 完成（VoiceText HOYA）
├── STEP 3（AI生成待機）画面の完成
└── STEP 4（プレビュー）画面の完成（動画生成は Day 3）
```

---

### 追加インストールパッケージ

```
□ openai
      → OpenAI 実装に使用

※ Azure / Bedrock はスタブのみのため
  @aws-sdk/* は Day 2 ではインストール不要
  （本番移行時に Phase 1 で追加）
```

---

### タスク一覧

---

#### 🧠 lib/ai/ プロバイダー設計（午前）

##### プロトタイプスコープ

```
OpenAI のみ動作確認・Azure/Bedrock はスタブ

理由：
  UI/UX Quality が最重要
  → 3プロバイダー動作確認に Day 2 工数を使わない

lib/ai/
├── index.ts       プロバイダー振り分け（実装）
├── openai.ts      ✅ 完全実装・動作確認まで
├── azure.ts       ⬜ インターフェース準拠 + スタブ
│                     throw new Error("Azure: coming soon")
└── bedrock.ts     ⬜ インターフェース準拠 + スタブ
                      throw new Error("Bedrock: coming soon")

README / PDF に明記：
  「インターフェース統一により APIキー設定だけで切り替え可能」
```

##### 型・インターフェース設計（`types/index.ts` に追記）

```
GenerateScriptInput
  └── UserInput をそのまま受け取る

GenerateScriptOutput
  └── { script: string }

AIProvider
  └── "openai" | "azure" | "bedrock" のユニオン型

AIProviderInterface
  └── generateScript(input: GenerateScriptInput): Promise<string>
      → 全プロバイダーがこのインターフェースを実装する
      → 呼び出し側は実装を意識しない設計
```

---

##### `lib/ai/openai.ts`

```
実装内容：
  ├── openai SDK を使用
  ├── モデル：gpt-4o
  ├── OPENAI_API_KEY を読み取り
  └── generateScript() を実装

プロンプト：
  system / user を newsScript.ts から読み込み

エラーハンドリング：
  ├── APIキー未設定 → 明示的なエラーメッセージ
  └── レートリミット / タイムアウト → throwしてAPIルートで捕捉
```

---

##### `lib/ai/azure.ts`（スタブ）

```
実装内容：
  ├── AIProviderInterface を実装
  └── generateScript() {
        throw new Error("Azure OpenAI: coming soon")
      }

本番移行時（Phase 1）：
  openai SDK の AzureOpenAI クライアントで実装予定
```

---

##### `lib/ai/bedrock.ts`（スタブ）

```
実装内容：
  ├── AIProviderInterface を実装
  └── generateScript() {
        throw new Error("Amazon Bedrock: coming soon")
      }

本番移行時（Phase 1）：
  @aws-sdk/client-bedrock-runtime で実装予定
```

---

##### `lib/ai/index.ts`（振り分け）

```
実装内容：
  ├── AI_PROVIDER 環境変数を読み取り
  ├── switch文でプロバイダーを選択
  │     "openai"  → openai.ts の generateScript()
  │     "azure"   → azure.ts の generateScript()
  │     "bedrock" → bedrock.ts の generateScript()
  │     default   → openai にフォールバック
  └── generateScript() を export

設計のポイント：
  APIルートから呼ぶのはこのファイルだけ
  → プロバイダーの実装詳細をAPIルートから完全に隠蔽
```

---

##### `lib/prompts/newsScript.ts`

```
定義内容：
  ├── SYSTEM_PROMPT : string
  │     - 子供向け・明るい・教育的・不適切表現禁止
  │     - 150字以内の制約
  │     - ABCニュースのフォーマットを模倣
  │
  └── buildUserPrompt(input: GenerateScriptInput): string
        - name / grade / dream / hobby を埋め込み
        - 2035年設定を明記

プロンプトの工夫：
  ├── 冒頭に「こんばんは。キャスターの{name}です。」を固定
  ├── 子供の夢・好きなことを自然に原稿に織り込む指示
  ├── 締めに「以上、ABCニュースでお伝えしました。」を固定
  └── JSON形式での返却を指定しない
        → scriptはプレーンテキストで受け取る
```

---

##### `lib/prompts/defaultScript.ts`（AI失敗時フォールバック）

```
「失敗体験をゼロに」方針に基づくデフォルト原稿

buildDefaultScript(input: UserInput): string

テンプレート：
  「こんばんは。キャスターの{name}です。
   2035年のトップニュースです。
   {name}さんの夢が叶い、
   たくさんの人を笑顔にしました。
   {name}さんはいつも
   {hobby}を楽しみながら、
   {dream}に向かってがんばっています。
   以上、ABCニュースでお伝えしました。」

  ※ name / dream / hobby / grade は userInput から埋め込む
```

---

#### 🔊 lib/tts/voicetext.ts

```
実装内容：
  ├── VoiceText API に fetch でPOSTリクエスト
  │     URL    : https://api.voicetext.jp/v1/tts
  │     Method : POST
  │     Auth   : Basic認証
  │               username = VOICETEXT_API_KEY
  │               password = ""（空文字）
  │     Body（application/x-www-form-urlencoded）:
  │               text    = 原稿テキスト
  │               speaker = VOICETEXT_SPEAKER (env)
  │               format  = wav
  │               speed   = 110  （少しゆっくり・子供向け）
  │               pitch   = 120  （明るい声質）
  │
  └── ArrayBuffer を返却
        → APIルートで Response に変換

エラーハンドリング：
  ├── テキストが空 → throw
  ├── 401 → APIキー不正
  └── 503 → VoiceTextサーバーエラー → リトライ1回
```

---

#### 🔌 APIルート実装

##### `app/api/generate/route.ts`

```
処理フロー：

  1. POST リクエストを受け取る
        { name, grade, dream, hobby }

  2. バリデーション（Day 1 骨格を拡張）
        name    : 1〜10文字
        grade   : "小学1年生" 〜 "小学6年生"
        dream   : 1〜20文字
        hobby   : 1〜20文字
        → 失敗時 400 を返す

  3. lib/ai/index.ts の generateScript() を呼び出し

  4. script が返ってきたら 200 で返却
        { script: string }

  5. エラー時の処理
        try/catch で全体を囲む
        → OpenAI系エラー（RateLimitError等）は 429
        → その他は 500
        → エラー時は { error: string } を返す

セキュリティ：
  └── API_KEYは全てサーバーサイドで処理
        → NEXT_PUBLIC_ プレフィックスは絶対に使わない
```

---

##### `app/api/tts/route.ts`

```
処理フロー：

  1. POST リクエストを受け取る
        { text: string }

  2. バリデーション
        text が空文字でないこと
        → 失敗時 400 を返す

  3. lib/tts/voicetext.ts を呼び出し
        → ArrayBuffer を受け取る

  4. audio/wav として返却
        new Response(arrayBuffer, {
          headers: { Content-Type: audio/wav }
        })

  5. エラー時
        { error: string } を 500 で返す

フロントでの受け取り方（仕様として明記）：
  fetch → response.blob()
        → URL.createObjectURL(blob)
        → Zustand の audioBlob に保存
        → <audio> の src に渡して再生
```

---

#### 🎨 STEP 3：AI生成待機ページ（`/generating`）

##### 処理設計

```
画面マウント時の処理フロー：

  1. Zustand から userInput / photoBase64 を取得
       → photoBase64 がなければ / にリダイレクト

  2. /api/generate を呼び出し
       → 失敗時：1回自動リトライ（2秒後）
       → リトライも失敗：buildDefaultScript() でデフォルト原稿を使用
       → ユーザーにはエラーを見せない（console.error のみ）
       → scriptText を Zustand に保存

  3. /api/tts を呼び出し（scriptText を渡す）
       → audioBlob を Zustand に保存

  4. 両方完了したら /preview に遷移

  ※ 2と3はシーケンシャルに実行
       （TTSには生成済みのscriptが必要なため）
```

---

##### UI設計

```
レイアウト：
  ┌─────────────────────────────────────┐
  │  ABCロゴ                              │
  │  ステップインジケーター 3/5            │
  ├─────────────────────────────────────┤
  │                                       │
  │     「AIが2035年を予測中...」          │  ← メインコピー
  │                                       │
  │   ┌───────────────────────────────┐  │
  │   │                               │  │
  │   │  🌐 未来予測レーダー           │  │  ← アニメーション領域
  │   │                               │  │
  │   └───────────────────────────────┘  │
  │                                       │
  │   ████████████░░░░░░  65%            │  ← プログレスバー
  │                                       │
  │   ✅ ニュース原稿を生成中...          │  ← ステータステキスト
  │   ⏳ 音声を合成中...                 │
  │                                       │
  └─────────────────────────────────────┘

アニメーション詳細（Framer Motion）：
  ├── 未来予測レーダー
  │     同心円が外側に広がるパルスアニメーション
  │     サンライズオレンジ（abc-orange）のグラデーション
  │
  ├── プログレスバー
  │     原稿生成完了で50%
  │     音声合成完了で100%
  │     Framer Motionのmotionで滑らかに増加
  │
  ├── ステータステキスト
  │     完了したステップに ✅ 表示
  │     進行中のステップはドットアニメーション
  │     「生成中・・・」
  │
  └── 完了時
        100%になったら一瞬待って
        Framer Motionのexit animationで /preview に遷移

エラー時UI（TTS 失敗時のみ表示）：
  ├── エラーメッセージをやさしい言葉で表示
  │     「もう一度ためしてね！」
  └── 「もどる」ボタンで / に戻る

  ※ 原稿生成失敗時はデフォルト原稿で自動続行するため
     ユーザー向けエラーは表示しない
```

---

#### 🎨 STEP 4：プレビューページ（`/preview`）

##### 処理設計

```
画面マウント時：
  1. Zustand から scriptText / audioBlob を取得
       → なければ / にリダイレクト

  2. audioBlob → URL.createObjectURL() で再生可能なURLを生成
       → <audio> タグに渡す

  3. 自動再生（ユーザーインタラクション後）
       ブラウザのautoplay制限に注意
       → 「▶ 読み上げを聞く」ボタンを押してから再生

  ※ Day 3 で Canvas合成プレビュー + 動画生成を追加
  ※ 「どうがをつくる！」押下 → /preview 内で generateVideo()
     → 完了後 /result に遷移（Day 3）
```

---

##### UI設計

```
レイアウト：
  ┌─────────────────────────────────────┐
  │  ABCロゴ                              │
  │  ステップインジケーター 4/5            │
  ├─────────────────────────────────────┤
  │                                       │
  │  「きみの2035年ニュースができたよ！」   │
  │                                       │
  │  ┌───────────────────────────────┐  │
  │  │  📺  ABC NEWS 2035            │  │  ← プレビューカード
  │  │  ─────────────────────────── │  │    （Day3でCanvas合成に置換）
  │  │                               │  │
  │  │  ＜顔写真サムネイル＞          │  │
  │  │                               │  │
  │  │  原稿テキストをここに表示      │  │  ← scriptText
  │  │  （スクロール可能）            │  │
  │  └───────────────────────────────┘  │
  │                                       │
  │  ┌───────────────────────────────┐  │
  │  │  🔊  ニュースを読み上げる      │  │  ← 音声再生ボタン
  │  └───────────────────────────────┘  │
  │                                       │
  │  再生中：████████░░░░  音声バー        │  ← 再生プログレス
  │                                       │
  │  ┌───────────────────────────────┐  │
  │  │  🎬  どうがをつくる！          │  │  ← CTAボタン (abc-red)
  │  └───────────────────────────────┘  │
  │  ← もどる                            │
  └─────────────────────────────────────┘

UXの工夫：
  ├── 原稿テキストは読み上げに合わせてハイライト
  │     （Day 3 で実装・ここでは枠だけ用意）
  ├── 音声再生中はボタンを「停止」に切り替え
  └── 「どうがをつくる！」ボタンは Day 2 では disabled または
        「Day 3 で有効化」プレースホルダー表示

保護者向け大画面：
  OS ミラーリング or 同 URL を別ディスプレイで表示（実装不要）
  ※ Zustand はブラウザセッション内のみ共有のためミラーリング運用が現実的
```

---

### Day 2 完了定義

```
✅ lib/ai/openai.ts が完全実装・動作確認済み
✅ lib/ai/azure.ts・bedrock.ts がスタブ実装済み
✅ lib/prompts/defaultScript.ts が完成している
✅ lib/tts/voicetext.ts が完成している
✅ /api/generate が Postman 等で OpenAI 動作確認できる
✅ /api/tts が wav ファイルを返却できる
✅ /generating で API 呼び出し・デフォルト原稿フォールバックが動く
✅ /preview 画面で原稿テキストが表示される
✅ /preview 画面で音声が再生できる
✅ TTS 失敗時にユーザーフレンドリーなメッセージが出る
✅ Vercel に最新状態がデプロイされている
```

---

### Day 2 終了時点のデータフロー

```
/ (入力)
  → userInput → Zustand
        ↓
/camera (撮影)
  → photoBase64 → Zustand
        ↓
/generating (AI生成) ★Day2の核心
  → POST /api/generate
      → lib/ai/index.ts → openai.ts（失敗時 defaultScript）
          → scriptText → Zustand
  → POST /api/tts
      → lib/tts/voicetext.ts
          → audioBlob → Zustand
        ↓
/preview (プレビュー) ★Day2で原稿・音声まで完成
  → scriptText 表示
  → audioBlob 再生
        ↓
/result (QR表示) ← Day 3 で完成（動画生成は /preview で実行）
```

---