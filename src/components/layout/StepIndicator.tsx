import { cn } from "@/lib/utils";
import type { ExperienceStep } from "@/types";

const STEPS = [
  { step: 1, label: "入力" },
  { step: 2, label: "撮影" },
  { step: 3, label: "生成" },
  { step: 4, label: "確認" },
  { step: 5, label: "完成" },
] as const;

type StepIndicatorProps = {
  currentStep: ExperienceStep;
};

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav
      aria-label="体験の進捗"
      className="border-b border-border bg-abc-white px-4 py-4"
    >
      <ol className="mx-auto flex max-w-lg items-center justify-between gap-1">
        {STEPS.map(({ step, label }) => {
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <li key={step} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm font-bold text-white",
                  isComplete && "bg-abc-orange",
                  isCurrent && "animate-pulse bg-abc-red",
                  !isComplete && !isCurrent && "bg-abc-gray"
                )}
              >
                {step}
              </span>
              <span className="text-xs text-abc-charcoal">{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
