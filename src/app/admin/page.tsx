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

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
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
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setStats(d);
      })
      .catch(() => setError("Failed to load stats"));
  }, [isAdmin]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-cyan-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center py-32">
        <p className="text-gray-500 text-sm">Access denied.</p>
      </div>
    );
  }

  const totalGuests = stats?.days.reduce((a, d) => a + d.guests, 0) ?? 0;
  const totalSignedIn = stats?.days.reduce((a, d) => a + d.signedIn, 0) ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1" style={{ fontFamily: "var(--font-display)" }}>Admin</p>
        <h1 className="text-4xl text-white" style={{ fontFamily: "var(--font-display)" }}>
          Dashboard
        </h1>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* MapGuessr 2.0 cache pre-warm */}
      <div className="mb-8 rounded-xl border border-white/8 bg-[#111] p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-widest text-gray-500" style={{ fontFamily: "var(--font-display)" }}>
            MapGuessr 2.0 — MX Cache
          </p>
          <button
            onClick={runPreWarm}
            disabled={warming}
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-400 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/15 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {warming ? "Caching…" : "Pre-warm all maps"}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Fetches MX data for every official campaign map and stores it in <code>map_metadata</code>. Run once after deploying — makes the /mapguessr dropdown instant.
        </p>
        {warmProgress && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${(warmProgress.totalCached / warmProgress.total) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500" style={{ fontFamily: "var(--font-display)" }}>
              {warmProgress.totalCached} / {warmProgress.total} cached
              {warmProgress.errors > 0 && ` · ${warmProgress.errors} errors`}
              {!warming && warmProgress.totalCached === warmProgress.total && " · ✓ done"}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={loadUncached}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Show what&apos;s still uncached
          </button>
        </div>

        {uncachedView && (
          <div className="mt-3 rounded-lg border border-white/8 bg-black/30 p-3">
            <p className="mb-2 text-[11px] text-gray-400">
              <span className="font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>{uncachedView.uncached}</span> uncached, grouped by season:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
              {Object.entries(uncachedView.bySeason)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([season, names]) => (
                  <div key={season} className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-gray-300 font-semibold" style={{ fontFamily: "var(--font-display)" }}>{season}</span>
                      <span className="text-gray-500">{names.length}/25</span>
                    </div>
                    {names.length <= 5 && (
                      <p className="text-gray-600 ml-2 mt-0.5">
                        Missing: {names.map((n) => `#${n.match(/(\d{2})$/)?.[1] ?? "??"}`).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {stats && (
        <>
          {/* All-time summary */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Total Plays", value: stats.totalAllTime },
              { label: "Signed In", value: totalSignedIn },
              { label: "Guests", value: totalGuests },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-[#111] p-4 text-center">
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Per-day table */}
          <div className="rounded-xl border border-white/8 bg-[#111] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <p className="text-xs uppercase tracking-widest text-gray-500" style={{ fontFamily: "var(--font-display)" }}>By Day</p>
            </div>
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] text-[10px] uppercase tracking-widest text-gray-600 px-5 py-2 border-b border-white/5 gap-3">
              <span>Date</span>
              <span className="text-right">Total</span>
              <span className="text-right">Signed In</span>
              <span className="text-right">Guests</span>
              <span className="text-right">Win %</span>
              <span className="text-right">Avg Clue</span>
            </div>
            {stats.days.map(d => (
              <div key={d.dayNumber} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] px-5 py-3 border-b border-white/5 last:border-0 gap-3 items-center hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-xs text-white font-semibold" style={{ fontFamily: "var(--font-display)" }}>{dayNumberToDate(d.dayNumber)}</p>
                  <p className="text-[10px] text-gray-600">Day #{d.dayNumber}</p>
                </div>
                <p className="text-sm text-white text-right font-semibold" style={{ fontFamily: "var(--font-display)" }}>{d.total}</p>
                <p className="text-sm text-cyan-400 text-right" style={{ fontFamily: "var(--font-display)" }}>{d.signedIn}</p>
                <p className="text-sm text-purple-400 text-right" style={{ fontFamily: "var(--font-display)" }}>{d.guests}</p>
                <p className={`text-sm text-right font-semibold ${d.winRate >= 50 ? "text-green-400" : "text-red-400"}`} style={{ fontFamily: "var(--font-display)" }}>
                  {d.winRate}%
                </p>
                <p className="text-sm text-gray-400 text-right" style={{ fontFamily: "var(--font-display)" }}>{d.avgClue}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
