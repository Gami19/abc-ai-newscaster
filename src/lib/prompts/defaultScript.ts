import type { UserInput } from "@/types";

export function buildDefaultScript(input: UserInput): string {
  return `こんばんは。キャスターの${input.name}です。
2035年のトップニュースです。
${input.name}さんの夢が叶い、
たくさんの人を笑顔にしました。
${input.name}さんはいつも
${input.hobby}を楽しみながら、
${input.dream}に向かってがんばっています。
以上、ABCニュースでお伝えしました。`;
}
