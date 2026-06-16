import type { UserInput } from "@/types";

export function buildTickerMessages(input: UserInput): string[] {
  const { name, grade, dream, hobby } = input;

  return [
    `📺 速報：${name}さん、2035年${dream}として活躍中！`,
    `🌟 ${name}選手（${grade}出身）、本日ABCニュースに登場`,
    `✨ 好きな${hobby}が夢への道を開いた！`,
  ];
}

export function buildTickerText(input: UserInput): string {
  return buildTickerMessages(input).join(" ● ");
}
