import type { UserInput } from "@/types";

export function buildDefaultScript(input: UserInput): string {
  return `こんばんは。キャスターの${input.name}です。
今日もおかえりなさい。
本日のトップニュースです。
2035年、${input.name}さんの夢である${input.dream}が
大きな成果を上げました。
専門家によると、${input.name}さんが
いつも楽しんでいる${input.hobby}と、
${input.effort}が
その成功のカギになったそうです。
${input.name}さん、これからもがんばってね。
以上、ABCニュースでお伝えしました。
また明日も、おかえりをお待ちしています。`;
}
