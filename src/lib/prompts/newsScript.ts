import type { GenerateScriptInput } from "@/types";

export const SYSTEM_PROMPT = `あなたは子供向けイベントのニュース原稿ライターです。
明るく前向きで教育的な原稿を書いてください。
暴力・差別・不適切な表現は絶対に含めないでください。
ABCニュースのフォーマットを模倣し、150字以内で書いてください。
原稿はプレーンテキストのみで返してください。JSON形式は使わないでください。`;

export function buildUserPrompt(input: GenerateScriptInput): string {
  return `以下の子供の情報をもとに、2035年のABCニュース原稿を150字以内で生成してください。

名前：${input.name}
学年：${input.grade}
夢：${input.dream}
好きなこと：${input.hobby}

必ず次の形式に従ってください：
- 冒頭は「こんばんは。キャスターの${input.name}です。」で始める
- 2035年の設定を自然に織り込む
- 子供の夢と好きなことを原稿に自然に含める
- 締めは「以上、ABCニュースでお伝えしました。」で終える`;
}
