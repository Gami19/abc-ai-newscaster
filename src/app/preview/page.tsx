"use client";

import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";
import { PreviewView } from "@/components/preview/PreviewView";

export default function PreviewPage() {
  return (
    <SessionGuard require="scriptText">
      <ExperienceShell currentStep={4}>
        <PreviewView />
      </ExperienceShell>
    </SessionGuard>
  );
}
