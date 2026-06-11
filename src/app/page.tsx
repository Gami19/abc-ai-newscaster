import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { InputForm } from "@/components/form/InputForm";

export default function HomePage() {
  return (
    <ExperienceShell currentStep={1}>
      <InputForm />
    </ExperienceShell>
  );
}
