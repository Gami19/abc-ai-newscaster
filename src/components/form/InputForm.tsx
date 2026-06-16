"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { GradeSelector } from "@/components/form/GradeSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isUserInputValid,
  validateDreamOrHobby,
  validateGrade,
  validateName,
  validateUserInput,
  type FieldErrors,
} from "@/lib/validation/userInput";
import { useSessionStore } from "@/lib/store/useSessionStore";
import type { GradeValue, UserInput } from "@/types";

const emptyForm: UserInput & { grade: GradeValue | "" } = {
  name: "",
  grade: "",
  dream: "",
  hobby: "",
};

export function InputForm() {
  const router = useRouter();
  const setUserInput = useSessionStore((s) => s.setUserInput);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  const canSubmit = useMemo(() => {
    if (form.grade === "") return false;
    return isUserInputValid({
      name: form.name,
      grade: form.grade,
      dream: form.dream,
      hobby: form.hobby,
    });
  }, [form]);

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => {
    const next = { ...form, [key]: value };
    setForm(next);

    const nextErrors: FieldErrors = { ...errors };

    if (key === "name") {
      nextErrors.name = next.name ? validateName(next.name) : undefined;
    }
    if (key === "grade") {
      nextErrors.grade =
        next.grade !== "" ? validateGrade(next.grade) : undefined;
    }
    if (key === "dream") {
      nextErrors.dream = next.dream
        ? validateDreamOrHobby(next.dream, "将来の夢")
        : undefined;
    }
    if (key === "hobby") {
      nextErrors.hobby = next.hobby
        ? validateDreamOrHobby(next.hobby, "好きなこと")
        : undefined;
    }

    setErrors(nextErrors);
  };

  const handleSubmit = () => {
    if (form.grade === "") {
      setErrors({ grade: "学年を選んでね" });
      return;
    }

    const payload: UserInput = {
      name: form.name,
      grade: form.grade,
      dream: form.dream,
      hobby: form.hobby,
    };

    const result = validateUserInput(payload);
    if (!result.success) {
      setErrors(result.errors as FieldErrors);
      return;
    }

    setUserInput(result.data);
    router.push("/camera");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-border shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <h1 className="text-center text-2xl font-bold text-abc-charcoal">
            きみの news おかえり 2035 をつくろう！
          </h1>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-base text-abc-charcoal">
              ニックネーム
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="なまえ"
              className="h-12 text-lg"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? (
              <p className="text-sm text-abc-red">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-base text-abc-charcoal">学年</Label>
            <GradeSelector
              value={form.grade}
              onChange={(grade) => updateField("grade", grade)}
              error={errors.grade}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dream" className="text-base text-abc-charcoal">
              将来の夢
            </Label>
            <Input
              id="dream"
              value={form.dream}
              onChange={(e) => updateField("dream", e.target.value)}
              placeholder="例：サッカー選手"
              className="h-12 text-lg"
              aria-invalid={Boolean(errors.dream)}
            />
            {errors.dream ? (
              <p className="text-sm text-abc-red">{errors.dream}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hobby" className="text-base text-abc-charcoal">
              好きなこと
            </Label>
            <Input
              id="hobby"
              value={form.hobby}
              onChange={(e) => updateField("hobby", e.target.value)}
              placeholder="例：ゲーム・ラーメン"
              className="h-12 text-lg"
              aria-invalid={Boolean(errors.hobby)}
            />
            {errors.hobby ? (
              <p className="text-sm text-abc-red">{errors.hobby}</p>
            ) : null}
          </div>

          <Button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="h-12 w-full bg-abc-red text-lg text-white hover:bg-abc-red/90 disabled:opacity-50"
          >
            つぎへ →
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
