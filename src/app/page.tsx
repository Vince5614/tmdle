import Link from "next/link";
import GamesSection from "@/components/GamesSection";
import { getDateLabel, getDayNumber } from "@/lib/seed";

export const dynamic = "force-dynamic";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "TMDLE",
      alternateName: ["Trackmania Daily", "TM Daily", "Daily Trackmania Games"],
      url: "https://tmdle.com",
      description:
        "TMDLE is the daily Trackmania game hub — free daily Trackmania puzzles, a new challenge every day.",
    },
    {
      "@type": "VideoGame",
      name: "MapGuessr",
      url: "https://tmdle.com/mapguessr",
      applicationCategory: "Game",
      gamePlatform: "Web browser",
      description:
        "A daily Trackmania map guessing game — identify today's official campaign map from attribute clues.",
      isPartOf: { "@type": "WebSite", name: "TMDLE", url: "https://tmdle.com" },
    },
    {
      "@type": "VideoGame",
      name: "Higher or Lower",
      url: "https://tmdle.com/higherorlower",
      applicationCategory: "Game",
      gamePlatform: "Web browser",
      description:
        "A daily Trackmania world-record game — guess whether the next map's WR is faster or slower.",
      isPartOf: { "@type": "WebSite", name: "TMDLE", url: "https://tmdle.com" },
    },
  ],
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      {/* ── Hero ── */}
      <div className="mb-12">
        <p className="wrl-label mb-4">
          {getDateLabel()} · Day {getDayNumber()} · resets at midnight (Brussels)
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-6xl leading-none tracking-tight text-[#eae3d2] sm:text-7xl lg:text-8xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              TMD<span className="text-[#ff5800]">LE</span>
            </h1>
            <p className="mt-3 max-w-sm text-base text-[#9c9483]">
              Daily Trackmania games —{" "}
              <span className="text-[#eae3d2]">new challenges every midnight.</span>
            </p>
          </div>

          <a
            href="https://www.twitch.tv/chilly7383"
            target="_blank"
            rel="noopener noreferrer"
            className="wrl-label inline-flex items-center gap-2 border border-[#383228] px-4 py-2 transition-colors hover:border-[#ff5800] hover:text-[#eae3d2]"
          >
            <span className="h-1.5 w-1.5 bg-[#ff5800]" />
            by chilly
          </a>
        </div>

        <div className="mt-8 h-px bg-[#383228]" />
      </div>

      {/* ── Featured: today's games ── */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/mapguessr"
          className="game-card group flex flex-col border border-[#383228] bg-[#1d1a15] p-6"
        >
          <span className="wrl-label mb-3">Daily · Guessing game</span>
          <h2 className="mb-1 text-2xl text-[#eae3d2]" style={{ fontFamily: "var(--font-display)" }}>
            MapGuessr
          </h2>
          <p className="mb-5 text-sm text-[#9c9483]">
            Guess the campaign map. Every guess reveals how close you are — season, year, surface, car, style.
          </p>
          <span className="wrl-btn-primary mt-auto self-start">Play today&apos;s →</span>
        </Link>

        <Link
          href="/higherorlower"
          className="game-card group flex flex-col border border-[#383228] bg-[#1d1a15] p-6"
        >
          <span className="wrl-label mb-3">Daily · New game</span>
          <h2 className="mb-1 text-2xl text-[#eae3d2]" style={{ fontFamily: "var(--font-display)" }}>
            Higher or <span className="text-[#ff5800]">Lower</span>
          </h2>
          <p className="mb-5 text-sm text-[#9c9483]">
            Ten real maps, real world-record racing lines. Is the next WR faster or slower? Same deck for everyone.
          </p>
          <span className="wrl-btn-primary mt-auto self-start">Play today&apos;s →</span>
        </Link>
      </div>

      {/* ── Full lineup ── */}
      <GamesSection />
    </div>
  );
}
