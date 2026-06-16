export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

export function easeInCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * x;
}

export function easeOutBounce(t: number): number {
  const x = clamp(t, 0, 1);
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  }
  if (x < 2 / d1) {
    const v = x - 1.5 / d1;
    return n1 * v * v + 0.75;
  }
  if (x < 2.5 / d1) {
    const v = x - 2.25 / d1;
    return n1 * v * v + 0.9375;
  }
  const v = x - 2.625 / d1;
  return n1 * v * v + 0.984375;
}
