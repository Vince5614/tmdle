import pool from "@/data/wrorlower-pool.json";
import { getDailyRng, getDayNumber, getBrusselsDayKey } from "@/lib/seed";

export interface WrlMap {
  uid: string;
  name: string;
  /** YYYY-MM-DD the map entered the pool; absent on the launch batch. */
  added?: string;
  src: string;
  wr: number;
  holder: string;
  thumb: string;
  segs: { d: string; o: number; w: number }[];
  sx: number; sy: number; fx: number; fy: number;
  layoutOk: boolean;
}

export const ROUNDS = 10;

// Only maps whose WR ghost rendered into a clean racing line are playable.
// Maps that fell back to the desaturated thumbnail (layoutOk === false) are
// excluded entirely — the game only ever shows real ghost-trace layouts.
const PLAYABLE = (pool as WrlMap[]).filter((m) => m.layoutOk);

/** Same 11-map deck for every player on the same Brussels calendar day. */
export function getDailyDeck(now: Date = new Date()): {
  deck: WrlMap[]; dayNumber: number; dayKey: string;
} {
  const rng = getDailyRng(now);
  const dayKey = getBrusselsDayKey(now);
  // Only maps added before today are eligible: the monthly pool refresh
  // deploys mid-day, and today's deck must not change under players' feet.
  const eligible = PLAYABLE.filter((m) => !m.added || m.added < dayKey);
  const deck = [...eligible].sort(() => rng() - 0.5).slice(0, ROUNDS + 1);
  return { deck, dayNumber: getDayNumber(now), dayKey };
}

/** Random deck for practice mode (different every load). */
export function getPracticeDeck(seed: number): WrlMap[] {
  let a = seed >>> 0;
  const rng = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return [...PLAYABLE].sort(() => rng() - 0.5).slice(0, ROUNDS + 1);
}
