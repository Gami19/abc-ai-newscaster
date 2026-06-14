"use client";

import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";
import { ResultView } from "@/components/result/ResultView";

export default function ResultPage() {
  return (
    <SessionGuard require="resultReady">
      <ExperienceShell currentStep={5}>
        <ResultView />
      </ExperienceShell>
    </SessionGuard>
  );
}
