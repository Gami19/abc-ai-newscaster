import { GRADES, type GenerateRequestBody, type UserInput } from "@/types";

export type FieldErrors = Partial<Record<keyof UserInput, string>>;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: FieldErrors | { text?: string } };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateName(name: string): string | undefined {
  if (name.length < 1) return "名前を入れてね";
  if (name.length > 10) return "10文字以内で入れてね";
  return undefined;
}

export function validateDreamOrHobby(value: string, label: string): string | undefined {
  if (value.length < 1) return `${label}を入れてね`;
  if (value.length > 20) return "20文字以内で入れてね";
  return undefined;
}

export function validateEffort(value: string): string | undefined {
  if (value.length < 1) return "がんばっていることを入れてね";
  if (value.length > 20) return "20文字以内で入れてね";
  return undefined;
}

export function validateGrade(grade: string): string | undefined {
  if (!GRADES.includes(grade as (typeof GRADES)[number])) {
    return "学年を選んでね";
  }
  return undefined;
}

export function validateUserInput(input: UserInput): ValidationResult<UserInput> {
  const errors: FieldErrors = {};

  const nameError = validateName(input.name);
  if (nameError) errors.name = nameError;

  const gradeError = validateGrade(input.grade);
  if (gradeError) errors.grade = gradeError;

  const dreamError = validateDreamOrHobby(input.dream, "将来の夢");
  if (dreamError) errors.dream = dreamError;

  const hobbyError = validateDreamOrHobby(input.hobby, "好きなこと");
  if (hobbyError) errors.hobby = hobbyError;

  const effortError = validateEffort(input.effort);
  if (effortError) errors.effort = effortError;

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: input };
}

export function isUserInputValid(input: UserInput): boolean {
  return validateUserInput(input).success;
}

export function validateGenerateBody(
  body: unknown
): ValidationResult<GenerateRequestBody> {
  if (!body || typeof body !== "object") {
    return { success: false, errors: {} };
  }

  const { name, grade, dream, hobby, effort } = body as Record<string, unknown>;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(grade) ||
    !isNonEmptyString(dream) ||
    !isNonEmptyString(hobby) ||
    !isNonEmptyString(effort)
  ) {
    return { success: false, errors: {} };
  }

  return validateUserInput({ name, grade, dream, hobby, effort });
}

export function validateTtsBody(body: unknown): ValidationResult<{ text: string }> {
  if (!body || typeof body !== "object") {
    return { success: false, errors: { text: "テキストが空です" } };
  }

  const { text } = body as Record<string, unknown>;

  if (!isNonEmptyString(text)) {
    return { success: false, errors: { text: "テキストが空です" } };
  }

  return { success: true, data: { text } };
}
