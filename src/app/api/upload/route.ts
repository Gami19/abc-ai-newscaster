import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import type { ApiErrorResponse, UploadResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Blob ストレージが設定されていません" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "動画ファイルが空です" },
        { status: 400 }
      );
    }

    const extension = file.type.includes("webm") ? "webm" : "mp4";
    const blob = await put(`video-${Date.now()}.${extension}`, file, {
      access: "public",
      token,
    });

    return NextResponse.json<UploadResponse>({ url: blob.url });
  } catch (error) {
    console.error("[api/upload]", error);

    return NextResponse.json<ApiErrorResponse>(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
