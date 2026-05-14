export type Surface = "Road" | "Dirt" | "Grass" | "Ice" | "Unknown";

export type ClueType = "screenshot" | "season" | "wr" | "tags";

export interface CampaignMap {
  name: string;
  season: string;
  number: number;
  surface: Surface;
  mxId: number | null;
  thumbnailUrl: string | null;
  lengthName: string | null;
  tagNames: string[];
  wrTime: number | null;
  wrUsername: string | null;
}

export interface Clue {
  type: ClueType;
  label: string;
  icon: string;
  value: string | null;
  subValue?: string | null;   // secondary line, e.g. WR holder name
  mediaPath: string | null;
  available: boolean;
}

export type GamePhase = "playing" | "won" | "lost";

export interface GameState {
  phase: GamePhase;
  clueIndex: number;
  guesses: string[];
  input: string;
}

export interface DailyChallenge {
  map: CampaignMap;
  clues: Clue[];
  allMapNames: string[];
  dayNumber: number;
  dateLabel: string;
}
