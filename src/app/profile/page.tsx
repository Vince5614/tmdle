"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

interface HistoryEntry {
  dayNumber: number;
  won: boolean;
  clueIndex: number;
  wrongGuesses: string[];
}

interface RankData {
  rank: number;
  total: number;
  percentile: number;
}

// clueIndex stores `guesses_used - 1`. We show a small streak of the user's
// guesses: red for each miss, green if they ultimately got it.
function emojiGrid(won: boolean, clueIndex: number): string {
  const guesses = clueIndex + 1;
  // Cap at 10 emojis so the UI doesn't blow up on long games
  const shown = Math.min(guesses, 10);
  const cells: string[] = [];
  for (let i = 0; i < shown - 1; i++) cells.push("🟥");
  cells.push(won ? "🟩" : "🟥");
  return cells.join("");
}

function dayNumberToDate(dayNumber: number): string {
  const launch = new Date("2026-05-14T00:00:00Z");
  const d = new Date(launch.getTime() + (dayNumber - 1) * 86_400_000);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric" });
}

function computeStreaks(entries: HistoryEntry[]) {
  const sorted = [...entries].sort((a, b) => a.dayNumber - b.dayNumber);
  let maxStreak = 0;
  let cur = 0;
  for (const e of sorted) {
    if (e.won) { cur++; maxStreak = Math.max(maxStreak, cur); }
    else cur = 0;
  }
  let streak = 0;
  for (const e of [...sorted].reverse()) {
    if (e.won) streak++;
    else break;
  }
  return { streak, maxStreak };
}

export default function ProfilePage() {
  const { isSignedIn, isLoaded } = useUser();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [ranks, setRanks] = useState<Record<number, RankData>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    async function load() {
      try {
        if (isSignedIn) {
          const res = await fetch("/api/results?game=mapguessr");
          if (res.ok) {
            const data = await res.json();
            const entries: HistoryEntry[] = data.map((r: { day_number: number; won: boolean; clue_index: number; wrong_guesses: string[] }) => ({
              dayNumber: r.day_number,
              won: r.won,
              clueIndex: r.clue_index,
              wrongGuesses: r.wrong_guesses ?? [],
            }));
            setHistory(entries);

            const rankResults = await Promise.all(
              entries.map((e) =>
                fetch(`/api/results/rank?game=mapguessr&day_number=${e.dayNumber}`)
                  .then((r) => r.json())
                  .then((d) => ({ dayNumber: e.dayNumber, ...d }))
                  .catch(() => null)
              )
            );
            const rankMap: Record<number, RankData> = {};
            rankResults.forEach((r) => {
              if (r?.rank) rankMap[r.dayNumber] = { rank: r.rank, total: r.total, percentile: r.percentile };
            });
            setRanks(rankMap);
          }
        } else {
          const raw = JSON.parse(localStorage.getItem("mg_history") ?? "[]");
          setHistory(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            raw.map((e: any) => ({
              dayNumber: e.dayNumber,
              won: e.won,
              clueIndex: e.clueIndex,
              wrongGuesses: e.wrongGuesses ?? [],
            }))
          );
        }
      } catch {}
      setReady(true);
    }
    load();
  }, [isLoaded, isSignedIn]);

  const sorted = [...history].sort((a, b) => b.dayNumber - a.dayNumber);
  const total = history.length;
  const wins = history.filter((e) => e.won).length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const { streak, maxStreak } = computeStreaks(history);

  const stats = [
    { label: "Played", value: total },
    { label: "Win %", value: `${winRate}%` },
    { label: "Streak", value: streak },
    { label: "Best", value: maxStreak },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1" style={{ fontFamily: "var(--font-display)" }}>
            MapGuessr
          </p>
          <h1 className="text-4xl text-white sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            Your
            <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent"> Stats</span>
          </h1>
        </div>

        {isLoaded && isSignedIn && (
          <SignOutButton>
            <button className="mt-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-400 transition-colors hover:text-gray-200"
              style={{ fontFamily: "var(--font-display)" }}>
              Sign out
            </button>
          </SignOutButton>
        )}
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal">
            <button className="mt-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-400 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/15"
              style={{ fontFamily: "var(--font-display)" }}>
              Sign in
            </button>
          </SignInButton>
        )}
      </div>

      {isLoaded && isSignedIn && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5">
          <span className="text-green-400 text-xs">●</span>
          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-display)" }}>
            Results saved to your account
          </p>
        </div>
      )}
      {isLoaded && !isSignedIn && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5">
          <span className="text-yellow-400 text-xs">●</span>
          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-display)" }}>
            Sign in to save results across devices
          </p>
        </div>
      )}

      {/* Stat tiles */}
      <div className="mb-8 grid grid-cols-4 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-[#111] p-4 text-center">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              {ready ? value : "—"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500" style={{ fontFamily: "var(--font-display)" }}>
          History
        </span>
        {total > 0 && (
          <span className="text-xs text-gray-600">{total} game{total !== 1 ? "s" : ""}</span>
        )}
      </div>
      <div className="h-px mb-4 bg-gradient-to-r from-cyan-500/30 via-white/8 to-transparent" />

      {!ready ? (
        <div className="flex justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-cyan-500" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-gray-500">No games played yet.</p>
          <Link
            href="/mapguessr"
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-400 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/15"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Play today&apos;s MapGuessr
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((entry) => {
            const rank = ranks[entry.dayNumber];
            return (
              <div
                key={entry.dayNumber}
                className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
                  entry.won ? "border-green-500/15 bg-green-500/5" : "border-white/5 bg-[#111]"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
                    {dayNumberToDate(entry.dayNumber)}
                  </p>
                  {rank && (
                    <p className="text-xs text-gray-500">
                      #{rank.rank} of {rank.total} · Top {rank.percentile}%
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base tracking-wider">{emojiGrid(entry.won, entry.clueIndex)}</span>
                  <span
                    className={`min-w-[64px] text-right text-xs font-semibold ${entry.won ? "text-green-400" : "text-red-400"}`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {entry.won
                      ? `${entry.clueIndex + 1} guess${entry.clueIndex + 1 !== 1 ? "es" : ""}`
                      : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
