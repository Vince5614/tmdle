import { getAllMapNames } from "@/data/campaigns";
import { getDailyIndex, getDayNumber, getDateLabel } from "@/lib/seed";
import { buildEnrichedMap } from "@/lib/mapguessr2";
import type { Challenge2 } from "@/types/mapguessr2";
import MapGuessr from "./MapGuessr";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "MapGuessr — Daily Trackmania Map Quiz",
  description: "A daily Trackmania guessing game: identify today's official campaign map. Each guess reveals season, year, surface, car and style. Free, new map every day.",
  alternates: { canonical: "/mapguessr" },
};

export default async function MapGuessrPage() {
  const allMapNames = getAllMapNames();
  const dailyIdx = getDailyIndex(allMapNames.length);
  const targetName = allMapNames[dailyIdx];

  const target = await buildEnrichedMap(targetName);
  if (!target) {
    return (
      <div className="flex justify-center items-center py-32">
        <p className="text-[#9c9483] text-sm">Failed to load today&apos;s map. Try again later.</p>
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
