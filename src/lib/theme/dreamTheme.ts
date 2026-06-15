import type { DreamCategory } from "@/types";

export type DreamTheme = {
  mainIcon: string;
  subIcons: string[];
  accentColor: string;
  bgTint: string;
};

const DREAM_CATEGORIES: DreamCategory[] = [
  "sports",
  "space",
  "creative",
  "care",
  "food",
  "default",
];

const CATEGORY_KEYWORDS: Record<Exclude<DreamCategory, "default">, string[]> = {
  sports: [
    "野球",
    "サッカー",
    "水泳",
    "バスケ",
    "テニス",
    "スポーツ",
    "選手",
    "アスリート",
  ],
  space: ["宇宙", "飛行士", "ロケット", "惑星", "科学", "博士", "研究"],
  creative: [
    "絵",
    "音楽",
    "ゲーム",
    "デザイナー",
    "歌手",
    "俳優",
    "クリエイター",
    "アニメ",
  ],
  care: [
    "医者",
    "看護",
    "先生",
    "保育",
    "福祉",
    "警察",
    "消防",
    "人を助ける",
  ],
  food: ["料理", "パティシエ", "シェフ", "ラーメン", "パン", "スイーツ"],
};

function pickSportsIcon(dream: string): string {
  if (/野球|バッター|ピッチャー/.test(dream)) return "⚾";
  if (/サッカー|フットボール/.test(dream)) return "⚽";
  if (/バスケ|バスケット/.test(dream)) return "🏀";
  return "🏆";
}

function pickCreativeIcon(dream: string): string {
  if (/音楽|歌手|歌/.test(dream)) return "🎤";
  if (/ゲーム/.test(dream)) return "🎮";
  return "🎨";
}

function pickCareIcon(dream: string): string {
  if (/先生|教師|保育/.test(dream)) return "👨‍🏫";
  return "🏥";
}

function pickFoodIcon(dream: string): string {
  if (/ラーメン|麺/.test(dream)) return "🍜";
  if (/パン|ベーカリー/.test(dream)) return "🍞";
  if (/パティシエ|ケーキ|スイーツ/.test(dream)) return "🍰";
  return "👨‍🍳";
}

export function isDreamCategory(value: string): value is DreamCategory {
  return DREAM_CATEGORIES.includes(value as DreamCategory);
}

export function detectCategory(dream: string): DreamCategory {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Exclude<DreamCategory, "default">,
    string[],
  ][]) {
    if (keywords.some((keyword) => dream.includes(keyword))) {
      return category;
    }
  }
  return "default";
}

export function getDreamTheme(
  category: DreamCategory,
  dream = ""
): DreamTheme {
  switch (category) {
    case "sports":
      return {
        mainIcon: pickSportsIcon(dream),
        subIcons: ["🏆", "🥇", "⭐", "🎉"],
        accentColor: "#4CAF50",
        bgTint: "rgba(76, 175, 80, 0.1)",
      };
    case "space":
      return {
        mainIcon: "🚀",
        subIcons: ["🌟", "🪐", "⭐", "🌙", "✨"],
        accentColor: "#7C4DFF",
        bgTint: "rgba(124, 77, 255, 0.1)",
      };
    case "creative":
      return {
        mainIcon: pickCreativeIcon(dream),
        subIcons: ["🎵", "🌈", "✨", "💫", "🎊"],
        accentColor: "#E91E63",
        bgTint: "rgba(233, 30, 99, 0.1)",
      };
    case "care":
      return {
        mainIcon: pickCareIcon(dream),
        subIcons: ["❤️", "🌸", "✨", "💊", "🌟"],
        accentColor: "#F44336",
        bgTint: "rgba(244, 67, 54, 0.08)",
      };
    case "food":
      return {
        mainIcon: pickFoodIcon(dream),
        subIcons: ["🌟", "✨", "🎊", "💫", "🌈"],
        accentColor: "#FF9800",
        bgTint: "rgba(255, 152, 0, 0.1)",
      };
    default:
      return {
        mainIcon: "🌟",
        subIcons: ["✨", "💫", "⭐", "🎉", "🌈"],
        accentColor: "#FF8C00",
        bgTint: "rgba(255, 140, 0, 0.1)",
      };
  }
}

/** 再描画のたびに同じ配置になるようシード付き疑似乱数 */
export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) | 0;
    return (hash >>> 0) / 4294967296;
  };
}
