import { NextResponse } from "next/server";

import { validateTtsBody } from "@/lib/validation/userInput";
import type { ApiErrorResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = validateTtsBody(body);

    if (!result.success) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "テキストが空です" },
        { status: 400 }
      );
    }

    // TODO: Day 2 - lib/tts/index.ts synthesizeSpeech()
    return NextResponse.json<ApiErrorResponse>(
      { error: "音声合成は未実装です" },
      { status: 501 }
    );
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "テキストが空です" },
      { status: 400 }
    );
  }
}
