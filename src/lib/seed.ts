/**
 * Returns a zero-based index for today's daily challenge.
 * Same value for all users on the same calendar day (UTC).
 * Changes at midnight UTC.
 */
export function getDailyIndex(poolSize: number): number {
  const now = new Date();
  const seed =
    now.getUTCFullYear() * 10000 +
    (now.getUTCMonth() + 1) * 100 +
    now.getUTCDate();
  return seed % poolSize;
}

/** Day number since the site launched (2026-05-14). */
export function getDayNumber(): number {
  const launch = new Date("2026-05-14T00:00:00Z");
  const now = new Date();
  const diff = now.getTime() - launch.getTime();
  return Math.max(1, Math.floor(diff / 86_400_000) + 1);
}

/** Human-readable date label, e.g. "Wed 14 May 2026" */
export function getDateLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
