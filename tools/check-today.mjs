// Ad-hoc verification: today's day number, hashed index stability, deck determinism, photo-finish gaps
import { readFileSync } from "node:fs";

const TZ = "Europe/Brussels", LAUNCH = "2026-05-14";
const dayKey = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const keyToUTC = (k) => { const [y, m, d] = k.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const dayNumber = () => Math.max(1, Math.floor((keyToUTC(dayKey()) - keyToUTC(LAUNCH)) / 86400000) + 1);

function mix32(n) { let h = n | 0; h = Math.imul(h, 2654435761); h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16; return h >>> 0; }
const [y, m, d] = dayKey().split("-").map(Number);
const seed = y * 10000 + m * 100 + d;
console.log("Brussels day key:", dayKey(), "| day number:", dayNumber());
console.log("hashed daily index (pool 125):", mix32(seed) % 125);

function rngFor(key) {
  let a = 0; for (const c of key) a = (a * 31 + c.charCodeAt(0)) >>> 0;
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pool = JSON.parse(readFileSync("C:/Users/Vince/tmdle/src/data/wrorlower-pool.json", "utf8"));
const mk = () => { const rng = rngFor(dayKey()); return [...pool].sort(() => rng() - 0.5).slice(0, 11); };
const d1 = mk(), d2 = mk();
console.log("deck deterministic across two builds:", JSON.stringify(d1.map(x => x.uid)) === JSON.stringify(d2.map(x => x.uid)));
console.log("today's deck (round chain):");
d1.forEach((x, i) => {
  const gap = i > 0 ? Math.abs(x.wr - d1[i - 1].wr) : null;
  console.log(`  ${String(i).padStart(2)}: wr=${String(x.wr).padStart(6)}  ${gap !== null ? `gap=${String(gap).padStart(6)}${gap <= 200 ? "  << PHOTO FINISH" : ""}` : "(anchor)"}  ${x.name}`);
});
