import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";
import { RehearsalView } from "@/components/rehearsal/RehearsalView";

export default function RehearsalPage() {
  return (
    <SessionGuard require="scriptText">
      <ExperienceShell currentStep={4}>
        <RehearsalView />
      </ExperienceShell>
    </SessionGuard>
  );
}
