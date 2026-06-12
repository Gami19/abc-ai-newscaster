"use client";

import { GeneratingView } from "@/components/generating/GeneratingView";
import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";

export default function GeneratingPage() {
  return (
    <SessionGuard require="photoBase64">
      <ExperienceShell currentStep={3}>
        <GeneratingView />
      </ExperienceShell>
    </SessionGuard>
  );
}
