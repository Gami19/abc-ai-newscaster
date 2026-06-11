"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";

export default function PreviewPage() {
  return (
    <SessionGuard require="scriptText">
      <ExperienceShell currentStep={4}>
        <Card className="border-border shadow-sm">
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm font-medium text-abc-gray">工事中</p>
            <h1 className="text-2xl font-bold text-abc-charcoal">
              ニュースを確認しよう
            </h1>
            <p className="text-base text-abc-charcoal">
              Day 3 でここに原稿確認と動画生成が入るよ。
            </p>
          </CardContent>
        </Card>
      </ExperienceShell>
    </SessionGuard>
  );
}
