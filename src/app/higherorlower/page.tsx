import { getDailyDeck } from "@/lib/wrorlower";
import { getDateLabel } from "@/lib/seed";
import HigherOrLower from "@/components/HigherOrLower";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Higher or Lower — TMDLE",
  description: "Ten real maps, real world-record racing lines. Faster or slower? New deck every midnight (Brussels time).",
};

export default function HigherOrLowerPage() {
  const { deck, dayNumber } = getDailyDeck();
  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="text-4xl text-[#eae3d2] sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          Higher or <span className="text-[#ff5800]">Lower</span>
        </h1>
        <span className="wrl-label">#{dayNumber} · {getDateLabel()}</span>
      </div>
      <p className="wrl-label mb-7 max-w-md">
        Ten real maps, real WR racing lines, one chain. Is the next world record faster or slower? Gaps of 0.2s or less count either way. Same deck for everyone today.
      </p>
      <HigherOrLower deck={deck} dayNumber={dayNumber} mode="daily" />
    </div>
  );
}
