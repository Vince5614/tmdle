import { getPracticeDeck } from "@/lib/wrorlower";
import PracticeGate from "./PracticeGate";

export const dynamic = "force-dynamic";

export const metadata = { title: "Higher or Lower · Practice" };

export default function HigherOrLowerPracticePage() {
  const deck = getPracticeDeck(Math.floor(Math.random() * 2 ** 31));
  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="text-4xl text-[#eae3d2] sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          Higher or <span className="text-[#ff5800]">Lower</span>
        </h1>
        <span className="wrl-label">Practice · not the daily</span>
      </div>
      <p className="wrl-label mb-7 max-w-md">Random maps, unlimited runs. Your practice stats are saved to your account.</p>
      <PracticeGate deck={deck} />
    </div>
  );
}
