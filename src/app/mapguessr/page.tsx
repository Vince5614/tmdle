import { getAllMapNames, parseMapName } from "@/data/campaigns";
import { getMXMap, mxThumbnailUrl, formatTime } from "@/lib/mx";
import { getDailyIndex, getDayNumber, getDateLabel } from "@/lib/seed";
import type { CampaignMap, Clue, DailyChallenge } from "@/types/mapguessr";
import MapGuessr from "./MapGuessr";

async function buildDailyChallenge(): Promise<DailyChallenge> {
  const allMapNames = getAllMapNames();
  const todayIdx = getDailyIndex(allMapNames.length);
  const todayName = allMapNames[todayIdx];

  const parsed = parseMapName(todayName)!;
  const mx = await getMXMap(todayName);
  const surface = mx?.surface ?? "Unknown";

  const map: CampaignMap = {
    name: todayName,
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
    dayNumber: getDayNumber(),
    dateLabel: getDateLabel(),
  };
}

export const revalidate = 3600;

export default async function MapGuesserPage() {
  const challenge = await buildDailyChallenge();
  return <MapGuessr challenge={challenge} />;
}
