import OpenAI from "openai";
import { NextResponse } from "next/server";

import { generateScript } from "@/lib/ai";
import { validateGenerateBody } from "@/lib/validation/userInput";
import type { ApiErrorResponse, GenerateScriptOutput } from "@/types";

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

    const { script, category } = await generateScript(result.data);

    return NextResponse.json<GenerateScriptOutput>({ script, category });
  } catch (error) {
    if (error instanceof OpenAI.APIError && error.status === 429) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "リクエストが多すぎます。しばらく待ってからもう一度お試しください" },
        { status: 429 }
      );
    }

    console.error("[api/generate]", error);

    return NextResponse.json<ApiErrorResponse>(
      { error: "原稿の生成に失敗しました" },
      { status: 500 }
    );
  }
}
