"use client";

import { cn } from "@/lib/utils";
import { GRADE_OPTIONS, type GradeValue } from "@/types";

type GradeSelectorProps = {
  value: GradeValue | "";
  onChange: (grade: GradeValue) => void;
  error?: string;
};

export function GradeSelector({ value, onChange, error }: GradeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        {GRADE_OPTIONS.map(({ label, value: gradeValue }) => {
          const isSelected = value === gradeValue;

          return (
            <button
              key={gradeValue}
              type="button"
              onClick={() => onChange(gradeValue)}
              className={cn(
                "min-h-11 rounded-2xl border-2 px-3 py-2 text-base font-medium transition-colors",
                isSelected
                  ? "border-abc-orange bg-abc-orange text-white"
                  : "border-abc-gray text-abc-gray hover:border-abc-orange/60"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-sm text-abc-red">{error}</p> : null}
    </div>
  );
}
