import type { Surface } from "@/types/mapguessr";

/** All official TM2020 campaign seasons in release order. */
export const SEASONS = [
  "Summer 2020", "Fall 2020",
  "Winter 2021", "Spring 2021", "Summer 2021", "Fall 2021",
  "Winter 2022", "Spring 2022", "Summer 2022", "Fall 2022",
  "Winter 2023", "Spring 2023", "Summer 2023", "Fall 2023",
  "Winter 2024", "Spring 2024", "Summer 2024", "Fall 2024",
  "Winter 2025", "Spring 2025", "Summer 2025", "Fall 2025",
] as const;

/**
 * Surface type per map name.
 * ─────────────────────────────────────────────────────────────
 * TODO for chilly: Fill in every map. Format is:
 *   "Season Year - NN": "Road" | "Dirt" | "Grass" | "Ice"
 *
 * Maps NOT listed here will show as "Unknown" (clue stays locked).
 * ─────────────────────────────────────────────────────────────
 */
export const SURFACE_MAP: Record<string, Surface> = {
  // ── Summer 2020 ───────────────────────────────────────────
  "Summer 2020 - 01": "Road",
  "Summer 2020 - 02": "Road",
  "Summer 2020 - 03": "Road",
  "Summer 2020 - 04": "Road",
  "Summer 2020 - 05": "Road",
  "Summer 2020 - 06": "Road",
  "Summer 2020 - 07": "Dirt",
  "Summer 2020 - 08": "Road",
  "Summer 2020 - 09": "Road",
  "Summer 2020 - 10": "Road",
  "Summer 2020 - 11": "Road",
  "Summer 2020 - 12": "Road",
  "Summer 2020 - 13": "Road",
  "Summer 2020 - 14": "Road",
  "Summer 2020 - 15": "Road",
  "Summer 2020 - 16": "Road",
  "Summer 2020 - 17": "Road",
  "Summer 2020 - 18": "Road",
  "Summer 2020 - 19": "Road",
  "Summer 2020 - 20": "Road",
  "Summer 2020 - 21": "Dirt",
  "Summer 2020 - 22": "Road",
  "Summer 2020 - 23": "Road",
  "Summer 2020 - 24": "Road",
  "Summer 2020 - 25": "Road",
  // Add remaining seasons below — chilly fills these in
};

/**
 * Generates the full canonical name for a campaign map.
 * e.g. mapName("Summer 2023", 5) → "Summer 2023 - 05"
 */
export function mapName(season: string, n: number): string {
  return `${season} - ${String(n).padStart(2, "0")}`;
}

/** Returns all 25 map names for a given season. */
export function mapsForSeason(season: string): string[] {
  return Array.from({ length: 25 }, (_, i) => mapName(season, i + 1));
}

/** Returns the full pool of all campaign maps across all seasons. */
export function getAllMapNames(): string[] {
  return SEASONS.flatMap((s) => mapsForSeason(s));
}

/** Parses a map name back into its components. */
export function parseMapName(name: string): {
  season: string;
  number: number;
} | null {
  const m = name.match(/^(.+) - (\d{2})$/);
  if (!m) return null;
  return { season: m[1], number: parseInt(m[2], 10) };
}

/** Returns the surface for a given map name, or "Unknown" if not yet provided. */
export function getSurface(name: string): Surface {
  return SURFACE_MAP[name] ?? "Unknown";
}
