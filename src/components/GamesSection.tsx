"use client";

import Link from "next/link";

const GAMES = [
  { number: 1, title: "MapGuessr", description: "Each guess reveals how the map compares — season, year, surface, car, style. Solve in as few guesses as possible.", accentColor: "#ff5800", href: "/mapguessr" as string | null },
  { number: 2, title: "Higher or Lower", description: "Ten real maps, real WR racing lines. Is the next world record faster or slower than the last?", accentColor: "#ff5800", href: "/higherorlower" as string | null },
  { number: 3, title: "Head-to-Head", description: "Enter two TM usernames. See every shared map time side by side — color-coded, ranked, and scored.", accentColor: "#ff2d6b", href: null },
  { number: 4, title: "Ghost Race", description: "Two anonymous ghosts race the same map. Guess which is faster before they cross the finish line.", accentColor: "#ffd000", href: null },
  { number: 5, title: "Time Guesser", description: "Watch a ghost drive today's TOTD. Input your guess for the exact finish time in milliseconds.", accentColor: "#00e676", href: null },
  { number: 6, title: "PB Guesser", description: "See anonymised player stats and guess their trophy count or rank bracket. Higher or lower?", accentColor: "#ff6b00", href: null },
  { number: 7, title: "Gap Guesser", description: "Two ghosts finish the same map. Drag a slider to guess the exact millisecond gap between them.", accentColor: "#b44dff", href: null },
  { number: 8, title: "Finish Speed", description: "A car drives in a straight line then vanishes. Drag the speedometer needle to guess its exact km/h.", accentColor: "#ff3b5c", href: null },
  { number: 9, title: "Draw the Line", description: "Watch a ghost take a corner from above, then draw the racing line you remember on the empty track.", accentColor: "#34d399", href: null },
  { number: 10, title: "Pro or Joe", description: "Watch an anonymous ghost on a campaign map. Top 100 world player, or total casual? You decide.", accentColor: "#f59e0b", href: null },
];

type Game = (typeof GAMES)[number];

function GameRowInner({ number, title, description, accentColor, live }: Game & { live: boolean }) {
  return (
    <>
      {/* position number, timing-tower style */}
      <span className="wrl-mono w-9 shrink-0 text-center text-lg font-semibold text-[#6b6557]">
        {String(number).padStart(2, "0")}
      </span>

      {/* accent bar */}
      <div className="w-[3px] shrink-0 self-stretch" style={{ backgroundColor: live ? accentColor : "#383228" }} />

      {/* title + description */}
      <div className="min-w-0 flex-1">
        <h2 className={`truncate text-sm ${live ? "text-[#eae3d2]" : "text-[#9c9483]"}`} style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        <p className="mt-0.5 truncate text-xs text-[#6b6557]">{description}</p>
      </div>

      {/* status */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="wrl-label hidden sm:inline">Daily</span>
        {live ? (
          <span className="wrl-condensed border border-[#ff5800] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-[#ff5800]">
            Play
          </span>
        ) : (
          <span className="wrl-label border border-[#383228] px-2.5 py-0.5">Soon</span>
        )}
      </div>
    </>
  );
}

function GameRow({ game }: { game: Game }) {
  const live = !!game.href;
  const baseClass = "game-card flex w-full items-center gap-4 border border-[#383228] bg-[#1d1a15] p-4 text-left";

  if (live) {
    return (
      <Link href={game.href!} className={baseClass}>
        <GameRowInner {...game} live />
      </Link>
    );
  }
  return (
    <div className={`${baseClass} opacity-70`}>
      <GameRowInner {...game} live={false} />
    </div>
  );
}

export default function GamesSection() {
  return (
    <section>
      <p className="wrl-label mb-4">The full lineup</p>
      <div className="flex flex-col gap-2">
        {GAMES.map((g) => (
          <GameRow key={g.number} game={g} />
        ))}
      </div>
    </section>
  );
}
