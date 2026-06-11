"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";
import type { ExperienceStep, SessionGuardField } from "@/types";

type PlaceholderPageProps = {
  currentStep: ExperienceStep;
  require: SessionGuardField;
  title: string;
  message: string;
};

function PlaceholderPage({
  currentStep,
  require,
  title,
  message,
}: PlaceholderPageProps) {
  return (
    <SessionGuard require={require}>
      <ExperienceShell currentStep={currentStep}>
        <Card className="border-border shadow-sm">
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm font-medium text-abc-gray">工事中</p>
            <h1 className="text-2xl font-bold text-abc-charcoal">{title}</h1>
            <p className="text-base text-abc-charcoal">{message}</p>
          </CardContent>
        </Card>
      </ExperienceShell>
    </SessionGuard>
  );
}

export default function GeneratingPage() {
  return (
    <PlaceholderPage
      currentStep={3}
      require="photoBase64"
      title="原稿をつくっているよ"
      message="もう少し待ってね。Day 2 でここに AI 原稿生成が入るよ。"
    />
  );
}
