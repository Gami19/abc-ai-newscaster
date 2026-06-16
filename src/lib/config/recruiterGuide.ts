export type RecruiterGuideSection = {
  title: string;
  items: readonly string[];
};

export type RecruiterGuideConfig = {
  title: string;
  description: string;
  sections: readonly RecruiterGuideSection[];
  dismissButtonLabel: string;
  storageKey: string;
};

export const RECRUITER_GUIDE = {
  title: "操作ガイド",
  description:
    "この画面は審査・デモ用の案内です。体験者にはモーダルを閉じてから操作してもらってください。",
  sections: [
    {
      title: "体験の流れ（全6ステップ・約3分）",
      items: [
        "STEP 1 入力: 名前・学年・夢・好きなことを入力",
        "STEP 2 撮影: カメラ・マイク権限を許可し写真を撮影",
        "STEP 3 生成: AI が未来ニュース原稿を生成",
        "STEP 4 練習: TTS お手本でリハーサル",
        "STEP 5 収録: solo / together モードで本番収録",
        "STEP 6 完成: 動画をダウンロード",
      ],
    },
    {
      title: "デモ時の注意",
      items: [
        "推奨ブラウザ: Google Chrome 最新版",
        "カメラ・マイク付き PC が必要です",
        "API キーなしでも DEMO_MOCK 設定でフロー通過可能（README 参照）",
        "Safari では波形表示が不安定な場合があります",
      ],
    },
  ],
  dismissButtonLabel: "体験を開始する",
  storageKey: "abc-newscaster-recruiter-guide-dismissed",
} as const satisfies RecruiterGuideConfig;
