import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { RecruiterGuideModal } from "@/components/layout/RecruiterGuideModal";
import { InputForm } from "@/components/form/InputForm";

export default function HomePage() {
  return (
    <ExperienceShell currentStep={1}>
      <RecruiterGuideModal />
      <InputForm />
    </ExperienceShell>
  );
}
