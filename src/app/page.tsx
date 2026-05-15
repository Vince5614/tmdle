import Link from "next/link";

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
          </div>
        </div>

        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── MapGuessr card ── */}
      <Link
        href="/mapguessr"
        className="group mb-4 flex items-center gap-4 rounded-2xl border border-white/5 p-5 transition-all duration-200 hover:border-cyan-500/30 hover:bg-white/[0.02]"
        style={{ background: "linear-gradient(to right, #00c4f012, transparent 55%)" }}
      >
        {/* Icon */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#00c4f0]/30 bg-[#00c4f0]/10">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <path d="M18 3C12.477 3 8 7.477 8 13c0 7.5 10 20 10 20s10-12.5 10-20c0-5.523-4.477-10-10-10z"
              stroke="#00c4f0" strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="18" cy="13" r="3.5" stroke="#00c4f0" strokeWidth="1.8"/>
          </svg>
        </div>

        {/* Accent bar */}
        <div className="w-[3px] shrink-0 self-stretch rounded-full bg-[#00c4f0] opacity-70" />

        {/* Text */}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
            MapGuessr
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Each guess reveals how the map compares — season, year, car, style. Solve in as few guesses as possible.
          </p>
        </div>

        {/* Badge */}
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: "#00c4f025", color: "#00c4f0", border: "1px solid #00c4f050" }}
        >
          Play
        </span>
      </Link>

      {/* ── More coming soon ── */}
      <div className="mt-16 flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p
          className="text-4xl font-normal text-white/10 sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          More coming soon
        </p>
        <p className="text-sm text-gray-600">More games in the works</p>
      </div>

    </div>
  );
}
