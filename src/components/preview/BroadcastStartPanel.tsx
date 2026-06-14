"use client";

import { Button } from "@/components/ui/button";

type BroadcastStartPanelProps = {
  casterName: string;
  onStart: () => void;
  disabled?: boolean;
};

export function BroadcastStartPanel({
  casterName,
  onStart,
  disabled = false,
}: BroadcastStartPanelProps) {
  return (
    <div className="space-y-4 rounded-lg border border-abc-orange/30 bg-white p-6 text-center shadow-sm">
      <p className="text-xl font-bold text-abc-charcoal sm:text-2xl">
        準備ができたよ！
      </p>
      <p className="text-base leading-relaxed text-abc-charcoal sm:text-lg">
        ボタンをおすと、
        <br />
        <span className="font-bold text-abc-orange">3・2・1</span> のカウントダウンがはじまって、
        <br />
        キャスター<span className="font-bold">{casterName}</span>さんの
        <br />
        <span className="font-bold">news おかえり 2035</span> が放送されるよ！
      </p>
      <p className="text-sm text-abc-gray">
        おうちの人も、いまスマホの準備をしてね
      </p>
      <Button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="h-14 w-full bg-abc-red text-lg text-white hover:bg-abc-red/90 disabled:opacity-70"
      >
        放送をはじめる！
      </Button>
    </div>
  );
}
