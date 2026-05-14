import GamesSection from "@/components/GamesSection";

const today = new Date().toLocaleDateString("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">

      {/* ── Hero ── */}
      <div className="mb-12">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-gray-600">
          {today}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="bg-gradient-to-r from-white via-cyan-300 to-blue-500 bg-clip-text text-6xl font-normal leading-none tracking-tight text-transparent sm:text-7xl lg:text-8xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              TMDLE
            </h1>
            <p className="mt-3 max-w-sm text-base text-gray-400">
              Daily Trackmania games —{" "}
              <span className="text-white">new challenges every midnight.</span>
            </p>
          </div>

          {/* Right side — by chilly (clickable) */}
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <a
              href="https://www.twitch.tv/chilly7383"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/8 px-4 py-1.5 text-xs font-medium tracking-widest text-cyan-400 transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/15 hover:text-cyan-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              by chilly
            </a>
            <p className="text-xs text-gray-600">6 games · daily seed</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── Games section (client — has search) ── */}
      <GamesSection />
    </div>
  );
}
