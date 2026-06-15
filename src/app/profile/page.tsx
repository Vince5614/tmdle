"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

type Game = "mapguessr" | "wrorlower";

interface Entry {
  dayNumber: number;
  won: boolean;
  // MapGuessr: clueIndex = guesses_used - 1 (lower is better).
  // Higher or Lower: clueIndex = score 0–10 (higher is better).
  clueIndex: number;
  cells: string; // emoji result grid
}

interface RankData {
  rank: number;
  total: number;
  percentile: number;
}

const MONO = { fontFamily: "var(--font-mono)" } as const;
const DISPLAY = { fontFamily: "var(--font-display)" } as const;

const GAME_LABEL: Record<Game, string> = {
  mapguessr: "MapGuessr",
  wrorlower: "Higher or Lower",
};

// MapGuessr: a streak of misses then the final guess (green if solved).
function mapguessrGrid(won: boolean, clueIndex: number): string {
  const shown = Math.min(clueIndex + 1, 10);
  const cells: string[] = [];
  for (let i = 0; i < shown - 1; i++) cells.push("🟥");
  cells.push(won ? "🟩" : "🟥");
  return cells.join("");
}

// Higher or Lower: one square per round from the stored "1"/"0" array.
function holGrid(wrongGuesses: string[]): string {
  return wrongGuesses.map((s) => (s === "1" ? "🟩" : "🟥")).join("");
}

function dayNumberToDate(dayNumber: number): string {
  const launch = new Date("2026-05-14T00:00:00Z");
  const d = new Date(launch.getTime() + (dayNumber - 1) * 86_400_000);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric" });
}

function computeStreaks(entries: Entry[]) {
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

function summarize(game: Game, entries: Entry[]) {
  const total = entries.length;
  const wins = entries.filter((e) => e.won).length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const { streak, maxStreak } = computeStreaks(entries);

  if (game === "wrorlower") {
    const avg = total > 0
      ? Math.round((entries.reduce((a, e) => a + e.clueIndex, 0) / total) * 10) / 10
      : 0;
    return [
      { label: "Played", value: total },
      { label: "Avg score", value: total > 0 ? avg : "—" },
      { label: "Win %", value: `${winRate}%` },
      { label: "Best streak", value: maxStreak },
    ];
  }
  return [
    { label: "Played", value: total },
    { label: "Win %", value: `${winRate}%` },
    { label: "Streak", value: streak },
    { label: "Best", value: maxStreak },
  ];
}

export default function ProfilePage() {
  const { isSignedIn, isLoaded } = useUser();
  const [tab, setTab] = useState<Game>("mapguessr");
  const [histories, setHistories] = useState<Record<Game, Entry[]>>({ mapguessr: [], wrorlower: [] });
  const [ranks, setRanks] = useState<Record<number, RankData>>({}); // MapGuessr only
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    async function load() {
      try {
        if (isSignedIn) {
          const [mgRes, holRes] = await Promise.all([
            fetch("/api/results?game=mapguessr"),
            fetch("/api/results?game=wrorlower"),
          ]);

          const mg: Entry[] = mgRes.ok
            ? (await mgRes.json()).map((r: { day_number: number; won: boolean; clue_index: number; wrong_guesses: string[] }) => ({
                dayNumber: r.day_number,
                won: r.won,
                clueIndex: r.clue_index,
                cells: mapguessrGrid(r.won, r.clue_index),
              }))
            : [];

          const hol: Entry[] = holRes.ok
            ? (await holRes.json()).map((r: { day_number: number; won: boolean; clue_index: number; wrong_guesses: string[] }) => ({
                dayNumber: r.day_number,
                won: r.won,
                clueIndex: r.clue_index,
                cells: holGrid(r.wrong_guesses ?? []),
              }))
            : [];

          setHistories({ mapguessr: mg, wrorlower: hol });

          // Ranks only make sense for MapGuessr's scoring.
          const rankResults = await Promise.all(
            mg.map((e) =>
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
        } else {
          // Guest: MapGuessr keeps an aggregated list; Higher or Lower stores
          // one key per completed daily (hol_v1_<day>).
          const mgRaw = JSON.parse(localStorage.getItem("mg_history") ?? "[]");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mg: Entry[] = mgRaw.map((e: any) => ({
            dayNumber: e.dayNumber,
            won: e.won,
            clueIndex: e.clueIndex,
            cells: mapguessrGrid(e.won, e.clueIndex),
          }));

          const hol: Entry[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const m = key?.match(/^hol_v1_(\d+)$/);
            if (!m) continue;
            try {
              const parsed = JSON.parse(localStorage.getItem(key!)!);
              const results: boolean[] = Array.isArray(parsed.results) ? parsed.results : [];
              const score = typeof parsed.score === "number" ? parsed.score : results.filter(Boolean).length;
              hol.push({
                dayNumber: parseInt(m[1], 10),
                won: score >= 6,
                clueIndex: score,
                cells: results.map((b) => (b ? "🟩" : "🟥")).join(""),
              });
            } catch {}
          }

          setHistories({ mapguessr: mg, wrorlower: hol });
        }
      } catch {}
      setReady(true);
    }
    load();
  }, [isLoaded, isSignedIn]);

  const entries = histories[tab];
  const sorted = [...entries].sort((a, b) => b.dayNumber - a.dayNumber);
  const total = entries.length;
  const stats = summarize(tab, entries);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="wrl-label mb-1">TMDLE</p>
          <h1 className="text-4xl text-[#eae3d2] sm:text-5xl" style={DISPLAY}>
            Your <span className="text-[#ff5800]">Stats</span>
          </h1>
        </div>

        {isLoaded && isSignedIn && (
          <SignOutButton>
            <button className="wrl-btn mt-1 !px-4 !py-2 !text-xs">Sign out</button>
          </SignOutButton>
        )}
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal">
            <button className="wrl-btn-primary mt-1 !px-4 !py-2 !text-xs">Sign in</button>
          </SignInButton>
        )}
      </div>

      {/* Storage banner */}
      {isLoaded && (
        <div className="mb-6 flex items-center gap-2 border border-[#383228] bg-[#1d1a15] px-4 py-2.5">
          <span className={isSignedIn ? "text-[#6fbf73]" : "text-[#d9a13b]"}>●</span>
          <p className="text-xs text-[#9c9483]" style={MONO}>
            {isSignedIn ? "Results saved to your account" : "Sign in to save results across devices"}
          </p>
        </div>
      )}

      {/* Game toggle */}
      <div className="mb-6 flex gap-2">
        {(["mapguessr", "wrorlower"] as Game[]).map((g) => {
          const active = tab === g;
          return (
            <button
              key={g}
              onClick={() => setTab(g)}
              className={`flex-1 border px-4 py-2.5 text-sm uppercase tracking-wider transition-colors ${
                active
                  ? "border-[#ff5800] bg-[#ff5800] text-[#15130f]"
                  : "border-[#383228] text-[#9c9483] hover:border-[#9c9483] hover:text-[#eae3d2]"
              }`}
              style={DISPLAY}
            >
              {GAME_LABEL[g]}
            </button>
          );
        })}
      </div>

      {/* Stat tiles */}
      <div className="mb-8 grid grid-cols-4 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="border border-[#383228] bg-[#1d1a15] p-4 text-center">
            <p className="wrl-mono text-2xl font-semibold text-[#eae3d2] tabular-nums">
              {ready ? value : "—"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-[#6b6557]" style={MONO}>{label}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="mb-3 flex items-center justify-between">
        <span className="wrl-label">{GAME_LABEL[tab]} history</span>
        {total > 0 && (
          <span className="text-xs text-[#6b6557]" style={MONO}>{total} game{total !== 1 ? "s" : ""}</span>
        )}
      </div>
      <div className="mb-4 h-px bg-[#383228]" />

      {!ready ? (
        <div className="flex justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#383228] border-t-[#ff5800]" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-[#9c9483]">No {GAME_LABEL[tab]} games played yet.</p>
          <Link href={tab === "mapguessr" ? "/mapguessr" : "/higherorlower"} className="wrl-btn-primary">
            Play today&apos;s {GAME_LABEL[tab]}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((entry) => {
            const rank = tab === "mapguessr" ? ranks[entry.dayNumber] : undefined;
            return (
              <div
                key={entry.dayNumber}
                className={`flex items-center justify-between border px-5 py-4 ${
                  entry.won ? "border-[#6fbf73]/25 bg-[#6fbf73]/5" : "border-[#383228] bg-[#1d1a15]"
                }`}
              >
                <div>
                  <p className="wrl-mono text-sm font-semibold text-[#eae3d2]">
                    {dayNumberToDate(entry.dayNumber)}
                  </p>
                  {rank ? (
                    <p className="text-xs text-[#6b6557]" style={MONO}>
                      #{rank.rank} of {rank.total} · Top {rank.percentile}%
                    </p>
                  ) : (
                    <p className="text-xs text-[#6b6557]" style={MONO}>Day #{entry.dayNumber}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base tracking-wider">{entry.cells}</span>
                  <span
                    className={`min-w-[64px] text-right text-xs font-semibold ${entry.won ? "text-[#6fbf73]" : "text-[#e0492e]"}`}
                    style={MONO}
                  >
                    {tab === "wrorlower"
                      ? `${entry.clueIndex}/10`
                      : entry.won
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
