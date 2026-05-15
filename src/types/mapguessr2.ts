import type { Surface } from "@/types/mapguessr";

export type CarType = "Stadium" | "Snow" | "Rally" | "Desert" | "Mixed";
export type SeasonName = "Summer" | "Fall" | "Winter" | "Spring";
export type CellState = "correct" | "present" | "absent";

export interface EnrichedMap {
  name: string;
  seasonName: SeasonName;
  year: number;
  number: number;
  surface: Surface;
  carType: CarType;
  primaryStyle: string;  // e.g. "Tech", "FullSpeed", "Race"
  styleTags: string[];   // all style tags
  lengthName: string;    // "Short" | "Medium" | "Long" | "Very Long"
  thumbnailUrl: string | null;
  mxId: number | null;
  wrTime: number | null;
  wrUsername: string | null;
}

export interface AttributeCell {
  value: string;
  state: CellState;
  direction?: "up" | "down"; // shown for numeric mismatches (both present & absent)
}

export interface GuessRow {
  mapName: string;
  thumbnailUrl: string | null;
  correct: boolean;
  season: AttributeCell;
  year: AttributeCell;
  number: AttributeCell;
  surface: AttributeCell;
  car: AttributeCell;
  style: AttributeCell;
  length: AttributeCell;
}

export interface Challenge2 {
  target: EnrichedMap;
  allMapNames: string[];
  dayNumber: number;
  dateLabel: string;
}
