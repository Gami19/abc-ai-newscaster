"use client";

import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";
import { ResultView } from "@/components/result/ResultView";

export default function ResultPage() {
  return (
    <SessionGuard require="userVoiceVideoBlob">
      <ExperienceShell currentStep={6}>
        <ResultView />
      </ExperienceShell>
    </SessionGuard>
  );
}
