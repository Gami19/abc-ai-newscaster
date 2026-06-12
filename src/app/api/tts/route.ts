import { NextResponse } from "next/server";

import { synthesizeSpeech } from "@/lib/tts";
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

    const { audio, contentType } = await synthesizeSpeech(result.data.text);

    return new Response(audio, {
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error("[api/tts]", error);

    return NextResponse.json<ApiErrorResponse>(
      { error: "音声生成に失敗しました" },
      { status: 500 }
    );
  }
}
