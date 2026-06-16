"use client";

import { useEffect, useState } from "react";

/**
 * Blob から object URL を生成する。
 * useMemo + revoke の組み合わせだと React Strict Mode で
 * 無効化済み URL が再利用されるため、useEffect で毎回作り直す。
 */
export function useBlobObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
}
