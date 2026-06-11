## プロトタイプ ↔ 本番構成 対比ドキュメント

---

## 1. なぜプロトタイプでは実装内容を変更したのか

### 変更点の全体対比表

| コンポーネント | 本番構成 | プロトタイプ | 変更理由カテゴリ |
|-------------|---------|------------|---------------|
| バックエンド | FastAPI + AWS Lambda | Vercel API Routes | 🚀 開発速度 |
| 音声合成 | OpenAI TTS | VoiceText (HOYA) | 💰 コスト |
| 動画生成 | ffmpeg (Lambda) | ffmpeg.wasm (ブラウザ) | ⚙️ 環境制約 |
| 動画配信 | S3 + CloudFront | ブラウザ直接DL | 🚀 開発速度 |

---

### 変更理由 1：FastAPI + Lambda → Vercel API Routes

#### 本番でFastAPI + Lambdaを採用する理由

```
本番環境の要件：
  ├── 5万人規模の負荷に耐えるスケーラビリティ
  ├── ffmpegをサーバーサイドで動かすためのコンテナ環境
  ├── Pythonエコシステムで AI / 動画処理を統一
  └── 本格的な運用監視・ログ管理
```

#### プロトタイプでVercel API Routesに変更した理由

```
制約：4日間でプロトタイプを完成させる

Vercel API Routes を選んだ根拠：

  ① デプロイコストがゼロ
       FastAPI + Lambdaは：
         ECRへのコンテナpush
         Lambda関数の設定
         API Gatewayのルーティング設定
         IAMロールの設定
       → これだけで半日以上消費する

       Vercel API Routesは：
         GitへのPushだけで自動デプロイ完了
         → 浮いた時間をUI/UX品質に集中できる

  ② 審査員の動作確認コストを最小化
       Lambda構成だとAWS環境の再現が必要
         → 審査員側でAWS設定が必要になるリスク
       Vercelなら：
         デモURLに飛ぶだけで即確認できる

  ③ 機能的に同等
       /api/generate・/api/tts の処理内容は
       FastAPIでもVercel API Routesでも同一
       → プロトタイプで証明したいロジックに差異なし
```

---

### 変更理由 2：OpenAI TTS → VoiceText (HOYA)

#### 本番でOpenAI TTSを採用する理由

```
本番環境の要件：
  ├── AIプロバイダーをOpenAI / Azure / Bedrockで統一
  │     → 原稿生成とTTSを同一ベンダーで完結できる
  ├── 音声品質の国際水準
  └── SLAによる可用性保証
```

#### プロトタイプでVoiceText (HOYA) に変更した理由

```
  ① コスト面
       OpenAI TTS：
         $15 / 1M characters
         プロトタイプ開発中の試行錯誤で予想外に課金される

       VoiceText (HOYA)：
         完全無料
         → プロトタイプ開発・デモ中の課金リスクゼロ

  ② 日本語特化の品質
       今回のプロトタイプはすべて日本語
       VoiceTextはHOYAの日本語特化エンジン
         → 日本語のナチュラルさはOpenAI TTSと遜色なし

  ③ 機能分離の設計思想に合致
       本設計ではテキスト生成とTTSを
       意図的に別レイヤーに分離している
         → TTSだけをVoiceTextに差し替えても
            システム全体に影響がない
            → この独立性がそのまま移行しやすさの証明になる
```

---

### 変更理由 3：Lambda ffmpeg → ffmpeg.wasm（ブラウザ内）

#### 本番でLambda + ffmpegを採用する理由

```
本番環境の要件：
  ├── 5万人分の動画をサーバーサイドで確実に生成
  ├── mp4形式での出力保証（全デバイス対応）
  ├── 高解像度・高品質な動画出力
  └── クライアントスペックに依存しない安定した生成
```

#### プロトタイプでffmpeg.wasmに変更した理由

```
  ① Lambda + ffmpegのセットアップコストが高い
       Dockerfileの作成
       ffmpegバイナリのコンテナへの組み込み
       ECRへのpush
       Lambdaのメモリ・タイムアウト設定
       → 設定作業だけで1日消費するリスク

  ② ffmpeg.wasmはブラウザ内で完結する
       → Lambdaのインフラが不要
       → 動画生成のロジックは
          ffmpeg.wasm も Lambda ffmpeg も
          ffmpegコマンドの引数は完全に同一
          → プロトタイプで動作確認したコマンドを
             そのまま本番Lambdaに移植できる

  ③ プライバシー観点でむしろ優れている
       顔写真がサーバーに送信されない
         → プロトタイプとしてのセキュリティアピールになる

  ⚠️ リスクとして明記
       ffmpeg.wasm は SharedArrayBuffer が必要
         → COOP / COEP ヘッダー設定が必須
         → 動作しない場合はMediaRecorder APIで代替
         → それも不可の場合はPNG + WAVのフォールバック
```

---

### 変更理由 4：S3 + CloudFront → ブラウザ直接DL

#### 本番でS3 + CloudFrontを採用する理由

```
本番環境の要件：
  ├── 5万人が同時にDLする負荷をエッジで分散
  ├── QRコードによる「後から見返せる」体験
  ├── 署名付きURLによるアクセス制御
  └── 7日後の自動削除によるプライバシー管理
```

#### プロトタイプでブラウザ直接DLに変更した理由

```
  ① S3バケット設定・IAMポリシー・CloudFront設定
       → 審査提出までの時間対効果が低い

  ② QRコードの体験は再現できる
       動画の保存先がS3でもローカルでも
       QRコード生成・表示という体験フローは同一
       → 「QRで持ち帰る」UXの検証は可能

  ③ プロトタイプの目的に合致
       プロトタイプで証明したいのは：
         「AI生成 → 顔写真合成 → 動画化 → 持ち帰り」
         という体験フローの実現可能性
       ストレージの実装詳細は本質ではない
```

---

## 2. プロトタイプ → 本番構成への移行計画

### 移行の基本思想

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│  プロトタイプは「本番の縮小版」ではなく               │
│  「本番と同じロジックの別デプロイ構成」               │
│                                                       │
│  → コアロジック（AI生成・TTS・ffmpeg・Canvas合成）は  │
│     プロトタイプと本番で完全に共通                     │
│  → 変わるのはインフラ層だけ                           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 移行マップ

```
プロトタイプ                          本番
─────────────────────────────────────────────────────────

【バックエンド】
Vercel API Routes                →   FastAPI + AWS Lambda
  app/api/generate/route.ts           api/generate.py
  app/api/tts/route.ts                api/tts.py

  移行コスト：低
  理由：
    route.tsの処理内容をPythonに書き直すだけ
    lib/ai/ lib/tts/ のロジックは設計書として活用

─────────────────────────────────────────────────────────

【TTS】
VoiceText (HOYA)                 →   OpenAI TTS
  lib/tts/voicetext.ts                lib/tts/openai_tts.py

  移行コスト：最小
  理由：
    TTSはlib/tts/に完全に隔離されている
    インターフェース（テキストを受け取り音声を返す）は同一
    呼び出し元のコードを1行も変えずに差し替え可能

─────────────────────────────────────────────────────────

【動画生成】
ffmpeg.wasm（ブラウザ）           →   ffmpeg（Lambda）
  lib/video/ffmpegVideo.ts

  移行コスト：低
  理由：
    ffmpegのコマンド引数は完全に同一
    プロトタイプで検証済みのコマンドをそのまま流用：
      -loop 1 -i frame.png -i audio.wav
      -shortest -c:v libx264 -c:a aac output.mp4
    変わるのは「どこでffmpegを実行するか」だけ

─────────────────────────────────────────────────────────

【動画配信】
ブラウザ直接DL                   →   S3 + CloudFront
  URL.createObjectURL(blob)           presigned URL

  移行コスト：中
  理由：
    S3バケット・IAMポリシー・CloudFrontの設定が必要
    ただしアプリのロジックへの影響は最小
    フロントの変更は「DLリンクのURL生成処理」のみ
```

---

### 移行フェーズ計画

```
Phase 0（現在）：プロトタイプ
─────────────────────────────────────────
構成：Vercel完結 + VoiceText + ffmpeg.wasm
目的：体験フローとコアロジックの実証
期間：4日間（開発）
成果：動くデモ・審査提出

Phase 1：バックエンドのクラウド化
─────────────────────────────────────────
変更内容：
  Vercel API Routes
    → FastAPI + Docker + AWS Lambda (ECR)

作業内容：
  ├── FastAPIプロジェクトの作成
  ├── /api/generate を Python に移植
  ├── /api/tts を Python に移植
  ├── Dockerfileの作成（ffmpeg同梱）
  ├── ECRへのpush
  └── API GatewayのエンドポイントをVercelから変更

影響範囲：
  フロントエンド側の変更はAPIのURLだけ
  → .env.local の BACKEND_URL を差し替えるのみ

期間目安：2〜3日

Phase 2：TTSの差し替え
─────────────────────────────────────────
変更内容：
  VoiceText (HOYA)
    → OpenAI TTS

作業内容：
  ├── FastAPI側に /api/tts の新実装を追加
  │     openai SDK で audio.speech.create()
  └── VoiceText版との切り替えは環境変数で制御
        TTS_PROVIDER=openai | voicetext

影響範囲：
  lib/tts/ 以外に変更なし

期間目安：0.5日

Phase 3：動画生成のサーバーサイド化
─────────────────────────────────────────
変更内容：
  ffmpeg.wasm（ブラウザ）
    → ffmpeg（Lambda）

作業内容：
  ├── Lambdaコンテナに ffmpeg バイナリを同梱済み
  │     （Phase 1のDockerfileで対応）
  ├── /api/video エンドポイントを追加
  │     canvasBlob + audioBlob を受け取り
  │     ffmpegでmp4生成 → S3にアップロード
  │     → 署名付きURLを返す
  └── フロントの変更：
        generateVideo() の呼び出し先を
        ブラウザ処理 → /api/video に差し替え

期間目安：1〜2日

Phase 4：S3 + CloudFront の接続
─────────────────────────────────────────
変更内容：
  ブラウザ直接DL
    → S3署名付きURL → CloudFront配信

作業内容：
  ├── S3バケット作成
  │     ├── パブリックアクセスブロック設定
  │     └── ライフサイクルルール（7日後自動削除）
  ├── CloudFrontディストリビューション作成
  ├── IAMロール設定（LambdaからS3への書き込み権限）
  ├── 署名付きURL生成ロジックをLambdaに実装
  └── QRコードの埋め込みURLを署名付きURLに変更

期間目安：1〜2日

Phase 5：本番負荷テスト
─────────────────────────────────────────
作業内容：
  ├── Lambda同時実行数の設定（20）
  ├── 5台並列シミュレーションの負荷テスト
  ├── CloudFrontキャッシュの動作確認
  └── S3ライフサイクルの動作確認

期間目安：1日
```

---

### 移行コストのまとめ

```
┌──────────────────────────────────────────────────────┐
│                                                        │
│  プロトタイプで変更した4点は                            │
│  全て「インフラ層の差し替え」であり                     │
│  コアロジックへの影響はゼロ                             │
│                                                        │
│  変更点             移行コスト  コアロジックへの影響    │
│  ──────────────────────────────────────────────────  │
│  Vercel→Lambda      低          なし（URLのみ変更）    │
│  VoiceText→OAI TTS  最小        なし（1ファイル差替）  │
│  wasm→Lambda ffmpeg 低          なし（コマンド同一）   │
│  ブラウザDL→S3      中          最小（URL生成のみ）    │
│                                                        │
│  → プロトタイプの4日間で                               │
│     本番移行に必要なロジックの100%が完成している        │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

### 移行後の最終構成（再掲）

```
フロントエンド（変更なし）
  Next.js 15 on Vercel
  └── Zustand・Canvas合成・UI/UX
        ↓ HTTPS
バックエンド（Phase 1〜3 で完成）
  API Gateway
  └── Lambda (FastAPI on Docker)
        ├── /api/generate → GPT-4o / Azure / Bedrock
        ├── /api/tts      → OpenAI TTS
        └── /api/video    → ffmpeg → S3
              ↓
ストレージ・配信（Phase 4 で完成）
  S3（7日自動削除）
  └── CloudFront（エッジ配信）
        └── 署名付きURL → QRコード → ユーザースマホ
```

---