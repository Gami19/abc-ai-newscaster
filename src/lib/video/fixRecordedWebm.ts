import fixWebmDuration from "fix-webm-duration";

/** MediaRecorder の WebM に duration メタデータを付与してシークバーを正しくする */
export async function fixRecordedWebm(
  blob: Blob,
  durationMs: number
): Promise<Blob> {
  if (durationMs <= 0 || !blob.size) {
    return blob;
  }

  try {
    const fixed = await fixWebmDuration(blob, durationMs, { logger: false });
    return fixed instanceof Blob ? fixed : blob;
  } catch (err) {
    console.warn("[fixRecordedWebm] duration patch failed", err);
    return blob;
  }
}
