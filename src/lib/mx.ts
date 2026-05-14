const MX_BASE = "https://trackmania.exchange";
const UA = "tmdle/1.0 contact@chilly7383";

interface MXResult {
  TrackID: number;
  Name: string;
  AuthorLogin: string;
  LengthName: string;
  HasThumbnail: boolean;
  HasScreenshot: boolean;
  Tags: string | null;
  ReplayWRTime: number | null;
  ReplayWRUsername: string | null;
}

interface MXSearchResponse {
  results: MXResult[];
}

type MXSurface = "Road" | "Dirt" | "Grass" | "Ice";

const SURFACE_TAGS: Record<number, MXSurface> = {
  14: "Ice",
  15: "Dirt",
  33: "Grass",
};

const TAG_NAMES: Record<number, string> = {
  1: "Race", 2: "FullSpeed", 3: "Tech", 4: "RPG", 5: "LOL",
  6: "Press Forward", 7: "SpeedTech", 8: "MultiLap", 9: "Offroad", 10: "Trial",
  11: "ZrT", 12: "SpeedFun", 13: "Competitive", 14: "Ice", 15: "Dirt",
  16: "Stunt", 17: "Reactor", 18: "Platform", 19: "Slow Motion", 20: "Bumper",
  21: "Fragile", 22: "Scenery", 23: "Kacky", 24: "Endurance", 25: "Mini",
  26: "Remake", 27: "Mixed", 28: "Nascar", 29: "SpeedDrift", 30: "Minigame",
  31: "Obstacle", 32: "Transitional", 33: "Grass", 34: "Backwards", 35: "Engine Off",
  36: "Signature", 37: "Royal", 38: "Water", 39: "Plastic", 40: "Arena",
  41: "Freestyle", 42: "Educational", 43: "Sausage", 44: "Bobsleigh", 45: "Pathfinding",
  46: "FlagRush", 47: "Puzzle", 48: "Freeblocking", 49: "Altered Nadeo", 50: "SnowCar",
  51: "Wood", 52: "Underwater", 53: "Turtle", 54: "RallyCar", 55: "MixedCar",
  56: "Bugslide", 57: "Mudslide", 58: "Moving Items", 59: "DesertCar", 60: "SpeedMapping",
  61: "No Brakes", 62: "Cruise Control", 63: "No Steering", 64: "RPG-Immersive", 65: "Pipes",
  66: "Magnet", 67: "No Grip", 68: "Precision", 69: "Clones",
};

function parseSurface(tags: string | null): MXSurface {
  if (!tags) return "Road";
  const ids = tags.split(",").map(Number);
  for (const id of ids) {
    if (SURFACE_TAGS[id]) return SURFACE_TAGS[id];
  }
  return "Road";
}

function parseTagNames(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(",").map(Number).map((id) => TAG_NAMES[id]).filter(Boolean);
}

export function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export async function getMXMap(mapName: string): Promise<{
  id: number;
  lengthName: string;
  surface: MXSurface;
  tagNames: string[];
  wrTime: number | null;
  wrUsername: string | null;
} | null> {
  try {
    const url = `${MX_BASE}/mapsearch2/search?api=on&limit=10&name=${encodeURIComponent(mapName)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data: MXSearchResponse = await res.json();
    const official = data.results?.find(
      (m) => m.AuthorLogin === "Nadeo" && m.Name === mapName
    );
    if (!official) return null;

    return {
      id: official.TrackID,
      lengthName: official.LengthName,
      surface: parseSurface(official.Tags),
      tagNames: parseTagNames(official.Tags),
      wrTime: official.ReplayWRTime ?? null,
      wrUsername: official.ReplayWRUsername ?? null,
    };
  } catch {
    return null;
  }
}

export function mxThumbnailUrl(trackId: number): string {
  return `${MX_BASE}/maps/thumbnail/${trackId}`;
}
