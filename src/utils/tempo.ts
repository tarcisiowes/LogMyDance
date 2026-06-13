export const BPM_MIN = 60;
export const BPM_MAX = 180;
const RATE_MIN = 0.25;
const RATE_MAX = 4;

/**
 * Natural tempo of a clip from its step markers (ms). The base beat is the
 * smallest interval between consecutive steps (a single-beat step; a prolonged
 * step spans ~2 beats and falls out naturally). Returns null if < 2 markers.
 */
export function naturalBpm(times: number[]): number | null {
  if (times.length < 2) return null;
  const sorted = [...times].sort((a, b) => a - b);
  let base = Infinity;
  for (let i = 1; i < sorted.length; i += 1) {
    const d = sorted[i] - sorted[i - 1];
    if (d > 0 && d < base) base = d;
  }
  if (!Number.isFinite(base) || base <= 0) return null;
  return 60000 / base;
}

/** Median of the non-null clip BPMs; 120 fallback when none are marked. */
export function medianBpm(bpms: Array<number | null>): number {
  const vals = bpms
    .filter((b): b is number => b != null && b > 0)
    .sort((a, b) => a - b);
  if (vals.length === 0) return 120;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

/** Playback rate to take a clip from its natural BPM to the target BPM. */
export function clipRate(clipBpm: number | null, targetBpm: number): number {
  if (!clipBpm || clipBpm <= 0) return 1;
  const r = targetBpm / clipBpm;
  return Math.min(RATE_MAX, Math.max(RATE_MIN, r));
}

export function clampBpm(bpm: number): number {
  return Math.round(Math.min(BPM_MAX, Math.max(BPM_MIN, bpm)));
}
