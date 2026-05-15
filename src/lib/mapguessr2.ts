import { getMXMap, getTMIOWR, mxThumbnailUrl } from "@/lib/mx";
import { parseMapName } from "@/data/campaigns";
import type { EnrichedMap, CarType, SeasonName, AttributeCell, GuessRow } from "@/types/mapguessr2";

// ─── Car type extraction ───────────────────────────────────────────────────────

const CAR_TAG_TO_TYPE: Record<string, CarType> = {
  SnowCar: "Snow",
  RallyCar: "Rally",
  MixedCar: "Mixed",
  DesertCar: "Desert",
};

export function getCarTypeFromTagNames(tagNames: string[]): CarType {
  for (const [tag, car] of Object.entries(CAR_TAG_TO_TYPE)) {
    if (tagNames.includes(tag)) return car;
  }
  return "Stadium";
}

// ─── Primary style extraction ──────────────────────────────────────────────────
// Priority order: most specific / interesting style first.
// Surface and car-type tags are excluded before matching.

const STYLE_PRIORITY = [
  "FullSpeed", "Tech", "RPG", "Trial", "Reactor", "Platform",
  "Press Forward", "SpeedTech", "Endurance", "Kacky", "Mini",
  "Stunt", "LOL", "Obstacle", "Puzzle", "SpeedDrift", "Arena",
  "Nascar", "Offroad", "MultiLap", "Race",
];

const NON_STYLE = new Set([
  "SnowCar", "RallyCar", "MixedCar", "DesertCar",
  "Altered Nadeo", "Signature", "Ice", "Dirt", "Grass",
  "Competitive", "Scenery", "Remake", "Freestyle", "Educational",
  "Freeblocking", "FlagRush", "Royal", "Water", "Plastic",
  "Backwards", "Wood", "Underwater", "Turtle", "Bobsleigh",
  "Pathfinding", "Bumper", "Fragile", "Slow Motion",
  "Engine Off", "No Brakes", "Cruise Control", "No Steering",
  "Magnet", "No Grip", "Pipes", "Clones", "Moving Items",
  "Bugslide", "Mudslide", "SpeedMapping", "ZrT",
  "Mixed", "Minigame",
]);

export function getPrimaryStyle(tagNames: string[]): string {
  const style = tagNames.filter((t) => !NON_STYLE.has(t));
  for (const s of STYLE_PRIORITY) {
    if (style.includes(s)) return s;
  }
  return style[0] ?? tagNames[0] ?? "Race";
}

// ─── Map builder (server-only: uses getMXMap / getTMIOWR) ─────────────────────

export async function buildEnrichedMap(mapName: string): Promise<EnrichedMap | null> {
  const parsed = parseMapName(mapName);
  if (!parsed) return null;

  const { season, number } = parsed;
  const parts = season.split(" ");
  const seasonName = parts[0] as SeasonName;
  const year = parseInt(parts[1], 10);

  const mx = await getMXMap(mapName);
  if (!mx) return null;

  const tmio = mx.trackUid ? await getTMIOWR(mx.trackUid) : null;

  const carType = getCarTypeFromTagNames(mx.tagNames);
  const primaryStyle = getPrimaryStyle(mx.tagNames);

  return {
    name: mapName,
    seasonName,
    year,
    number,
    surface: mx.surface,
    carType,
    primaryStyle,
    styleTags: mx.tagNames,
    lengthName: mx.lengthName || "Unknown",
    thumbnailUrl: mxThumbnailUrl(mx.id),
    mxId: mx.id,
    wrTime: tmio?.wrTime ?? mx.mxWrTime ?? null,
    wrUsername: tmio?.wrUsername ?? mx.mxWrUsername ?? null,
  };
}

// ─── Comparison helpers ────────────────────────────────────────────────────────

function cmpStr(guess: string, target: string): AttributeCell {
  return { value: guess, state: guess === target ? "correct" : "absent" };
}

function cmpNum(guess: number, target: number, yellowRange: number): AttributeCell {
  if (guess === target) return { value: String(guess), state: "correct" };
  const dir = guess < target ? "up" : "down";
  if (Math.abs(guess - target) <= yellowRange)
    return { value: String(guess), state: "present", direction: dir };
  return { value: String(guess), state: "absent", direction: dir };
}

/** Map number 1-25, yellow if in the same tier of 5 (1-5, 6-10, 11-15, 16-20, 21-25). */
function cmpMapNumber(guess: number, target: number): AttributeCell {
  if (guess === target) return { value: String(guess), state: "correct" };
  const dir = guess < target ? "up" : "down";
  const sameTier = Math.floor((guess - 1) / 5) === Math.floor((target - 1) / 5);
  return { value: String(guess), state: sameTier ? "present" : "absent", direction: dir };
}

// MX returns length as a time bucket. Ordered shortest → longest.
const LENGTH_ORDER = [
  "15 secs", "30 secs", "45 secs",
  "1 min", "1 min 15", "1 min 30", "1 min 45",
  "2 min", "2 min 30",
  "3 min", "5 min", "10 min", "> 10 min",
];

/** Normalize MX length strings so trivial whitespace/case diffs don't break ordering. */
function normalizeLength(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/^>\s*/, "> ");
}
const NORM_LENGTH_ORDER = LENGTH_ORDER.map(normalizeLength);

function cmpLength(guess: string, target: string): AttributeCell {
  if (guess === target) return { value: guess || "?", state: "correct" };
  const gi = NORM_LENGTH_ORDER.indexOf(normalizeLength(guess));
  const ti = NORM_LENGTH_ORDER.indexOf(normalizeLength(target));
  if (gi === -1 || ti === -1) return { value: guess || "?", state: "absent" };
  const dir = gi < ti ? "up" : "down";
  // Yellow if within ±2 buckets (e.g. 30s ↔ 1min15 is two buckets apart)
  if (Math.abs(gi - ti) <= 2) return { value: guess, state: "present", direction: dir };
  return { value: guess, state: "absent", direction: dir };
}

// "Race" is on virtually every official campaign map, so it doesn't count
// as a meaningful overlap — Tech and Reactor maps shouldn't show yellow just
// because they're both tagged Race.
const GENERIC_STYLE_TAGS = new Set(["Race"]);

function cmpStyle(guess: EnrichedMap, target: EnrichedMap): AttributeCell {
  if (guess.primaryStyle === target.primaryStyle)
    return { value: guess.primaryStyle, state: "correct" };

  const meaningful = (t: string) => !GENERIC_STYLE_TAGS.has(t) && !NON_STYLE.has(t);
  const guessStyles = guess.styleTags.filter(meaningful);
  const targetStyles = target.styleTags.filter(meaningful);
  const overlap = guessStyles.filter((t) => targetStyles.includes(t));

  if (overlap.length === 0) {
    return { value: guess.primaryStyle, state: "absent" };
  }

  // Yellow: show the actual overlapping tag so the player knows what their
  // guess shared with the target (not just their guess's primary style, which
  // is confusing when the overlap is on a secondary tag).
  // Pick the highest-priority overlap.
  const priorityOf = (t: string) => {
    const i = STYLE_PRIORITY.indexOf(t);
    return i === -1 ? 999 : i;
  };
  const matched = overlap.sort((a, b) => priorityOf(a) - priorityOf(b))[0];
  return { value: matched, state: "present" };
}

// ─── Build a comparison row ────────────────────────────────────────────────────

export function buildGuessRow(guess: EnrichedMap, target: EnrichedMap): GuessRow {
  return {
    mapName: guess.name,
    thumbnailUrl: guess.thumbnailUrl,
    correct: guess.name === target.name,
    season: cmpStr(guess.seasonName, target.seasonName),
    year: cmpNum(guess.year, target.year, 1),
    number: cmpMapNumber(guess.number, target.number),
    surface: cmpStr(guess.surface, target.surface),
    car: cmpStr(guess.carType, target.carType),
    style: cmpStyle(guess, target),
    length: cmpLength(guess.lengthName, target.lengthName),
  };
}
