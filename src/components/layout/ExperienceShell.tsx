import type { ReactNode } from "react";

import type { ExperienceStep } from "@/types";

import { ABCLogo } from "./ABCLogo";
import { StepIndicator } from "./StepIndicator";

type ExperienceShellProps = {
  currentStep: ExperienceStep;
  children: ReactNode;
};

export function ExperienceShell({ currentStep, children }: ExperienceShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-abc-white">
      <ABCLogo />
      <StepIndicator currentStep={currentStep} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        {children}
      </main>
    </div>
  );
}
