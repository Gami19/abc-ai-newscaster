## Day 3 実装計画

### 目標

```
├── ⚠️ ffmpeg.wasm × Next.js 15 検証・判断（最優先）
├── Canvas合成実装（ニューステンプレ＋顔写真）
├── 動画生成実装（3段階フォールバック戦略）
├── STEP 4（プレビュー）にCanvas合成を統合
└── STEP 5（結果・QR）画面の完成
```

---

### ⚠️ Day 3 最初の判断ポイント（午前一番・30分タイムボックス）

Day 3 は最初に ffmpeg.wasm の動作検証を行い、  
**30分以内** に実装方針を確定させる（迷わない）。

```
Step 1（15分）
  next.config.ts に COOP/COEP ヘッダーを設定
  npm run dev で react-webcam が動くか確認
    ✅ 動く → Step 2 へ
    ❌ 動かない → 即 方針B（MediaRecorder）に切替

Step 2（15分）
  ffmpeg.wasm で最小テスト（PNG + 無音 WAV → mp4）
    ✅ 動く → 方針A確定
    ❌ 動かない → 方針B（MediaRecorder）に切替

Step 3（方針Bの場合）
  MediaRecorder で webm 生成テスト
    ✅ 動く → 方針B確定
    ❌ 動かない → 方針C（PNG + WAV 別DL）

優先順位：方針A（ffmpeg.wasm）→ 方針B（MediaRecorder）→ 方針C（フォールバック）
```

---

### 3段階フォールバック戦略

#### 方針A：ffmpeg.wasm（Primary）

```
メリット：
  ├── mp4形式で出力（全デバイス対応）
  ├── 音声と画像を確実に合成
  └── 本番設計に最も近い

リスク：
  ├── SharedArrayBuffer が必要
  │     → COOP / COEP ヘッダー設定が必須
  ├── COEP ヘッダーが外部リソースをブロックする可能性
  │     → Google Fonts など外部CDNが読み込めなくなる
  └── react-webcam との競合可能性
        → getUserMedia自体はローカルAPIなので
          基本は大丈夫だが検証必須

必要な設定：
  next.config.ts
  └── headers()に以下を追加
        Cross-Origin-Opener-Policy  : same-origin
        Cross-Origin-Embedder-Policy: require-corp

  vercel.json
  └── 同じヘッダーをVercelデプロイ用に設定

検証手順：
  1. ヘッダーを設定してデプロイ
  2. react-webcam（カメラ画面）が動くか確認
  3. ffmpeg.wasm で簡単なテスト変換が動くか確認
  4. 両方OKなら方針A確定
  5. どちらか失敗なら方針Bへ
```

---

#### 方針B：MediaRecorder API（Alternative）

```
メリット：
  ├── SharedArrayBuffer 不要
  │     → COEP / COOP ヘッダー設定が不要
  ├── react-webcam との競合リスクゼロ
  └── 完全ネイティブブラウザAPIで追加ライブラリ不要

仕組み：
  1. Canvas に合成画像を描画したまま保持
  2. canvas.captureStream() でCanvasの映像ストリームを取得
  3. audioBlob → MediaSource / AudioContext で音声ストリームを取得
  4. 映像 + 音声ストリームを MediaStream に合成
  5. MediaRecorder で録画開始
  6. 音声の再生時間分だけ録画
  7. 録画停止 → Blob（webm形式）を取得

デメリット：
  ├── 出力形式がwebm（Safariで再生できない場合あり）
  │     → プロトタイプ提出なので許容範囲
  └── 録画が実時間かかる（音声が30秒なら30秒待つ）
        → 待機アニメーションで対応
```

---

#### 方針C：PNG + WAV 別々にDL（最終フォールバック）

```
メリット：
  ├── 実装リスクゼロ
  ├── 動作保証が100%
  └── Canvas合成・音声合成の成果は確実に届けられる

仕組み：
  - Canvas合成画像 → PNG としてDL
  - audioBlob（wav）→ WAV としてDL
  - QR は Vercel Blob 公開URL（アップロード成功時）または
    「この端末でDLしてね」案内（Blob 失敗時）

UI上の対応：
  「画像と音声を保存してね！」と案内
  → 体験価値・審査へのアピールは損なわない
  → むしろ「フォールバックまで設計している」ことが評価点になる
```

---

### タスク一覧

---

#### 🖼 Canvas合成実装（午前）

##### Canvas合成の仕様

```
合成する要素（重ね順）：

  レイヤー1（最背面）
  └── news_template.png
        サイズ：1280 × 720px（16:9）
        内容：ABCニュース風の背景デザイン

  レイヤー2
  └── 顔写真（photoBase64・JPEG quality 0.92）
        位置：右上エリア
        サイズ：240 × 240px
        形状：角丸四角形（borderRadius相当）
        枠：abc-orange 4px

  レイヤー3
  └── 日時テキスト
        内容：「2035年 〇月 〇日（〇）」
        位置：左上
        色：ホワイト
        フォント：Boldゴシック系

  レイヤー4
  └── 原稿テキスト（テロップ風）
        位置：下部テロップエリア
        背景：半透明 abc-charcoal
        色：ホワイト
        自動改行処理が必要

  レイヤー5（最前面）
  └── 「ABC NEWS 2035」テキスト
        位置：左上
        色：ホワイト
        フォント：大きめBold

Canvas解像度：1280 × 720px（16:9）固定
```

##### `components/canvas/NewsCanvas.tsx` の設計

```
Props：
  photoBase64 : string
  scriptText  : string
  onReady     : (blob: Blob) => void   ← 合成完了時にBlobを返す

処理フロー：
  1. useRef で <canvas> を参照
  2. useEffect で合成処理を実行
  3. new Image() で news_template.png をロード
  4. ctx.drawImage() で背景を描画
  5. new Image() で photoBase64 をロード
  6. 角丸クリップパスを設定して顔写真を描画
  7. テキスト描画（日時・テロップ・ロゴ）
  8. canvas.toBlob("image/jpeg", 0.92) でBlobを取得
  9. onReady(blob) を呼び出し
  10. 合成画像Blobを Zustand に保存（canvasImageBlob 等）

表示：
  <canvas> はプレビュー用に画面に表示
  → 審査員に「合成結果」を見せる
```

##### ニューステンプレート画像の作成方針

```
public/templates/news_template.png の仕様：

  ┌─────────────────────────────────────┐  720px
  │  ABC NEWS 2035          [顔写真枠]  │
  │                                     │
  │  （abc-charcoal 背景）               │
  │  グリッド線・光の演出など             │
  │                                     │
  │  ┌─────────────────────────────┐   │
  │  │ テロップ背景（半透明 charcoal） │   │
  │  └─────────────────────────────┘   │
  └─────────────────────────────────────┘
  1280px

作成方法：
  Day 1 仮画像を Figma / Canva で本番テンプレに差し替え
  → ABCカラー（orange / charcoal）でデザイン
  → PNGでエクスポート → public/templates/ に配置
```

---

#### 🎬 動画生成実装（午後前半）

##### `lib/video/` ディレクトリ構成

```
lib/video/
  ├── index.ts          # 方針A/B/Cの振り分け
  ├── ffmpegVideo.ts    # 方針A：ffmpeg.wasm実装
  ├── mediaRecorder.ts  # 方針B：MediaRecorder実装
  └── fallback.ts       # 方針C：PNG+WAV別DL
```

##### `lib/video/index.ts`

```
設計：
  ├── 環境変数 VIDEO_MODE = "ffmpeg" | "mediarecorder" | "fallback"
  │     → Day 3 朝の検証結果を受けて設定
  └── generateVideo() をexport
        内部で VIDEO_MODE に応じて振り分け

VideoOutput 型：
  方針A/B：{ type: "video", blob: Blob, mimeType: string }
  方針C  ：{ type: "fallback", imageBlob: Blob, audioBlob: Blob }
```

##### `lib/video/ffmpegVideo.ts`（方針A）

```
処理フロー：
  1. @ffmpeg/ffmpeg をdynamic importで読み込み
       → バンドルサイズを抑えるため遅延ロード

  2. FFmpeg インスタンスを生成・ロード

  3. canvasBlob → Uint8Array に変換
       → ffmpeg.writeFile("frame.png", data)

  4. audioBlob（wav）→ Uint8Array に変換
       → ffmpeg.writeFile("audio.wav", data)

  5. ffmpegコマンド実行
       -loop 1          : 静止画をループ
       -i frame.png     : 画像入力
       -i audio.wav     : 音声入力
       -shortest        : 音声の長さに合わせて切る
       -c:v libx264     : 映像コーデック
       -c:a aac         : 音声コーデック
       -pix_fmt yuv420p : 互換性確保
       output.mp4

  6. ffmpeg.readFile("output.mp4") → Uint8Array
       → new Blob([data], { type: "video/mp4" })

  7. Blob を返却
```

##### `lib/video/mediaRecorder.ts`（方針B）

```
処理フロー：
  1. <canvas> 要素の参照を受け取る
       → canvas.captureStream(30) で映像ストリーム取得（30fps）

  2. audioBlob → AudioContext でデコード
       → createBufferSource() でバッファ再生
       → MediaStreamAudioDestinationNode で音声ストリーム取得

  3. new MediaStream([videoTrack, audioTrack]) で合成

  4. new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" })

  5. recorder.start()
     audio.play()    ← 同時に開始

  6. 音声終了イベントで recorder.stop()

  7. recorder.ondataavailable で Blob を収集
     → new Blob(chunks, { type: "video/webm" })

  8. Blob を返却
```

---

#### 🎨 STEP 4（プレビュー）更新（午後）

##### 動画生成タイミング（確定フロー）

```
/preview で動画生成 → 完了後 /result に遷移

理由：
  /result はゴール画面（紙吹雪・QR・DL）専用
  ローディングを /result に混在させない

確定フロー：
  /preview
    └── 「どうがをつくる！」ボタン押下
          ↓
        ボタンがローディング状態に変化
        「どうがをせいさく中...」
          ↓
        generateVideo() 実行（10〜30秒）
          ↓
        成功 → videoBlob → Zustand
             → Vercel Blob にアップロード → blobUrl 取得
             → /result に遷移
        失敗 → /preview 内にエラー表示・リトライ可能

  /result
    └── マウント時に videoBlob / blobUrl が必ず存在する前提
          → 紙吹雪・QR・DL のみ（エラー状態を持たない）
```

##### Day 2 から追加する内容

```
追加要素：
  ├── NewsCanvas.tsx を組み込む
  │     → Canvas合成プレビューを画面中央に表示
  │
  ├── 動画生成処理を組み込む
  │     → 「どうがをつくる！」ボタン押下時に
  │        lib/video/index.ts の generateVideo() を呼び出し
  │     → 成功後 Vercel Blob にアップロード
  │
  └── 生成中のローディングUI
        → 方針Bの場合は実時間かかる旨を表示
           「音声を録音中...（あと〇秒）」
        → 失敗時は /preview 内でリトライ UI

更新後のUI：
  ┌─────────────────────────────────────┐
  │  ABCロゴ                              │
  │  ステップインジケーター 4/5            │
  ├─────────────────────────────────────┤
  │                                       │
  │  「きみの2035年ニュースができたよ！」   │
  │                                       │
  │  ┌───────────────────────────────┐  │
  │  │                               │  │
  │  │   <canvas>                    │  │  ← Canvas合成プレビュー
  │  │   ニューステンプレ＋顔写真      │  │    （1280×720 → 縮小表示）
  │  │   ＋テロップテキスト           │  │
  │  │                               │  │
  │  └───────────────────────────────┘  │
  │                                       │
  │  ┌───────────────────────────────┐  │
  │  │  🔊  ニュースを読み上げる      │  │
  │  └───────────────────────────────┘  │
  │                                       │
  │  ┌───────────────────────────────┐  │
  │  │  🎬  どうがをつくる！          │  │  ← 押すと /preview 内で動画生成
  │  └───────────────────────────────┘  │     → 完了後 /result へ遷移
  └─────────────────────────────────────┘
```

---

#### ☁️ Vercel Blob アップロード

```
追加パッケージ：
  @vercel/blob

環境変数（.env.local.example に追記）：
  BLOB_READ_WRITE_TOKEN=

API ルート：
  app/api/upload/route.ts
    POST：videoBlob を受け取り Vercel Blob にアップロード
    Response：{ url: string }  // 公開URL

QR コードの中身：
  https://xxxx.public.blob.vercel-storage.com/video-{nanoid}.mp4
  → 別端末（保護者スマホ）でスキャン → ブラウザで再生 or DL

フォールバック（Blob アップロード失敗時）：
  QR の代わりに「この端末でDLしてね」案内
  + ブラウザ直接 DL ボタンを表示
```

---

#### 🎨 STEP 5：結果・QRページ（`/result`）

##### 処理設計

```
画面マウント時：
  1. Zustand から videoBlob / blobUrl を取得
       → videoBlob が null → / にリダイレクト

  2. videoBlob → URL.createObjectURL()
       → <video> タグで自動再生プレビュー

  3. qrcode.react で QRコード生成
       → blobUrl（Vercel Blob 公開URL）を埋め込む
       → Blob 失敗時：QR 非表示 + 「この端末でDLしてね」案内

  4. ダウンロードリンク生成
       <a href={blobUrl ?? localBlobUrl} download="abc-news-2035.mp4">
```

##### UI設計

```
レイアウト：
  ┌─────────────────────────────────────┐
  │  ABCロゴ                              │
  │  ステップインジケーター 5/5 ✅         │
  ├─────────────────────────────────────┤
  │                                       │
  │  🎉「きみの未来ニュース、完成！」       │  ← 大きく祝福演出
  │      Framer Motion で紙吹雪アニメ      │
  │                                       │
  │  ┌───────────────────────────────┐  │
  │  │                               │  │
  │  │   <video autoplay loop>       │  │  ← 生成動画プレビュー
  │  │   （mp4 or webm）             │  │
  │  │                               │  │
  │  └───────────────────────────────┘  │
  │                                       │
  │  ┌──────────────┐  ┌──────────────┐ │
  │  │              │  │              │ │
  │  │  QRコード     │  │  ダウンロード  │ │
  │  │  （Blob URL） │  │  ボタン       │ │
  │  │              │  │              │ │
  │  └──────────────┘  └──────────────┘ │
  │                                       │
  │  ─────────────────────────────────  │
  │  保護者向けメッセージ                   │
  │  「QRコードをよみとって               │
  │   どうがをほぞんしてね！」              │
  │                                       │
  │  ┌───────────────────────────────┐  │
  │  │  🔄  つぎのひとへ（リセット）   │  │  ← Zustand reset() → /
  │  └───────────────────────────────┘  │
  └─────────────────────────────────────┘

UXの工夫：
  ├── 紙吹雪アニメーションは Day 4 で実装（ここでは枠のみ）
  ├── 動画は自動ループ再生
  │     → 保護者がQRを読み取る間に子供が楽しめる
  ├── QRと「ダウンロード」を並列配置
  │     → Blob URL（他端末）と同端末 DL の両方に対応
  ├── 「つぎのひとへ」でZustandをreset()
  │     → プライバシー保護（次の体験者に前の人の情報が残らない）
  └── リセット時にblobURLをrevoke
        → URL.revokeObjectURL() でメモリ解放
```

---

#### 方針C（フォールバック）のUI対応

```
videoBlob が { type: "fallback" } の場合：

  動画プレビューの代わりに：
  ┌─────────────────────────────────────┐
  │  ┌──────────────────────────────┐  │
  │  │  🖼  ニュース画像             │  │  ← Canvas合成画像プレビュー
  │  └──────────────────────────────┘  │
  │                                     │
  │  [ 🖼 画像をほぞんする ]              │  ← PNG download
  │  [ 🔊 おとをほぞんする ]              │  ← WAV download
  └─────────────────────────────────────┘

設計の意図：
  → フォールバックでも体験価値（顔合成・AI原稿・音声）は届く
  → 審査員に「リスク管理まで設計した」ことをアピール
```

---

### Day 3 完了定義

```
✅ ffmpeg.wasm or MediaRecorder or フォールバック
      いずれかの方針で動画（または画像+音声）生成が動く
✅ Canvas合成でニューステンプレ＋顔写真が合成できる
✅ /preview にCanvas合成プレビューが表示される
✅ /result でコンテンツ（動画 or 画像+音声）がDLできる
✅ /preview で「どうがをつくる！」→ 動画生成 → /result 遷移が動く
✅ Vercel Blob アップロード + QR（Blob URL）が動く
✅ Blob 失敗時の同端末 DL フォールバックが動く
✅ 「つぎのひとへ」で Zustand がリセットされ / に戻る
✅ blobURL のメモリ解放が実装されている
✅ Vercel に最新状態がデプロイされている
✅ VIDEO_MODE 環境変数が .env.local.example に追記されている
✅ BLOB_READ_WRITE_TOKEN が .env.local.example に追記されている
```

---

### Day 3 終了時点のデータフロー（全体完成）

```
/ (入力)
  → userInput → Zustand
        ↓
/camera (撮影)
  → photoBase64 → Zustand
        ↓
/generating (AI生成)
  → scriptText → Zustand
  → audioBlob  → Zustand
        ↓
/preview (プレビュー) ★Day3でCanvas + 動画生成まで完成
  → NewsCanvas で合成プレビュー
  → 音声再生
  → 「どうがをつくる！」
      → generateVideo() → videoBlob → Zustand
      → Vercel Blob アップロード → blobUrl
        ↓
/result (結果・QR) ★Day3で完成（成功体験専用画面）
  → 動画プレビュー再生
  → QRコード（Blob URL）
  → ダウンロード
  → 「つぎのひとへ」→ reset() → /
```

---