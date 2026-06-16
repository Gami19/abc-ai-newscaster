"use client";

import { CameraView } from "@/components/camera/CameraView";
import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";

export default function CameraPage() {
  return (
    <SessionGuard require="userInput">
      <ExperienceShell currentStep={2}>
        <CameraView />
      </ExperienceShell>
    </SessionGuard>
  );
}
