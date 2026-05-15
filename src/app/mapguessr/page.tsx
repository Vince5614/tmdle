import { getAllMapNames } from "@/data/campaigns";
import { getDailyIndex, getDayNumber, getDateLabel } from "@/lib/seed";
import { buildEnrichedMap } from "@/lib/mapguessr2";
import type { Challenge2 } from "@/types/mapguessr2";
import MapGuessr from "./MapGuessr";

export const dynamic = "force-dynamic";

export default async function MapGuessrPage() {
  const allMapNames = getAllMapNames();
  const dailyIdx = getDailyIndex(allMapNames.length);
  const targetName = allMapNames[dailyIdx];

  const target = await buildEnrichedMap(targetName);
  if (!target) {
    return (
      <div className="flex justify-center items-center py-32">
        <p className="text-gray-500 text-sm">Failed to load today&apos;s map. Try again later.</p>
      </div>
    );
  }

  const challenge: Challenge2 = {
    target,
    allMapNames,
    dayNumber: getDayNumber(),
    dateLabel: getDateLabel(),
  };

  return <MapGuessr challenge={challenge} mode="daily" />;
}
