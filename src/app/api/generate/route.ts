import { NextResponse } from "next/server";

import { validateGenerateBody } from "@/lib/validation/userInput";
import type { ApiErrorResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = validateGenerateBody(body);

    if (!result.success) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "入力値が不正です" },
        { status: 400 }
      );
    }

    // TODO: Day 2 - lib/ai/index.ts generateScript()
    return NextResponse.json<ApiErrorResponse>(
      { error: "原稿生成は未実装です" },
      { status: 501 }
    );
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "入力値が不正です" },
      { status: 400 }
    );
  }
}
