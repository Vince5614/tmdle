import GameCard from "@/components/GameCard";

const GAMES = [
  {
    number: 1,
    title: "Daily Game 1",
    description: "A daily Trackmania challenge. New puzzle drops every midnight.",
    accentColor: "#3b82f6",
  },
  {
    number: 2,
    title: "Daily Game 2",
    description: "A daily Trackmania challenge. New puzzle drops every midnight.",
    accentColor: "#22c55e",
  },
  {
    number: 3,
    title: "Daily Game 3",
    description: "A daily Trackmania challenge. New puzzle drops every midnight.",
    accentColor: "#f97316",
  },
  {
    number: 4,
    title: "Daily Game 4",
    description: "A daily Trackmania challenge. New puzzle drops every midnight.",
    accentColor: "#a855f7",
  },
  {
    number: 5,
    title: "Daily Game 5",
    description: "A daily Trackmania challenge. New puzzle drops every midnight.",
    accentColor: "#ef4444",
  },
  {
    number: 6,
    title: "Daily Game 6",
    description: "A daily Trackmania challenge. New puzzle drops every midnight.",
    accentColor: "#06b6d4",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1
          className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-7xl font-black tracking-widest text-transparent sm:text-8xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          TMDLE
        </h1>
        <p className="mt-4 text-base tracking-wide text-gray-400 sm:text-lg">
          Daily Trackmania games.{" "}
          <span className="text-white">Every day.</span>
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-4 py-1.5 text-xs font-semibold tracking-widest text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          by chilly
        </div>
      </div>

      {/* Section label */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-600">
          Today&apos;s Games
        </span>
        <div className="h-px flex-1 bg-white/8" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <GameCard
            key={game.number}
            number={game.number}
            title={game.title}
            description={game.description}
            accentColor={game.accentColor}
          />
        ))}
      </div>
    </div>
  );
}
