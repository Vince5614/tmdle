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

  const email = user?.emailAddresses[0]?.emailAddress;
  const isAdmin = isLoaded && email === ADMIN_EMAIL;

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
