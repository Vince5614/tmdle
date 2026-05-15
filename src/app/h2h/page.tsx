"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";

interface PlayerData {
  accountId: string;
  displayName: string;
  clubTag: string | null;
  countryFlag: string;
  zone: { name: string; flag: string } | null;
  trophies: { points: number; counts: number[]; echelon: number; zonePositions: number[] };
  matchmaking: {
    twoVTwo: { rank: number; score: number; total: number; division: string } | null;
    royal: { rank: number; score: number; total: number; division: string } | null;
  };
}

interface H2HData { player1: PlayerData; player2: PlayerData }

interface MapResult {
  name: string; number: number;
  p1Time: number | null; p2Time: number | null;
  p1Medal: number | null; p2Medal: number | null;
  authorTime: number | null; goldTime: number | null;
}
interface SeasonResult { season: string; maps: MapResult[]; p1Wins: number; p2Wins: number; tied: number }
interface CampaignData { seasons: SeasonResult[] }

interface SearchResult { accountId: string; name: string; zoneName: string; country: string; flag: string }

const ECHELON_COLORS: Record<number, string> = {
  0: "#555", 1: "#cd7f32", 2: "#a8a8a8", 3: "#ffd700",
  4: "#00c896", 5: "#00aaff", 6: "#aa44ff", 7: "#ff6600",
  8: "#ff0066", 9: "#ffffff",
};

const ECHELON_NAMES = ["Unranked", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Champion", "Legend"];

const TROPHY_TIERS = [
  { label: "T1", color: "#8B6914" },
  { label: "T2", color: "#909090" },
  { label: "T3", color: "#C8A832" },
  { label: "T4", color: "#00c896" },
  { label: "T5", color: "#0096e0" },
  { label: "T6", color: "#9b44e0" },
  { label: "T7", color: "#e06000" },
  { label: "T8", color: "#e00050" },
  { label: "T9", color: "#ffffff" },
];

const TOOLTIPS: Record<string, string> = {
  "Echelon": "Your trophy rank tier in TM2020. Goes from Bronze (1) to Legend (9). Determined by total trophy points earned.",
  "Trophy Points": "Total points earned from trophies across all competition modes and campaigns.",
  "2v2": "Ranked 2v2 matchmaking mode — two teams of two race head-to-head on random maps.",
  "Royal": "Free-for-all ranked mode where up to 5 players race for positions each round.",
  "National Rank": "Your trophy ranking within your country.",
  "Global Rank": "Your trophy ranking worldwide across all players.",
  "Division": "Your rank tier within a matchmaking mode (Bronze → Silver → Gold → Master → Trackmaster).",
  "Score": "Total matchmaking points accumulated this season.",
  "Percentile": "The percentage of players you rank above. Lower rank number = higher percentile.",
};

function fmtTime(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const mil = ms % 1000;
  if (min === 0) return `${sec}.${String(mil).padStart(3, "0")}`;
  return `${min}:${String(sec).padStart(2, "0")}.${String(mil).padStart(3, "0")}`;
}

const MEDAL_COLORS: Record<number, string> = { 1: "#cd7f32", 2: "#a8a8a8", 3: "#ffd700", 4: "#00e0a0" };
const MEDAL_LABELS: Record<number, string> = { 1: "🥉", 2: "🥈", 3: "🥇", 4: "AT" };

function Tooltip({ id, children }: { id: string; children: React.ReactNode }) {
  const text = TOOLTIPS[id];
  if (!text) return <>{children}</>;
  return (
    <span className="relative group inline-flex items-center gap-1 cursor-help">
      <span className="border-b border-dashed border-gray-600/60">{children}</span>
      <span className="text-gray-600 text-[10px]">?</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-30 text-center leading-relaxed shadow-xl">
        {text}
      </span>
    </span>
  );
}

function PlayerSearch({ placeholder, onSelect }: { placeholder: string; onSelect: (name: string) => void }) {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value.length < 2) { setResults([]); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/h2h/search?q=${encodeURIComponent(value)}`);
      if (res.ok) setResults(await res.json());
    }, 280);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value]);

  function select(name: string) {
    setValue(name);
    onSelect(name);
    setOpen(false);
  }

  return (
    <div className="relative flex-1">
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-colors"
        style={{ fontFamily: "var(--font-display)" }}
        placeholder={placeholder}
        value={value}
        onChange={e => { setValue(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={e => e.key === "Enter" && value.trim() && select(value.trim())}
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden z-20 shadow-2xl">
          {results.map(r => (
            <button
              key={r.accountId}
              onMouseDown={() => select(r.name)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-xl">{r.flag}</span>
              <div className="min-w-0">
                <p className="text-sm text-white truncate" style={{ fontFamily: "var(--font-display)" }}>{r.name}</p>
                <p className="text-xs text-gray-500">{r.zoneName}{r.country && r.country !== r.zoneName ? `, ${r.country}` : ""}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function fmt(n: number) { return n.toLocaleString("en-US"); }

function winner1(a: number, b: number, lowerBetter = false): 1 | 2 | 0 {
  if (a === b) return 0;
  return (lowerBetter ? a < b : a > b) ? 1 : 2;
}

function Bar({ v1, v2 }: { v1: number; v2: number }) {
  const total = v1 + v2;
  const p = total === 0 ? 50 : Math.round((v1 / total) * 100);
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden flex mt-1">
      <div style={{ width: `${p}%`, background: "#22d3ee", transition: "width 0.7s ease" }} />
      <div style={{ width: `${100 - p}%`, background: "#818cf8", transition: "width 0.7s ease" }} />
    </div>
  );
}

function StatRow({ label, v1, v2, w, tooltip }: { label: string; v1: string; v2: string; w: 1 | 2 | 0; tooltip?: string }) {
  const label_el = tooltip ? <Tooltip id={tooltip}>{label}</Tooltip> : label;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-3 border-b border-white/5 last:border-0">
      <div className={`text-right text-sm font-semibold truncate ${w === 1 ? "text-white" : "text-gray-500"}`} style={{ fontFamily: "var(--font-display)" }}>
        {w === 1 && <span className="mr-1.5 text-cyan-400 text-xs">✓</span>}{v1}
      </div>
      <div className="text-center text-[10px] uppercase tracking-widest text-gray-400 w-28 shrink-0">{label_el}</div>
      <div className={`text-left text-sm font-semibold truncate ${w === 2 ? "text-white" : "text-gray-500"}`} style={{ fontFamily: "var(--font-display)" }}>
        {w === 2 && <span className="ml-1.5 text-purple-400 text-xs">✓</span>}{v2}
      </div>
    </div>
  );
}

function percentile(rank: number, total: number) {
  return Math.round(((total - rank) / total) * 100);
}

export default function H2HPage() {
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [data, setData] = useState<H2HData | null>(null);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compare() {
    if (!p1Name.trim() || !p2Name.trim()) return;
    setLoading(true); setError(null); setData(null); setCampaign(null); setCampaignError(null);
    try {
      const res = await fetch(`/api/h2h?p1=${encodeURIComponent(p1Name.trim())}&p2=${encodeURIComponent(p2Name.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setData(json);
      // Fetch campaign data after profile loads
      setCampaignLoading(true);
      const cr = await fetch(`/api/h2h/campaign?p1=${json.player1.accountId}&p2=${json.player2.accountId}`);
      const cj = await cr.json();
      if (!cr.ok) throw new Error(cj.error ?? "Campaign data unavailable");
      setCampaign(cj);
      setActiveSeason(cj.seasons[cj.seasons.length - 1]?.season ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    }
    finally { setLoading(false); setCampaignLoading(false); }
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter") compare();
  }

  const p1 = data?.player1;
  const p2 = data?.player2;

  const wTrophy = p1 && p2 ? winner1(p1.trophies.points, p2.trophies.points) : 0;
  const wEch = p1 && p2 ? winner1(p1.trophies.echelon, p2.trophies.echelon) : 0;
  const w2v2 = p1?.matchmaking.twoVTwo && p2?.matchmaking.twoVTwo ? winner1(p1.matchmaking.twoVTwo.rank, p2.matchmaking.twoVTwo.rank, true) : 0;
  const wRoyal = p1?.matchmaking.royal && p2?.matchmaking.royal ? winner1(p1.matchmaking.royal.rank, p2.matchmaking.royal.rank, true) : 0;
  const wNat = p1 && p2 ? winner1(p1.trophies.zonePositions[2] ?? 0, p2.trophies.zonePositions[2] ?? 0, true) : 0;
  const wGlob = p1 && p2 ? winner1(p1.trophies.zonePositions[3] ?? 0, p2.trophies.zonePositions[3] ?? 0, true) : 0;

  const cats = [wTrophy, wEch, w2v2, wRoyal];
  const s1 = cats.filter(w => w === 1).length;
  const s2 = cats.filter(w => w === 2).length;
  const overall = s1 > s2 ? 1 : s2 > s1 ? 2 : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Head to Head
        </p>
        <h1 className="text-4xl text-white sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          Player
          <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent"> Comparison</span>
        </h1>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10 items-stretch">
        <PlayerSearch placeholder="Player 1 username" onSelect={setP1Name} />
        <div className="flex items-center justify-center text-gray-600 text-xs font-bold tracking-widest" style={{ fontFamily: "var(--font-display)" }}>VS</div>
        <PlayerSearch placeholder="Player 2 username" onSelect={setP2Name} />
        <button
          onClick={compare}
          onKeyDown={onKey}
          disabled={loading || !p1Name.trim() || !p2Name.trim()}
          className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {loading ? "Loading…" : "Compare"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-cyan-500" />
        </div>
      )}

      {data && p1 && p2 && (
        <div className="flex flex-col gap-5">
          {/* Banner */}
          <div className={`rounded-xl border px-6 py-5 grid grid-cols-3 items-center gap-4 ${overall === 1 ? "border-cyan-500/25 bg-cyan-500/5" : overall === 2 ? "border-purple-500/25 bg-purple-500/5" : "border-white/8 bg-white/[0.02]"}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{p1.countryFlag}</span>
                <p className="text-xl font-bold text-white truncate" style={{ fontFamily: "var(--font-display)" }}>{p1.displayName}</p>
              </div>
              {p1.zone && <p className="text-xs text-gray-400 mt-0.5 pl-8">{p1.zone.name}</p>}
              <div className="mt-2 flex items-center gap-1.5 pl-8">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: ECHELON_COLORS[p1.trophies.echelon] }} />
                <span className="text-xs text-gray-400">{ECHELON_NAMES[p1.trophies.echelon]}</span>
              </div>
            </div>
            <div className="text-center">
              {overall !== 0 ? (
                <>
                  <p className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{s1} – {s2}</p>
                  <p className="text-xs text-gray-400 mt-1">{overall === 1 ? p1.displayName : p2.displayName} wins</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-400" style={{ fontFamily: "var(--font-display)" }}>TIE</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <p className="text-xl font-bold text-white truncate" style={{ fontFamily: "var(--font-display)" }}>{p2.displayName}</p>
                <span className="text-xl">{p2.countryFlag}</span>
              </div>
              {p2.zone && <p className="text-xs text-gray-400 mt-0.5 pr-8">{p2.zone.name}</p>}
              <div className="mt-2 flex items-center justify-end gap-1.5 pr-8">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: ECHELON_COLORS[p2.trophies.echelon] }} />
                <span className="text-xs text-gray-400">{ECHELON_NAMES[p2.trophies.echelon]}</span>
              </div>
            </div>
          </div>

          {/* Trophy points bar */}
          <div className="rounded-xl border border-white/8 bg-[#111] px-5 py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-cyan-400" style={{ fontFamily: "var(--font-display)" }}>{fmt(p1.trophies.points)}</span>
              <span className="text-[10px] uppercase tracking-widest text-gray-600"><Tooltip id="Trophy Points">Trophy Points</Tooltip></span>
              <span className="text-sm font-bold text-purple-400" style={{ fontFamily: "var(--font-display)" }}>{fmt(p2.trophies.points)}</span>
            </div>
            <Bar v1={p1.trophies.points} v2={p2.trophies.points} />
          </div>

          {/* Echelon */}
          <div className="rounded-xl border border-white/8 bg-[#111] px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3 text-center"><Tooltip id="Echelon">Echelon</Tooltip></p>
            <div className="grid grid-cols-2 gap-4">
              {[p1, p2].map((p, i) => (
                <div key={i} className={`rounded-lg border px-4 py-3 text-center ${i === 0 ? "border-cyan-500/20" : "border-purple-500/20"}`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full" style={{ background: ECHELON_COLORS[p.trophies.echelon] }} />
                    <span className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{ECHELON_NAMES[p.trophies.echelon]}</span>
                  </div>
                  <p className="text-xs text-gray-500">Level {p.trophies.echelon}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trophy tier breakdown */}
          <div className="rounded-xl border border-white/8 bg-[#111] px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-4 text-center">Trophy Breakdown</p>
            <div className="flex flex-col gap-2.5">
              {TROPHY_TIERS.map((tier, i) => {
                const a = p1.trophies.counts[i] ?? 0;
                const b = p2.trophies.counts[i] ?? 0;
                if (a === 0 && b === 0) return null;
                const total = a + b;
                const pct1 = total === 0 ? 50 : Math.round((a / total) * 100);
                return (
                  <div key={tier.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-semibold ${a >= b ? "text-white" : "text-gray-500"}`} style={{ fontFamily: "var(--font-display)" }}>{fmt(a)}</span>
                      <span style={{ color: tier.color }} className="font-bold text-[10px]">{tier.label}</span>
                      <span className={`font-semibold ${b >= a ? "text-white" : "text-gray-500"}`} style={{ fontFamily: "var(--font-display)" }}>{fmt(b)}</span>
                    </div>
                    <div className="h-1 w-full rounded-full overflow-hidden flex bg-white/5">
                      <div style={{ width: `${pct1}%`, background: "#22d3ee", transition: "width 0.7s ease" }} />
                      <div style={{ width: `${100 - pct1}%`, background: "#818cf8" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats table */}
          <div className="rounded-xl border border-white/8 bg-[#111] px-5 py-2">
            <StatRow label="Trophy Points" tooltip="Trophy Points" v1={fmt(p1.trophies.points)} v2={fmt(p2.trophies.points)} w={wTrophy} />
            <StatRow label="Echelon" tooltip="Echelon" v1={`${ECHELON_NAMES[p1.trophies.echelon]} (${p1.trophies.echelon})`} v2={`${ECHELON_NAMES[p2.trophies.echelon]} (${p2.trophies.echelon})`} w={wEch} />
            {p1.trophies.zonePositions[2] != null && p2.trophies.zonePositions[2] != null && (
              <StatRow label="National Rank" tooltip="National Rank" v1={`#${fmt(p1.trophies.zonePositions[2])}`} v2={`#${fmt(p2.trophies.zonePositions[2])}`} w={wNat} />
            )}
            {p1.trophies.zonePositions[3] != null && p2.trophies.zonePositions[3] != null && (
              <StatRow label="Global Rank" tooltip="Global Rank" v1={`#${fmt(p1.trophies.zonePositions[3])}`} v2={`#${fmt(p2.trophies.zonePositions[3])}`} w={wGlob} />
            )}
            {p1.matchmaking.twoVTwo && p2.matchmaking.twoVTwo && (
              <>
                <StatRow label="2v2 Rank" tooltip="2v2" v1={`#${fmt(p1.matchmaking.twoVTwo.rank)}`} v2={`#${fmt(p2.matchmaking.twoVTwo.rank)}`} w={w2v2} />
                <StatRow label="2v2 Division" tooltip="Division" v1={p1.matchmaking.twoVTwo.division} v2={p2.matchmaking.twoVTwo.division} w={0} />
                <StatRow label="2v2 Score" tooltip="Score" v1={fmt(p1.matchmaking.twoVTwo.score)} v2={fmt(p2.matchmaking.twoVTwo.score)} w={winner1(p1.matchmaking.twoVTwo.score, p2.matchmaking.twoVTwo.score)} />
              </>
            )}
            {p1.matchmaking.royal && p2.matchmaking.royal && (
              <>
                <StatRow label="Royal Rank" tooltip="Royal" v1={`#${fmt(p1.matchmaking.royal.rank)}`} v2={`#${fmt(p2.matchmaking.royal.rank)}`} w={wRoyal} />
                <StatRow label="Royal Division" tooltip="Division" v1={p1.matchmaking.royal.division} v2={p2.matchmaking.royal.division} w={0} />
              </>
            )}
          </div>

          {/* Ranked percentile bars */}
          {p1.matchmaking.twoVTwo && p2.matchmaking.twoVTwo && (
            <div className="rounded-xl border border-white/8 bg-[#111] px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3 text-center"><Tooltip id="Percentile">2v2 Percentile</Tooltip></p>
              <div className="grid grid-cols-2 gap-3">
                {[{ p: p1, mm: p1.matchmaking.twoVTwo, col: "#22d3ee" }, { p: p2, mm: p2.matchmaking.twoVTwo!, col: "#818cf8" }].map(({ p, mm, col }, i) => {
                  const pct = percentile(mm.rank, mm.total);
                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 truncate" style={{ fontFamily: "var(--font-display)" }}>{p.displayName}</span>
                        <span className="font-bold text-white ml-2" style={{ fontFamily: "var(--font-display)" }}>Top {100 - pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div style={{ width: `${pct}%`, background: col, transition: "width 0.7s ease" }} className="h-full rounded-full" />
                      </div>
                      <p className="text-xs text-gray-400 text-center mt-0.5">#{fmt(mm.rank)} of {fmt(mm.total)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campaign comparison */}
          <div className="rounded-xl border border-white/8 bg-[#111] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-gray-500" style={{ fontFamily: "var(--font-display)" }}>Campaign Comparison</p>
              {campaign && (
                <p className="text-xs text-gray-600">
                  {campaign.seasons.reduce((a, s) => a + s.p1Wins, 0)}–{campaign.seasons.reduce((a, s) => a + s.p2Wins, 0)} overall
                </p>
              )}
            </div>

            {campaignLoading && (
              <div className="flex justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-cyan-500" />
              </div>
            )}

            {campaignError && (
              <div className="px-5 py-4 text-xs text-red-400">{campaignError}</div>
            )}

            {campaign && (
              <>
                {/* Season tabs */}
                <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
                  {campaign.seasons.map(s => (
                    <button
                      key={s.season}
                      onClick={() => setActiveSeason(s.season)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition-colors ${activeSeason === s.season ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {s.season}
                    </button>
                  ))}
                </div>

                {campaign.seasons.filter(s => s.season === activeSeason).map(s => (
                  <div key={s.season} className="p-4">
                    {/* Season summary */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: p1?.displayName ?? "P1", value: s.p1Wins, color: "text-cyan-400" },
                        { label: "Tied", value: s.tied, color: "text-gray-500" },
                        { label: p2?.displayName ?? "P2", value: s.p2Wins, color: "text-purple-400" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
                          <p className={`text-2xl font-black ${color}`} style={{ fontFamily: "var(--font-display)" }}>{value}</p>
                          <p className="text-[10px] text-gray-600 truncate">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Map table */}
                    <div className="rounded-xl border border-white/5 overflow-hidden">
                      <div className="grid grid-cols-[1fr_32px_auto_32px_1fr] text-[10px] uppercase tracking-widest text-gray-600 px-3 py-2 border-b border-white/5">
                        <span className="text-right">{p1?.displayName}</span>
                        <span />
                        <span className="text-center">Map</span>
                        <span />
                        <span>{p2?.displayName}</span>
                      </div>
                      {s.maps.map(m => {
                        const p1faster = m.p1Time !== null && m.p2Time !== null && m.p1Time < m.p2Time;
                        const p2faster = m.p1Time !== null && m.p2Time !== null && m.p2Time < m.p1Time;
                        const gap = m.p1Time !== null && m.p2Time !== null ? Math.abs(m.p1Time - m.p2Time) : null;
                        return (
                          <div key={m.name} className="grid grid-cols-[1fr_32px_auto_32px_1fr] items-center px-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                            <div className="text-right">
                              {m.p1Time !== null ? (
                                <span className={`text-xs font-semibold ${p1faster ? "text-white" : "text-gray-500"}`} style={{ fontFamily: "var(--font-display)" }}>
                                  {fmtTime(m.p1Time)}
                                </span>
                              ) : <span className="text-xs text-gray-700">—</span>}
                              {m.p1Medal && <span className="ml-1 text-[10px]" style={{ color: MEDAL_COLORS[m.p1Medal] }}>{MEDAL_LABELS[m.p1Medal]}</span>}
                            </div>
                            <div className="flex justify-center">
                              {p1faster && <span className="text-[10px] text-cyan-500">◀</span>}
                              {p2faster && <span className="text-[10px] text-purple-500">▶</span>}
                            </div>
                            <div className="text-center min-w-[60px]">
                              <p className="text-[10px] text-gray-600 leading-none">{String(m.number).padStart(2, "0")}</p>
                              {gap !== null && <p className="text-[9px] text-gray-700">{fmtTime(gap)}</p>}
                            </div>
                            <div className="flex justify-center">
                              {p2faster && <span className="text-[10px] text-purple-500">◀</span>}
                              {p1faster && <span className="text-[10px] text-cyan-500">▶</span>}
                            </div>
                            <div className="text-left">
                              {m.p2Medal && <span className="mr-1 text-[10px]" style={{ color: MEDAL_COLORS[m.p2Medal] }}>{MEDAL_LABELS[m.p2Medal]}</span>}
                              {m.p2Time !== null ? (
                                <span className={`text-xs font-semibold ${p2faster ? "text-white" : "text-gray-500"}`} style={{ fontFamily: "var(--font-display)" }}>
                                  {fmtTime(m.p2Time)}
                                </span>
                              ) : <span className="text-xs text-gray-700">—</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
