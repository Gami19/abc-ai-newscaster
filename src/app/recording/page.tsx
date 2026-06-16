import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { SessionGuard } from "@/components/layout/SessionGuard";
import { RecordingView } from "@/components/recording/RecordingView";

export default function RecordingPage() {
  return (
    <SessionGuard require="scriptText">
      <ExperienceShell currentStep={5} contentMaxWidth="xl">
        <RecordingView />
      </ExperienceShell>
    </SessionGuard>
  );
}
