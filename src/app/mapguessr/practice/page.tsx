import { getAllMapNames } from "@/data/campaigns";
import { getDailyIndex } from "@/lib/seed";
import { buildEnrichedMap } from "@/lib/mapguessr2";
import type { Challenge2 } from "@/types/mapguessr2";
import MapGuessr from "../MapGuessr";

export const dynamic = "force-dynamic";

export default async function MapGuessrPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>;
}) {
  const params = await searchParams;
  const seed = params.seed ? parseInt(params.seed, 10) : null;

  const allMapNames = getAllMapNames();
  const todayIdx = getDailyIndex(allMapNames.length);

  let practiceIdx: number;
  if (seed !== null && !isNaN(seed)) {
    practiceIdx = Math.abs(seed) % allMapNames.length;
    if (practiceIdx === todayIdx) practiceIdx = (practiceIdx + 1) % allMapNames.length;
  } else {
    practiceIdx = (todayIdx + Math.floor(allMapNames.length / 2)) % allMapNames.length;
    if (practiceIdx === todayIdx) practiceIdx = (practiceIdx + 1) % allMapNames.length;
  }

  const target = await buildEnrichedMap(allMapNames[practiceIdx]);
  if (!target) {
    return (
      <div className="flex justify-center items-center py-32">
        <p className="text-[#9c9483] text-sm">Failed to load map. Try another round.</p>
      </div>
    );
  }

  const challenge: Challenge2 = {
    target,
    allMapNames,
    dayNumber: -1,
    dateLabel: "Practice",
  };

  return <MapGuessr key={target.name} challenge={challenge} mode="practice" />;
}
