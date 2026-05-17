// Daily rotation is anchored to European midnight (Europe/Brussels — CET in
// winter, CEST in summer; DST handled automatically by the Intl APIs).

const ZONE = "Europe/Brussels";
const MS_PER_DAY = 86_400_000;

/** Returns today's calendar date as it appears on a clock in Brussels. */
function todayInZone(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);

  return { year: get("year"), month: get("month"), day: get("day") };
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
export function getDailyIndex(poolSize: number): number {
  const { year, month, day } = todayInZone();
  const seed = year * 10000 + month * 100 + day;
  return mix32(seed) % poolSize;
}

/**
 * Day number since the site launched (2026-05-14, European calendar day).
 * Counts whole calendar days in the Europe/Brussels timezone so the day flips
 * at midnight local — not at midnight UTC.
 */
export function getDayNumber(): number {
  const { year, month, day } = todayInZone();
  // Construct as UTC midnight to do the diff at a fixed timezone reference.
  // Both `today` and `launch` are anchored the same way (Europe calendar →
  // UTC midnight of that date), so the diff in whole days is correct.
  const today = Date.UTC(year, month - 1, day);
  const launch = Date.UTC(2026, 4, 14); // 2026-05-14
  const diff = today - launch;
  return Math.max(1, Math.floor(diff / MS_PER_DAY) + 1);
}

/** Human-readable date label rendered in European time, e.g. "Fri 16 May 2026". */
export function getDateLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONE,
  });
}
