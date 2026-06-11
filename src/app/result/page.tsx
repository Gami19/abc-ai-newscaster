"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";

export default function ResultPage() {
  return (
    <SessionGuard require="videoBlob">
      <ExperienceShell currentStep={5}>
        <Card className="border-border shadow-sm">
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm font-medium text-abc-gray">工事中</p>
            <h1 className="text-2xl font-bold text-abc-charcoal">
              完成！
            </h1>
            <p className="text-base text-abc-charcoal">
              Day 3 でここに動画再生と QR コードが入るよ。
            </p>
          </CardContent>
        </Card>
      </ExperienceShell>
    </SessionGuard>
  );
}
