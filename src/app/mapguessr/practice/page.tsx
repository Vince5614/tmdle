import { getAllMapNames, parseMapName } from "@/data/campaigns";
import { getMXMap, mxThumbnailUrl, formatTime } from "@/lib/mx";
import { getDailyIndex } from "@/lib/seed";
import type { CampaignMap, Clue, DailyChallenge } from "@/types/mapguessr";
import MapGuessr from "../MapGuessr";

// Always fresh — each visit picks a new random map
export const dynamic = "force-dynamic";

async function buildPracticeChallenge(): Promise<DailyChallenge> {
  const allMapNames = getAllMapNames();
  const todayIdx = getDailyIndex(allMapNames.length);

  // Pick a map different from today's, rotating every request via timestamp
  let practiceIdx = Math.floor(Date.now() / 1000) % allMapNames.length;
  if (practiceIdx === todayIdx) practiceIdx = (practiceIdx + 1) % allMapNames.length;

  const practiceName = allMapNames[practiceIdx];
  const parsed = parseMapName(practiceName)!;
  const mx = await getMXMap(practiceName);
  const surface = mx?.surface ?? "Unknown";

  const map: CampaignMap = {
    name: practiceName,
    season: parsed.season,
    number: parsed.number,
    surface,
    mxId: mx?.id ?? null,
    thumbnailUrl: mx ? mxThumbnailUrl(mx.id) : null,
    lengthName: mx?.lengthName ?? null,
    tagNames: mx?.tagNames ?? [],
    wrTime: mx?.wrTime ?? null,
    wrUsername: mx?.wrUsername ?? null,
  };

  const clues: Clue[] = [
    {
      type: "screenshot",
      label: "Map Screenshot",
      icon: "📸",
      value: null,
      mediaPath: map.thumbnailUrl,
      available: map.thumbnailUrl !== null,
    },
    {
      type: "season",
      label: "Campaign Season",
      icon: "📅",
      value: map.season,
      mediaPath: null,
      available: true,
    },
    {
      type: "wr",
      label: "World Record",
      icon: "🏆",
      value: map.wrTime !== null ? formatTime(map.wrTime) : null,
      subValue: map.wrUsername ? `by ${map.wrUsername}` : null,
      mediaPath: null,
      available: map.wrTime !== null,
    },
    {
      type: "tags",
      label: "Map Tags",
      icon: "🏷️",
      value: map.tagNames.length > 0 ? map.tagNames.join(",") : null,
      mediaPath: null,
      available: map.tagNames.length > 0,
    },
  ];

  return {
    map,
    clues,
    allMapNames,
    dayNumber: -1,
    dateLabel: "Practice",
  };
}

export default async function PracticePage() {
  const challenge = await buildPracticeChallenge();
  return <MapGuessr challenge={challenge} mode="practice" />;
}
