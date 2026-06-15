"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const ADMIN_EMAIL = "steyversv@gmail.com";

interface DayStat {
  dayNumber: number;
  total: number;
  signedIn: number;
  guests: number;
  wins: number;
  winRate: number;
  avgClue: number;
}

interface Stats {
  days: DayStat[];
  totalAllTime: number;
}

function dayNumberToDate(n: number): string {
  const launch = new Date("2026-05-14T00:00:00Z");
  const d = new Date(launch.getTime() + (n - 1) * 86_400_000);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric" });
}

const MONO = { fontFamily: "var(--font-mono)" } as const;
const DISPLAY = { fontFamily: "var(--font-display)" } as const;

function GameSummary({ title, stats }: { title: string; stats: Stats | null }) {
  const signedIn = stats?.days.reduce((a, d) => a + d.signedIn, 0) ?? 0;
  const guests = stats?.days.reduce((a, d) => a + d.guests, 0) ?? 0;
  return (
    <div className="border border-[#383228] bg-[#1d1a15] p-4">
      <p className="wrl-label mb-3">{title}</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Total rows", value: stats?.totalAllTime ?? "—" },
          { label: "Signed-in", value: signedIn },
          { label: "Guest plays", value: guests },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="wrl-mono text-2xl font-semibold text-[#eae3d2] tabular-nums">{value}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#6b6557] mt-1" style={MONO}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* one game's three comparison cells for a day row */
function GameCells({ d }: { d: DayStat | undefined }) {
  if (!d) {
    return (
      <>
        <p className="wrl-mono text-sm text-[#6b6557] text-right">—</p>
        <p className="wrl-mono text-sm text-[#6b6557] text-right">—</p>
        <p className="wrl-mono text-sm text-[#6b6557] text-right">—</p>
      </>
    );
  }
  return (
    <>
      <p className="wrl-mono text-sm text-[#eae3d2] text-right font-semibold tabular-nums">
        {d.total}
        {d.guests > 0 && <span className="text-[#6b6557] font-normal"> ·{d.guests}g</span>}
      </p>
      <p className={`wrl-mono text-sm text-right tabular-nums ${d.winRate >= 50 ? "text-[#6fbf73]" : "text-[#e0492e]"}`}>
        {d.winRate}%
      </p>
      <p className="wrl-mono text-sm text-[#9c9483] text-right tabular-nums">{d.avgClue}</p>
    </>
  );
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const [mg, setMg] = useState<Stats | null>(null);
  const [hol, setHol] = useState<Stats | null>(null);
  const [holPractice, setHolPractice] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-warm state
  const [warming, setWarming] = useState(false);
  const [warmProgress, setWarmProgress] = useState<{ total: number; totalCached: number; errors: number } | null>(null);
  const [uncachedView, setUncachedView] = useState<{ uncached: number; bySeason: Record<string, string[]> } | null>(null);

  async function loadUncached() {
    try {
      const res = await fetch("/api/admin/uncached-maps");
      if (!res.ok) return;
      const data = await res.json();
      setUncachedView({ uncached: data.uncached, bySeason: data.bySeason });
    } catch {}
  }

  const email = user?.emailAddresses[0]?.emailAddress;
  const isAdmin = isLoaded && email === ADMIN_EMAIL;

  async function runPreWarm() {
    setWarming(true);
    setWarmProgress(null);
    let totalErrors = 0;
    let consecutiveNoProgress = 0;
    try {
      while (true) {
        const res = await fetch("/api/admin/prewarm-maps", { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        totalErrors += data.errors ?? 0;
        setWarmProgress({ total: data.total, totalCached: data.totalCached, errors: totalErrors });

        if (!data.hasMore) break;

        // If a batch made no progress, MX is probably rate-limiting us. Pause
        // longer and try again — give up after 3 consecutive failed batches.
        if (data.newlyCached === 0) {
          consecutiveNoProgress++;
          if (consecutiveNoProgress >= 3) break;
          await new Promise((r) => setTimeout(r, 15_000));
        } else {
          consecutiveNoProgress = 0;
          await new Promise((r) => setTimeout(r, 2_500));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWarming(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    async function load(game: string): Promise<Stats> {
      const res = await fetch(`/api/admin/stats?game=${game}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      return d;
    }
    Promise.all([load("mapguessr"), load("wrorlower"), load("wrorlower-practice")])
      .then(([a, b, c]) => {
        setMg(a);
        setHol(b);
        setHolPractice(c);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load stats"));
  }, [isAdmin]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#383228] border-t-[#ff5800]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center py-32">
        <p className="text-[#9c9483] text-sm">Access denied.</p>
      </div>
    );
  }

  // Union of day numbers across both dailies, newest first, so the two games
  // line up row by row even on days where only one of them was played.
  const dayNumbers = [
    ...new Set([...(mg?.days ?? []), ...(hol?.days ?? [])].map((d) => d.dayNumber)),
  ].sort((a, b) => b - a);
  const mgByDay = new Map((mg?.days ?? []).map((d) => [d.dayNumber, d]));
  const holByDay = new Map((hol?.days ?? []).map((d) => [d.dayNumber, d]));

  const practiceDay = holPractice?.days.find((d) => d.dayNumber === -1);

  const gridCols = "grid grid-cols-[minmax(72px,auto)_repeat(6,1fr)] gap-x-3";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <p className="wrl-label mb-1">Admin</p>
        <h1 className="text-4xl text-[#eae3d2]" style={DISPLAY}>Dashboard</h1>
      </div>

      {error && <p className="text-[#e0492e] text-sm mb-4">{error}</p>}

      {/* All-time summaries, side by side */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <GameSummary title="MapGuessr" stats={mg} />
        <GameSummary title="Higher or Lower" stats={hol} />
      </div>
      <p className="mb-6 text-[10px] text-[#6b6557] leading-relaxed" style={MONO}>
        Signed-in is deduplicated to one row per user per day; guest plays are not deduplicated,
        so one guest replaying counts more than once. Treat guest numbers as plays, not people.
      </p>

      {/* Day-by-day comparison table */}
      <div className="mb-6 border border-[#383228] bg-[#1d1a15] overflow-x-auto">
        <div className="px-5 py-3 border-b border-[#383228]">
          <p className="wrl-label">By day — both games</p>
        </div>
        <div className="min-w-[560px]">
          {/* group header */}
          <div className={`${gridCols} px-5 pt-2.5 pb-1`}>
            <span />
            <span className="col-span-3 text-center text-[10px] uppercase tracking-widest text-[#9c9483] border-b border-[#383228] pb-1" style={MONO}>
              MapGuessr
            </span>
            <span className="col-span-3 text-center text-[10px] uppercase tracking-widest text-[#ff5800] border-b border-[#383228] pb-1" style={MONO}>
              Higher or Lower
            </span>
          </div>
          <div className={`${gridCols} text-[10px] uppercase tracking-widest text-[#6b6557] px-5 py-2 border-b border-[#383228]`} style={MONO}>
            <span>Date</span>
            <span className="text-right">Plays</span>
            <span className="text-right">Win %</span>
            <span className="text-right">Avg clue</span>
            <span className="text-right">Plays</span>
            <span className="text-right">Win %</span>
            <span className="text-right">Avg score</span>
          </div>
          {dayNumbers.map((n) => (
            <div key={n} className={`${gridCols} px-5 py-3 border-b border-[#383228]/60 last:border-0 items-center hover:bg-[#242019] transition-colors`}>
              <div>
                <p className="wrl-mono text-xs text-[#eae3d2] font-semibold">{dayNumberToDate(n)}</p>
                <p className="text-[10px] text-[#6b6557]" style={MONO}>Day #{n}</p>
              </div>
              <GameCells d={mgByDay.get(n)} />
              <GameCells d={holByDay.get(n)} />
            </div>
          ))}
          {dayNumbers.length === 0 && (
            <p className="px-5 py-6 text-sm text-[#6b6557]">No plays recorded yet.</p>
          )}
        </div>
        <p className="px-5 py-2 text-[10px] text-[#6b6557] border-t border-[#383228] leading-relaxed" style={MONO}>
          Plays = total rows, ·Ng = of which guest plays · MapGuessr only records solved games, so its win % sits near 100% · MapGuessr avg = wrong guesses before solving · HoL avg = score out of 10
        </p>
      </div>

      {/* Higher or Lower practice, aggregate only (no day numbers) */}
      <div className="mb-8 border border-[#383228] bg-[#1d1a15] p-4">
        <p className="wrl-label mb-3">Higher or Lower — practice runs</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Runs", value: holPractice?.totalAllTime ?? 0 },
            { label: "Win %", value: practiceDay ? `${practiceDay.winRate}%` : "—" },
            { label: "Avg score", value: practiceDay ? practiceDay.avgClue : "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="wrl-mono text-2xl font-semibold text-[#eae3d2] tabular-nums">{value}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#6b6557] mt-1" style={MONO}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MapGuessr 2.0 cache pre-warm */}
      <div className="mb-8 border border-[#383228] bg-[#1d1a15] p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="wrl-label">MapGuessr 2.0 — MX Cache</p>
          <button
            onClick={runPreWarm}
            disabled={warming}
            className="wrl-btn-primary !px-4 !py-2 !text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {warming ? "Caching…" : "Pre-warm all maps"}
          </button>
        </div>
        <p className="text-xs text-[#9c9483]">
          Fetches MX data for every official campaign map and stores it in <code>map_metadata</code>. Run once after deploying — makes the /mapguessr dropdown instant.
        </p>
        {warmProgress && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden bg-[#383228]">
              <div
                className="h-full bg-[#ff5800] transition-all"
                style={{ width: `${(warmProgress.totalCached / warmProgress.total) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-[#6b6557]" style={MONO}>
              {warmProgress.totalCached} / {warmProgress.total} cached
              {warmProgress.errors > 0 && ` · ${warmProgress.errors} errors`}
              {!warming && warmProgress.totalCached === warmProgress.total && " · ✓ done"}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button onClick={loadUncached} className="wrl-btn !px-3 !py-1.5 !text-[11px]">
            Show what&apos;s still uncached
          </button>
        </div>

        {uncachedView && (
          <div className="mt-3 border border-[#383228] bg-[#15130f]/60 p-3">
            <p className="mb-2 text-[11px] text-[#9c9483]">
              <span className="wrl-mono font-semibold text-[#eae3d2]">{uncachedView.uncached}</span> uncached, grouped by season:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
              {Object.entries(uncachedView.bySeason)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([season, names]) => (
                  <div key={season} className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[#eae3d2] font-semibold" style={MONO}>{season}</span>
                      <span className="text-[#6b6557]">{names.length}/25</span>
                    </div>
                    {names.length <= 5 && (
                      <p className="text-[#6b6557] ml-2 mt-0.5">
                        Missing: {names.map((n) => `#${n.match(/(\d{2})$/)?.[1] ?? "??"}`).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
