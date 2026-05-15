import { getAllMapNames, parseMapName } from "@/data/campaigns";
import { getMXMap, getTMIOWR, mxThumbnailUrl, formatTime } from "@/lib/mx";
import { getDailyIndex } from "@/lib/seed";
import type { CampaignMap, Clue, DailyChallenge } from "@/types/mapguessr";
import MapGuessr from "../MapGuessr";

export const dynamic = "force-dynamic";

async function buildPracticeChallenge(seed: number | null): Promise<DailyChallenge> {
  const allMapNames = getAllMapNames();
  const todayIdx = getDailyIndex(allMapNames.length);

  let practiceIdx: number;
  if (seed !== null) {
    // Seed from URL — any map except today's daily
    practiceIdx = Math.abs(seed) % allMapNames.length;
    if (practiceIdx === todayIdx) practiceIdx = (practiceIdx + 1) % allMapNames.length;
  } else {
    // No seed — default to the day-stable practice map
    practiceIdx = (todayIdx + Math.floor(allMapNames.length / 2)) % allMapNames.length;
    if (practiceIdx === todayIdx) practiceIdx = (practiceIdx + 1) % allMapNames.length;
  }

  const practiceName = allMapNames[practiceIdx];
  const parsed = parseMapName(practiceName)!;
  const mx = await getMXMap(practiceName);
  const tmio = mx?.trackUid ? await getTMIOWR(mx.trackUid) : null;
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
    wrTime: tmio?.wrTime ?? mx?.mxWrTime ?? null,
    wrUsername: tmio?.wrUsername ?? mx?.mxWrUsername ?? null,
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

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>;
}) {
  const params = await searchParams;
  const seed = params.seed ? parseInt(params.seed, 10) : null;
  const challenge = await buildPracticeChallenge(isNaN(seed ?? NaN) ? null : seed);
  return <MapGuessr challenge={challenge} mode="practice" />;
}
