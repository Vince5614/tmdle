// Daily rotation is anchored to European midnight (Europe/Brussels — CET in
// winter, CEST in summer; DST handled automatically by the Intl APIs).
// All functions accept an optional `now` so the boundary logic is testable.

const ZONE = "Europe/Brussels";
const MS_PER_DAY = 86_400_000;
const LAUNCH_KEY = "2026-05-14"; // site launch day (Brussels calendar)

/** "YYYY-MM-DD" for the given instant, as it appears on a clock in Brussels. */
export function getBrusselsDayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function keyToUTC(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Mix the bits of a 32-bit integer so consecutive inputs map to wildly
 * different outputs. Without this, `getDailyIndex` would just walk by +1
 * each day — because the raw YYYYMMDD seed increments by 1 daily, and the
 * map list is sorted by season, so we'd play every season's maps in order.
 *
 * This is the well-known "splitmix32" finalizer used by xoshiro/Murmur3.
 */
function mix32(n: number): number {
  let h = n | 0;
  h = Math.imul(h, 2654435761);
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Returns a zero-based index for today's daily challenge.
 * Same value for all users on the same European calendar day.
 * Changes at midnight in Europe/Brussels (CET/CEST).
 */
export function getDailyIndex(poolSize: number, now: Date = new Date()): number {
  const [year, month, day] = getBrusselsDayKey(now).split("-").map(Number);
  const seed = year * 10000 + month * 100 + day;
  return mix32(seed) % poolSize;
}

/**
 * Day number since the site launched (2026-05-14, European calendar day).
 * Counts whole calendar days in the Europe/Brussels timezone so the day flips
 * at midnight local — not at midnight UTC.
 */
export function getDayNumber(now: Date = new Date()): number {
  // Anchor both dates as UTC midnight of their Brussels calendar day, so the
  // diff in whole days is exact regardless of DST.
  const diff = keyToUTC(getBrusselsDayKey(now)) - keyToUTC(LAUNCH_KEY);
  return Math.max(1, Math.floor(diff / MS_PER_DAY) + 1);
}

/** Deterministic PRNG seeded from the Brussels day key (for daily decks). */
export function getDailyRng(now: Date = new Date()): () => number {
  let a = 0;
  for (const c of getBrusselsDayKey(now)) a = (a * 31 + c.charCodeAt(0)) >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Human-readable date label rendered in European time, e.g. "Fri 16 May 2026". */
export function getDateLabel(now: Date = new Date()): string {
  return now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONE,
  });
}
