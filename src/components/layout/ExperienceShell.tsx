import type { ReactNode } from "react";

import type { ExperienceStep } from "@/types";

import { ABCLogo } from "./ABCLogo";
import { StepIndicator } from "./StepIndicator";

const CONTENT_MAX_WIDTH_CLASS = {
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
} as const;

type ContentMaxWidth = keyof typeof CONTENT_MAX_WIDTH_CLASS;

type ExperienceShellProps = {
  currentStep: ExperienceStep;
  children: ReactNode;
  /** main コンテンツの最大幅（デフォルト: lg = 512px） */
  contentMaxWidth?: ContentMaxWidth;
};

export function ExperienceShell({
  currentStep,
  children,
  contentMaxWidth = "lg",
}: ExperienceShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-abc-white">
      <ABCLogo />
      <StepIndicator currentStep={currentStep} />
      <main
        className={`mx-auto flex w-full ${CONTENT_MAX_WIDTH_CLASS[contentMaxWidth]} flex-1 flex-col px-4 py-6`}
      >
        {children}
      </main>
    </div>
  );
}
