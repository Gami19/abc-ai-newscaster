## Day 4 実装計画

### 目標

```
├── 全体通しテスト・バグ修正
├── UX・アニメーション最終仕上げ
├── エラーハンドリングの強化
├── パフォーマンス最適化
├── README.md 作成（審査員向け）
├── GitHub public リポジトリ公開
└── Vercel 本番デプロイ・最終確認
```

---

### タスク一覧

---

#### 🧪 全体通しテスト（午前一番）

Day 4 は **コードを書く前に必ず全体を通して動かす** ことから始める。

##### テストシナリオ一覧

```
シナリオ 1：ハッピーパス（正常系）
─────────────────────────────────────────
□ / でフォームに入力
□ /camera でカメラが起動・撮影できる
□ /generating で原稿生成・音声合成が完了する
□ /preview でCanvas合成画像が表示される
□ /preview で音声が再生される
□ /preview で「どうがをつくる！」→ 動画生成完了 → /result に遷移
□ /result で動画（or 画像+音声・方針C）がDLできる
□ /result でQRコード（Vercel Blob URL）が表示される
□ 「つぎのひとへ」で / に戻り状態がリセットされる

シナリオ 2：入力バリデーション
─────────────────────────────────────────
□ 空のまま「つぎへ」を押しても進めない（disabled）
□ 名前が10文字超の場合にエラー表示（「10文字以内で入れてね」）
□ 夢・好きなことが20文字超の場合にエラー表示
□ 学年は小1〜小6のみ選択可能

シナリオ 3：直接アクセス防止
─────────────────────────────────────────
□ /camera に直接アクセス → / にリダイレクト
□ /generating に直接アクセス → / にリダイレクト
□ /preview に直接アクセス → / にリダイレクト
□ /result に直接アクセス → / にリダイレクト

シナリオ 4：エラー系
─────────────────────────────────────────
□ APIキーが不正な場合 → デフォルト原稿で自動続行（ユーザーにエラー非表示）
□ /generating で TTS 失敗時にリトライ or / に戻れる
□ /preview で動画生成失敗時に /preview 内でリトライ可能
□ カメラが使えない端末でのエラーメッセージ表示
□ Vercel Blob アップロード失敗時に同端末 DL 案内が表示される

シナリオ 5：ブラウザ・デバイス確認
─────────────────────────────────────────
□ Chrome（最新） → 正常動作
□ Safari（最新） → 動作確認（webm非対応の確認）
□ iPad（タッチ） → タッチ操作が全て機能する
□ スマートフォン → QR スキャンで Blob URL の動画が再生・DLできる
```

---

##### 発見したバグの優先度分類

```
🔴 P0（必ず修正）
  └── 体験が完遂できないバグ
        例：動画が生成されない・画面遷移が詰まる

🟡 P1（できれば修正）
  └── UXが著しく損なわれるバグ
        例：音声が再生されない・Canvas合成がずれる

🟢 P2（時間があれば）
  └── 細かいUI崩れ・アニメーションの乱れ
        例：ボタンの色がずれる・テキストが少しはみ出る
```

---

#### 🛡 エラーハンドリング強化（午前）

##### グローバルエラーバウンダリの実装

```
app/error.tsx（Next.js 15 の Error Boundary）

設計：
  ├── 予期しないエラーをキャッチ
  ├── 子供向けの優しいエラーメッセージを表示
  │     「あれ？なにかおかしくなっちゃった！」
  │     「もう一度はじめからやってみてね 😊」
  ├── 「はじめにもどる」ボタンで / に遷移
  └── Zustand の reset() も合わせて呼ぶ

app/not-found.tsx
  └── 存在しないページへのアクセス時
        「このページはないよ！」
        「はじめにもどる」ボタン
```

---

##### APIルートのエラーハンドリング統一

```
共通エラーレスポンス型の整理（types/index.ts に追記）

  APIError {
    error   : string   // ユーザー向けメッセージ
    code    : string   // エラーコード（デバッグ用）
    retryable: boolean // リトライ可能か
  }

各APIルートで統一する処理：
  ├── /api/generate
  │     RateLimitError  → 429・retryable: true
  │     InvalidAPIKey   → 500・retryable: false
  │     Timeout（10秒） → 504・retryable: true
  │     その他          → 500・retryable: false
  │
  └── /api/tts
        空テキスト      → 400・retryable: false
        VoiceText503   → 503・retryable: true
        その他          → 500・retryable: false
```

---

##### `/generating` のリトライUI（TTS 失敗時）

```
※ 原稿生成失敗時は buildDefaultScript() で自動続行するため
   ユーザー向けリトライ UI は不要

TTS 失敗時のリトライ設計：
  ├── retryable: true のエラー → 自動で1回リトライ
  │     リトライ前に2秒待機（レートリミット対策）
  │     リトライ中は「もう一度試しています...」と表示
  │
  ├── リトライも失敗 or retryable: false
  │     エラーカード表示：
  │     ┌───────────────────────────────┐
  │     │  😢 うまくいかなかったよ       │
  │     │                               │
  │     │  もう一度はじめから            │
  │     │  やってみてね！                │
  │     │                               │
  │     │  [ はじめにもどる ]            │
  │     └───────────────────────────────┘
  │
  └── 「はじめにもどる」
        → Zustand reset() → / に遷移
```

---

##### カメラエラーハンドリング

```
react-webcam のエラー対応（/camera）：

  発生しうるエラー：
  ├── カメラへのアクセス拒否（Permission Denied）
  ├── カメラデバイスが存在しない
  └── HTTPS以外の環境（ローカルは localhost で許可）

  エラーUI：
  ┌─────────────────────────────────────┐
  │  📷 カメラをつかえないみたい         │
  │                                     │
  │  ブラウザのカメラのきょかを          │
  │  ONにしてみてね！                    │
  │                                     │
  │  [ もう一度ためす ] [ もどる ]        │
  └─────────────────────────────────────┘
```

---

#### ✨ UX・アニメーション最終仕上げ（午後前半）

##### shadcn/ui 追加（Day 4）

```
npx shadcn@latest add：
  ├── toast（sonner）  エラー通知
  └── alert            エラーメッセージ表示
```

##### カメラ画面の演出追加（Day 4）

```
Day 1 で後回しにした演出をここで実装：
  ⬜ 3・2・1 カウントダウンアニメーション（CountdownOverlay.tsx）
  ⬜ シャッター音（効果音）
  ⬜ ニュース風フレームオーバーレイ（abc-orange / #FF8C00）
  ⬜ 撮影時のフラッシュ演出
  ⬜ カウントダウン数字は text-abc-orange
```

##### StepIndicator の完成

```
components/layout/StepIndicator.tsx

デザイン仕様：
  ┌───────────────────────────────────────┐
  │  ①  →  ②  →  ③  →  ④  →  ⑤       │
  │ 入力  撮影  生成  確認  完成           │
  └───────────────────────────────────────┘

  完了ステップ：abc-orange 塗りつぶし ✅
  現在ステップ：abc-red・パルスアニメーション
  未来ステップ：abc-gray

Framer Motion アニメーション：
  ├── ステップ完了時に ✅ がポップインする
  └── 進行時にバーがスライドして伸びる
```

---

##### 画面遷移アニメーションの統一

```
全画面共通のページ遷移アニメーション：

  入場（mount）：
    opacity: 0 → 1
    y: 20px → 0px
    duration: 0.4s
    easing: easeOut

  退場（unmount）：
    opacity: 1 → 0
    y: 0px → -20px
    duration: 0.3s

実装方法：
  app/layout.tsx に AnimatePresence を設置
  各ページの最外要素を <motion.div> でラップ
  → 全ページで統一した遷移が自動的に適用
```

---

##### 各ページの最終UXチェックリスト

```
STEP 1（入力）
  □ フォントサイズが子供でも読みやすいか（最低18px）
  □ 学年ボタンがタッチしやすいサイズか（最低44×44px）
  □ 「つぎへ」ボタンがdisabled時に視覚的に分かるか
  □ ABCカラーが正しく反映されているか

STEP 2（撮影）
  □ カメラプレビューが正しく表示されるか
  □ カウントダウンアニメーションが迫力あるか
  □ 「とりなおす」「これでOK」が直感的に分かるか
  □ ニュース風フレームの重ねが自然か

STEP 3（生成待機）
  □ プログレスバーが滑らかに動くか
  □ 待機中に子供が退屈しないアニメーションか
  □ ステータステキストが分かりやすいか

STEP 4（プレビュー）
  □ Canvas合成の画質・レイアウトが綺麗か
  □ 音声再生ボタンが直感的か
  □ テロップテキストが読みやすいか

STEP 5（結果）
  □ 紙吹雪アニメーションが祝福感あるか
  □ QRコードが十分な大きさで表示されるか
  □ DLボタンが分かりやすいか
  □ 「つぎのひとへ」が目立ちすぎず・目立たなさすぎないか
```

---

##### 紙吹雪アニメーションの実装仕様

```
components/effects/Confetti.tsx

仕様：
  ├── 画面上部から abc-orange・abc-red・ホワイトの
  │   紙吹雪が降り注ぐ
  ├── 50〜80個のパーティクル
  ├── それぞれランダムな
  │     x座標・落下速度・回転速度・サイズ
  ├── 3秒で消える（fadeOut）
  └── Framer Motion の keyframes で実装

発動タイミング：
  /result 画面のマウント時に自動発動
```

---

#### ⚡ パフォーマンス最適化（午後前半）

```
□ next.config.ts の最適化確認
    ├── 画像最適化（next/image）の適用
    └── ffmpeg.wasm 採用時のWebpackヘッダー設定確認

□ 不要な再レンダリングの確認
    ├── Zustandのセレクタを細かく分割できているか
    └── useCallbackの適用漏れがないか

□ Canvas合成のパフォーマンス
    └── 合成完了まで「生成中...」ローディングを表示

□ 音声ファイルのメモリ管理
    └── blobURLの作成・解放が適切か
          useEffect のクリーンアップで
          URL.revokeObjectURL() を呼んでいるか

□ APIルートのタイムアウト設定
    └── Vercel のデフォルトは10秒
          next.config.ts で maxDuration を設定
          /api/generate : 15秒
          /api/tts      : 15秒
```

---

#### 📝 README.md 作成（午後）

##### README.md 完全構成

```markdown
# 🎙 ABC 未来ニュースキャスター体験
## AI × 放送局の技術で「10年後の未来」を届ける

---

## 🌐 デモURL
https://abc-news-caster.vercel.app

> Chrome最新版での動作を推奨します

---

## 📖 概要
子供が名前・学年・夢・好きなことを入力するだけで、
AIが「2035年の未来ニュース原稿」を生成し、
ニューステンプレートに顔写真を合成した動画を
持ち帰れるイベント体験アプリ。

---

## ✨ 機能一覧
- フォーム入力（名前・学年・夢・好きなこと）
- Webカメラで顔写真撮影
- マルチプロバイダーAIによる未来ニュース原稿生成
  - OpenAI GPT-4o（動作確認済み）
  - Azure OpenAI / Amazon Bedrock（スタブ・インターフェース準拠）
- VoiceText (HOYA) による日本語音声合成
- Canvas APIによるニューステンプレート合成
- 動画生成（ffmpeg.wasm or MediaRecorder or フォールバック）
- Vercel Blob への動画アップロード
- QRコード表示（Blob 公開URL）・動画ダウンロード
- AI 生成失敗時のデフォルト原稿フォールバック（失敗体験ゼロ）

---

## 🛠 技術スタック
| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router / TypeScript) |
| UI | shadcn/ui + TailwindCSS |
| アニメーション | Framer Motion |
| 状態管理 | Zustand |
| テキスト生成 | OpenAI GPT-4o（動作確認）/ Azure・Bedrock（スタブ） |
| 音声合成 | VoiceText (HOYA) |
| 動画配信 | Vercel Blob + QR（Blob 公開URL） |
| 動画生成 | ffmpeg.wasm / MediaRecorder API |
| ホスティング | Vercel |

---

## 🚀 ローカルセットアップ

### 1. リポジトリをクローン
git clone https://github.com/xxxx/abc-news-caster
cd abc-news-caster

### 2. 環境変数を設定
cp .env.local.example .env.local

.env.local を編集：
  AI_PROVIDER=openai          # openai | azure | bedrock
  OPENAI_API_KEY=sk-...       # OpenAI使用時
  VOICETEXT_API_KEY=...       # VoiceText API Key
  BLOB_READ_WRITE_TOKEN=...   # Vercel Blob
  VIDEO_MODE=ffmpeg           # ffmpeg | mediarecorder | fallback

### AI プロバイダーについて

プロトタイプでは OpenAI のみ動作確認済みです。
Azure OpenAI / Amazon Bedrock は lib/ai/ にスタブ実装があり、
AI_PROVIDER 環境変数と API キーを設定するだけで切り替え可能な
インターフェース設計になっています（本番移行時に実装予定）。

### 3. パッケージインストール
npm install

### 4. 開発サーバー起動
npm run dev

### 5. ブラウザでアクセス
http://localhost:3000

---

## 🔑 APIキーの取得方法
| サービス | 取得先 |
|---------|--------|
| OpenAI | https://platform.openai.com |
| VoiceText | https://voicetext.jp/webapi |
| Azure OpenAI | Azure Portal |
| Amazon Bedrock | AWS Console |

---

## 🏗 アーキテクチャ
（PDF資料を参照）

---

## 📁 ディレクトリ構成
src/
├── app/          # 画面（5ステップ） + APIルート
├── components/   # UIコンポーネント
├── lib/          # AI・TTS・動画生成ロジック
└── types/        # 共通型定義

---

## ⚠️ 既知の制限事項
- Safari では動画形式（webm）が再生できない場合があります
  → フォールバックモード（PNG+WAV）をご利用ください
- VoiceText は日本語のみ対応しています
- カメラ使用にはHTTPS環境が必要です
  （localhost は HTTP でも動作します）
- 保護者向け大画面は OS ミラーリング運用（別タブでは Zustand 非共有）

---

## 📄 提案資料
[PDF資料リンク or 同リポジトリ内のパス]
```

---

#### 🐙 GitHub リポジトリ公開（午後）

```
公開前チェックリスト：

セキュリティ確認
  □ .env.local が .gitignore に含まれているか
  □ APIキーがコード内にハードコードされていないか
  □ console.log にAPIキーや個人情報が出力されていないか
  □ .env.local.example に実際のキーが入っていないか

コード品質確認
  □ npm run build がエラーなく通るか
  □ TypeScript の型エラーがゼロか
       npm run typecheck
  □ 不要なコメント・TODO が残っていないか
  □ デバッグ用のconsole.logが残っていないか

リポジトリ設定
  □ リポジトリを public に設定
  □ リポジトリの Description を記入
       「ABC夏イベント技術施策提案 - AI未来ニュースキャスター体験」
  □ Topicsを設定
       nextjs, typescript, openai, aws-bedrock, shadcn-ui
  □ README.md がトップページに表示されているか
  □ デモURLがREADME に記載されているか
```

---

#### 🚀 Vercel 本番デプロイ最終確認

```
Vercel 設定確認：

  □ 環境変数が Vercel の Environment Variables に設定されているか
       AI_PROVIDER
       OPENAI_API_KEY
       VOICETEXT_API_KEY
       BLOB_READ_WRITE_TOKEN
       VIDEO_MODE
       など

  □ vercel.json のヘッダー設定が正しいか
       ffmpeg.wasm採用の場合：
         COOP / COEP ヘッダーが設定されているか

  □ 本番URLで全シナリオが通るか
       ローカルと同じテストシナリオを本番URLで再実施

  □ Vercel の Function Logs でエラーが出ていないか

  □ maxDuration の設定が反映されているか
```

---

#### 📄 PDF資料の最終調整

```
Day 1〜3 の実装結果を受けて以下を更新：

  □ アーキテクチャ図に VIDEO_MODE の記載を追加
  □ 採用した動画生成方針（A/B/C）を明記
  □ QR コード（Vercel Blob URL）の仕組みを明記
  □ 保護者向け大画面は OS ミラーリング運用と記載
  □ Azure/Bedrock はスタブである旨を明記
  □ プロトタイプ概要の「実装した機能」を実態に合わせる
  □ デモURLを記載
  □ GitHubリポジトリURLを記載
```

---

### Day 4 完了定義

```
✅ 全テストシナリオがパスしている
✅ P0・P1バグがゼロ
✅ TypeScriptエラーがゼロ（npm run build 成功）
✅ エラー時に子供向けのフレンドリーなメッセージが出る
✅ 全画面でアニメーションが統一されている
✅ README.md が完成しデモURLが動いている
✅ .env.local が .gitignore に入っている
✅ APIキーがコードに露出していない
✅ GitHubリポジトリが public で公開されている
✅ Vercel本番デプロイが成功している
✅ PDF資料にGitHub・デモURLが記載されている
```

---

### 4日間全体スケジュール・最終確認

```
Day 1  ✅ 基盤・デザインシステム・入力・撮影・プレースホルダー・API骨格
Day 2  ✅ OpenAI + TTS・デフォルト原稿・生成待機・プレビュー画面
Day 3  ✅ Canvas合成・動画生成・Vercel Blob・結果画面
Day 4  ✅ テスト・バグ修正・UX仕上げ（カメラ演出含む）・README・GitHub公開

提出物：
  ├── GitHub public リポジトリ URL
  ├── Vercel デプロイURL（動くデモ）
  └── PDF提案資料
```