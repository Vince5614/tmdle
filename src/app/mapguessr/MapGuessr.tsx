"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { buildGuessRow } from "@/lib/mapguessr2";
import type { Challenge2, GuessRow, EnrichedMap, CellState, AttributeCell } from "@/types/mapguessr2";

// ─── Cell ─────────────────────────────────────────────────────────────────────

const BG: Record<CellState, string> = {
  correct: "bg-green-500",
  present: "bg-yellow-400",
  absent:  "bg-red-600",
};
const FG: Record<CellState, string> = {
  correct: "text-white",
  present: "text-black",
  absent:  "text-white",
};

function Cell({ cell, wide }: { cell: AttributeCell; wide?: boolean }) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center rounded-lg px-1 py-1 text-center
        font-semibold text-xs leading-tight select-none transition-all duration-300
        ${wide ? "min-w-[90px]" : "min-w-[68px]"} h-[58px]
        ${BG[cell.state]} ${FG[cell.state]}
      `}
      style={{ fontFamily: "var(--font-display)" }}
    >
      <span className="break-words max-w-full">{cell.value || "—"}</span>
      {cell.direction && (
        <span className="text-sm mt-0.5 opacity-90 font-bold">
          {cell.direction === "up" ? "↑" : "↓"}
        </span>
      )}
    </div>
  );
}

// ─── Thumbnail with hover-preview ─────────────────────────────────────────────
// Preview is rendered through a portal at document.body level so it escapes
// every parent `overflow-hidden` container (dropdown, comparison table, etc.).
// Position is calculated from the thumbnail's bounding rect with smart flipping
// to stay inside the viewport.

const PREVIEW_W = 420;
const PREVIEW_H = 236;
const PREVIEW_GAP = 8;

function MapThumb({
  src,
  alt,
  size = "md",
}: {
  src: string | null;
  alt: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? { w: 56, h: 32 } : { w: 84, h: 47 };
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  // Portal target only exists in the browser
  useEffect(() => setMounted(true), []);

  function computePosition() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const margin = 12;

    // Prefer right of the thumbnail
    let x = r.right + PREVIEW_GAP;
    let y = r.top + r.height / 2 - PREVIEW_H / 2;

    // Flip to left if there's no room on the right
    if (x + PREVIEW_W > window.innerWidth - margin) {
      x = r.left - PREVIEW_W - PREVIEW_GAP;
    }
    // If still off-screen (narrow viewport), drop below the thumbnail
    if (x < margin) {
      x = Math.max(margin, Math.min(r.left, window.innerWidth - PREVIEW_W - margin));
      y = r.bottom + PREVIEW_GAP;
    }
    // Keep vertically in-viewport
    y = Math.max(margin, Math.min(y, window.innerHeight - PREVIEW_H - margin));

    setPos({ x, y });
  }

  function handleEnter() {
    if (!src) return;
    computePosition();
    setHover(true);
  }

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHover(false)}
        className="relative shrink-0 rounded-md overflow-hidden bg-white/5 cursor-zoom-in"
        style={{ width: dim.w, height: dim.h }}
      >
        {src ? (
          <Image src={src} alt={alt} fill className="object-cover" sizes={`${dim.w}px`} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-gray-600 text-xs">?</span>
          </div>
        )}
      </div>

      {mounted && hover && src &&
        createPortal(
          <div
            className="fixed z-[1000] pointer-events-none"
            style={{ left: pos.x, top: pos.y, width: PREVIEW_W, height: PREVIEW_H }}
          >
            <div className="relative h-full w-full rounded-lg overflow-hidden border-2 border-white/30 shadow-[0_12px_40px_rgba(0,0,0,0.85)] bg-black">
              <Image src={src} alt={alt} fill className="object-cover" sizes={`${PREVIEW_W}px`} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ─── Column headers ───────────────────────────────────────────────────────────

const COLUMNS = [
  { label: "Season",  wide: false },
  { label: "Year",    wide: false },
  { label: "#",       wide: false },
  { label: "Surface", wide: false },
  { label: "Car",     wide: false },
  { label: "Style",   wide: true  },
  { label: "Length",  wide: true  },
];

function ColumnHeaders() {
  return (
    <div className="flex items-center gap-2 pb-2.5 min-w-max border-b border-white/8">
      <div
        className="min-w-[200px] text-[10px] uppercase tracking-widest text-gray-500"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Map
      </div>
      {COLUMNS.map(({ label, wide }) => (
        <div
          key={label}
          className={`text-center text-[10px] uppercase tracking-widest text-gray-500 ${wide ? "min-w-[90px]" : "min-w-[68px]"}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── Single guess row ─────────────────────────────────────────────────────────

function GuessRowView({ row, isNewest }: { row: GuessRow; isNewest: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-2.5 min-w-max border-b border-white/5 last:border-0 ${isNewest ? "animate-slide-in" : ""}`}>
      {/* Thumbnail + name */}
      <div className="flex items-center gap-2.5 min-w-[200px] max-w-[200px]">
        <MapThumb src={row.thumbnailUrl} alt={row.mapName} size="md" />
        <span
          className={`text-[11px] leading-tight line-clamp-2 ${row.correct ? "text-green-400 font-semibold" : "text-gray-300"}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {row.mapName}
        </span>
      </div>

      <Cell cell={row.season} />
      <Cell cell={row.year} />
      <Cell cell={row.number} />
      <Cell cell={row.surface} />
      <Cell cell={row.car} />
      <Cell cell={row.style}  wide />
      <Cell cell={row.length} wide />
    </div>
  );
}

// ─── Autocomplete search input ────────────────────────────────────────────────

function SearchInput({
  allMapNames,
  value,
  onChange,
  onSubmit,
  disabled,
  loading,
  guessedNames,
  mapCache,
  fetchMapData,
}: {
  allMapNames: string[];
  value: string;
  onChange: (v: string) => void;
  onSubmit: (name: string) => void;
  disabled: boolean;
  loading: boolean;
  guessedNames: Set<string>;
  mapCache: Map<string, EnrichedMap | null>;
  fetchMapData: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function normalize(s: string) {
    return s.toLowerCase().replace(/[\s\-_]/g, "");
  }

  const filtered = value.length > 0
    ? allMapNames
        .filter((n) => {
          const q = normalize(value);
          return normalize(n).includes(q) || n.toLowerCase().includes(value.toLowerCase());
        })
        .slice(0, 8)
    : [];

  const isValid = allMapNames.includes(value) && !guessedNames.has(value);

  // Whenever the filtered set changes, ensure their data is fetched
  useEffect(() => {
    if (!open) return;
    filtered.forEach((name) => fetchMapData(name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, open]);

  function select(name: string) {
    if (guessedNames.has(name)) return;
    onChange(name);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            disabled={disabled || loading}
            onChange={(e) => { onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid) onSubmit(value.trim());
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={loading ? "Fetching map data…" : "Type a campaign map name…"}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-40"
          />
        </div>

        <button
          disabled={disabled || loading || !isValid}
          onClick={() => onSubmit(value.trim())}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-400 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-30"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
          ) : "Guess"}
        </button>
      </div>

      {/* In-flow dropdown: pushes content below it down */}
      {open && filtered.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] shadow-lg overflow-hidden">
          {filtered.map((name) => {
            const guessed = guessedNames.has(name);
            const data = mapCache.get(name);
            return (
              <DropdownItem
                key={name}
                name={name}
                guessed={guessed}
                data={data}
                onSelect={() => select(name)}
              />
            );
          })}
          {value.length > 0 && filtered.length === 8 && (
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-600 border-t border-white/5 text-center" style={{ fontFamily: "var(--font-display)" }}>
              Showing 8 — keep typing to narrow
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dropdown item with inline stats ──────────────────────────────────────────

// Parse `"Summer 2020 - 01"` → { seasonName, year, number } so we can show
// partial info immediately, before MX data loads.
function quickParse(name: string): { seasonName: string; year: number; number: number } | null {
  const m = name.match(/^(\w+)\s+(\d{4})\s+-\s+(\d{2})$/);
  if (!m) return null;
  return { seasonName: m[1], year: parseInt(m[2], 10), number: parseInt(m[3], 10) };
}

function DropdownItem({
  name,
  guessed,
  data,
  onSelect,
}: {
  name: string;
  guessed: boolean;
  data: EnrichedMap | null | undefined;
  onSelect: () => void;
}) {
  // data === undefined → not yet fetched
  // data === null      → fetched but unavailable
  const parsed = quickParse(name);

  // Always show parsed info immediately. Extend with MX detail when available.
  const quickLine = parsed
    ? `${parsed.seasonName} ${parsed.year} · #${parsed.number}`
    : name;

  const fullLine = data
    ? [
        `${data.seasonName} ${data.year}`,
        `#${data.number}`,
        data.surface,
        data.carType !== "Stadium" ? data.carType : null,
        data.primaryStyle || null,
        data.lengthName && data.lengthName !== "Unknown" ? data.lengthName : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <button
      onClick={onSelect}
      disabled={guessed}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-white/5 last:border-0 ${
        guessed
          ? "cursor-default opacity-40"
          : "hover:bg-white/5 cursor-pointer"
      }`}
    >
      <MapThumb src={data?.thumbnailUrl ?? null} alt={name} size="sm" />

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-tight ${
            guessed ? "text-gray-600 line-through" : "text-white"
          }`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {name}
        </p>

        <p
          className="text-[10px] text-gray-400 mt-0.5 truncate flex items-center gap-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span>{fullLine ?? quickLine}</span>
          {data === undefined && (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-500/50" />
          )}
          {data === null && (
            <span className="text-gray-600 text-[9px]">· MX offline</span>
          )}
        </p>
      </div>
    </button>
  );
}

// ─── Win / solved card ────────────────────────────────────────────────────────

function WinCard({
  target,
  rows,
  mode,
  dateLabel,
  onNewPractice,
}: {
  target: EnrichedMap;
  rows: GuessRow[];
  mode: "daily" | "practice";
  dateLabel: string;
  onNewPractice: () => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const guessCount = rows.length;

  const EMOJI: Record<CellState, string> = { correct: "🟩", present: "🟨", absent: "🟥" };
  const grid = [...rows]
    .reverse()
    .map((r) =>
      [r.season, r.year, r.number, r.surface, r.car, r.style, r.length]
        .map((c) => EMOJI[c.state])
        .join("")
    )
    .join("\n");

  const shareText = [
    `MAPGUESSR — ${mode === "daily" ? dateLabel : "Practice"}`,
    `${guessCount} guess${guessCount !== 1 ? "es" : ""} 🎉`,
    grid,
    "https://tmdle.com/mapguessr",
  ].join("\n");

  function copyShare() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="rounded-2xl border border-green-500/25 bg-green-500/5 p-6 mb-6">
      <p className="text-xs uppercase tracking-widest text-green-400 mb-1" style={{ fontFamily: "var(--font-display)" }}>
        Well played! 🎉
      </p>
      <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
        {target.name}
      </h2>

      {target.thumbnailUrl && (
        <div className="relative mb-4 h-36 w-full overflow-hidden rounded-xl">
          <Image src={target.thumbnailUrl} alt={target.name} fill className="object-cover" sizes="600px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2.5 left-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] text-gray-200 backdrop-blur-sm">
              {target.seasonName} {target.year}
            </span>
            <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] text-gray-200 backdrop-blur-sm">
              Map #{target.number}
            </span>
            {target.carType !== "Stadium" && (
              <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] text-yellow-300 backdrop-blur-sm">
                {target.carType} Car
              </span>
            )}
            <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] text-cyan-300 backdrop-blur-sm">
              {target.primaryStyle}
            </span>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-300 mb-2">
        Identified in{" "}
        <span className="font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
          {guessCount} guess{guessCount !== 1 ? "es" : ""}
        </span>
      </p>

      <div className="mb-5 rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-sm leading-snug tracking-wider">
        {grid.split("\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {mode === "daily" && (
          <button
            onClick={copyShare}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {copied ? "✓ Copied!" : "📋 Share Result"}
          </button>
        )}

        {target.mxId && (
          <a
            href={`https://trackmania.exchange/maps/${target.mxId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            🗺️ View on TrackMania Exchange
          </a>
        )}

        <button
          onClick={onNewPractice}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          🎮 {mode === "practice" ? "New practice round" : "Try practice mode"}
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full rounded-xl border border-white/8 py-3 text-sm text-gray-500 transition-colors hover:text-gray-300"
          style={{ fontFamily: "var(--font-display)" }}
        >
          🕹️ More games
        </button>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="mb-5 flex flex-wrap gap-4 text-xs text-gray-400">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-green-500" />
        Exact match
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-yellow-400" />
        Close / partial match
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-red-600" />
        Wrong (↑↓ = direction)
      </span>
    </div>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
      >
        {open ? "▲" : "▼"} How each column works
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-white/8 bg-[#0d0d0d] p-4 text-xs text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {[
            ["Season", "Winter / Spring / Summer / Fall — exact only"],
            ["Year", "2020–2025 — yellow if ±1 year off"],
            ["#", "Map number 1–25 — yellow if in the same tier of 5 (e.g. 1–5, 6–10…)"],
            ["Surface", "Road / Dirt / Ice / Grass — exact only"],
            ["Car", "Stadium / Snow / Rally / Desert — exact only"],
            ["Style", "Primary style tag — yellow if any style tag overlaps"],
            ["Length", "MX length bucket — yellow if within ±2 buckets"],
          ].map(([col, desc]) => (
            <div key={col} className="flex gap-2">
              <span className="text-gray-300 font-semibold shrink-0" style={{ fontFamily: "var(--font-display)" }}>{col}:</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MapGuessr({
  challenge,
  mode = "daily",
}: {
  challenge: Challenge2;
  mode?: "daily" | "practice";
}) {
  const { target, allMapNames, dayNumber, dateLabel } = challenge;
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  const [rows, setRows] = useState<GuessRow[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"playing" | "won">("playing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guessedNames] = useState(() => new Set<string>());
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const restoredRef = useRef(false);

  // Cache enriched map data — used by dropdown to show inline stats
  // undefined = not requested, null = fetched but unavailable, EnrichedMap = ready
  const [mapCache, setMapCache] = useState<Map<string, EnrichedMap | null>>(() => {
    const m = new Map<string, EnrichedMap | null>();
    m.set(target.name, target); // pre-seed the target so it loads instantly
    return m;
  });

  // In-flight set so we don't double-fetch the same map
  const inFlightRef = useRef<Set<string>>(new Set());

  const fetchMapData = useCallback(
    (name: string) => {
      if (mapCache.has(name) || inFlightRef.current.has(name)) return;
      inFlightRef.current.add(name);

      fetch(`/api/mapguessr/map-data?name=${encodeURIComponent(name)}`)
        .then(async (res) => {
          if (!res.ok) {
            setMapCache((prev) => new Map(prev).set(name, null));
            return;
          }
          const data: EnrichedMap = await res.json();
          setMapCache((prev) => new Map(prev).set(name, data));
        })
        .catch(() => {
          setMapCache((prev) => new Map(prev).set(name, null));
        })
        .finally(() => {
          inFlightRef.current.delete(name);
        });
    },
    [mapCache]
  );

  // ─── Restore previously-played state ────────────────────────────────────────
  // Daily mode only. Signed-in users get their canonical result from Supabase,
  // guests get whatever they last did in this browser from localStorage.
  // The wrong_guesses[] array is re-hydrated by re-fetching each map's enriched
  // data (cheap once the Supabase map_metadata cache is warm) and rebuilding
  // the comparison grid so the user sees their full history on return.
  useEffect(() => {
    if (mode !== "daily" || !isLoaded || restoredRef.current) return;
    restoredRef.current = true;

    async function restore() {
      let wrongGuesses: string[] = [];
      let won = false;

      try {
        if (isSignedIn) {
          const res = await fetch(`/api/results?game=mapguessr`);
          if (res.ok) {
            const data = await res.json();
            const today = data.find((r: { day_number: number }) => r.day_number === dayNumber);
            if (today) {
              wrongGuesses = today.wrong_guesses ?? [];
              won = !!today.won;
            }
          }
        } else {
          const saved = localStorage.getItem(`mg_v2_${dayNumber}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            wrongGuesses = Array.isArray(parsed.wrongGuesses) ? parsed.wrongGuesses : [];
            won = !!parsed.won;
          }
        }
      } catch {}

      if (wrongGuesses.length === 0 && !won) return;

      // Fetch each wrong guess's enriched data in parallel
      const enriched = await Promise.all(
        wrongGuesses.map(async (name) => {
          try {
            const r = await fetch(`/api/mapguessr/map-data?name=${encodeURIComponent(name)}`);
            if (!r.ok) return null;
            return (await r.json()) as EnrichedMap;
          } catch {
            return null;
          }
        })
      );

      const rebuilt: GuessRow[] = [];
      for (let i = 0; i < enriched.length; i++) {
        const e = enriched[i];
        if (e) {
          rebuilt.push(buildGuessRow(e, target));
          guessedNames.add(wrongGuesses[i]);
          setMapCache((prev) => new Map(prev).set(wrongGuesses[i], e));
        }
      }
      if (won) {
        rebuilt.push(buildGuessRow(target, target));
        guessedNames.add(target.name);
        setPhase("won");
      }
      // Newest at top
      setRows(rebuilt.reverse());
    }

    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  // ─── Persist state after each guess (daily mode only) ───────────────────────
  function persistProgress(currentRows: GuessRow[], won: boolean) {
    if (mode !== "daily") return;

    // currentRows is newest-first; reverse to chronological, then collect wrong names
    const chrono = [...currentRows].reverse();
    const wrongGuesses = chrono.filter((r) => !r.correct).map((r) => r.mapName);
    const clueIndex = wrongGuesses.length; // = guesses_used - 1

    // Always cache locally so a refresh shows the in-progress grid back
    try {
      localStorage.setItem(
        `mg_v2_${dayNumber}`,
        JSON.stringify({ wrongGuesses, won })
      );
    } catch {}

    // Only POST to backend when the game is solved
    if (!won) return;

    const payload = {
      game: "mapguessr",
      day_number: dayNumber,
      won: true,
      clue_index: clueIndex,
      wrong_guesses: wrongGuesses,
    };

    if (isSignedIn) {
      fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } else {
      // Anonymous guest count for the admin dashboard
      fetch("/api/results/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      // Append to local history shown on the /profile page when signed out
      try {
        const prev = JSON.parse(localStorage.getItem("mg_history") ?? "[]");
        if (!prev.some((e: { dayNumber: number }) => e.dayNumber === dayNumber)) {
          prev.push({
            dayNumber,
            dateLabel,
            won: true,
            clueIndex,
            wrongGuesses,
          });
          localStorage.setItem("mg_history", JSON.stringify(prev));
        }
      } catch {}
    }
  }

  async function handleGuess(name: string) {
    const trimmed = name.trim();
    if (!trimmed || loading || phase !== "playing") return;
    if (guessedNames.has(trimmed)) return;

    setLoading(true);
    setError(null);

    try {
      // Reuse cached data when available
      let guessData = mapCache.get(trimmed);
      if (!guessData) {
        const res = await fetch(`/api/mapguessr/map-data?name=${encodeURIComponent(trimmed)}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Map data not available");
        }
        guessData = await res.json();
        if (guessData) {
          setMapCache((prev) => new Map(prev).set(trimmed, guessData!));
        }
      }
      if (!guessData) throw new Error("Map data not available");

      const row = buildGuessRow(guessData, target);
      guessedNames.add(trimmed);
      const newRows = [row, ...rows];
      setRows(newRows);
      setInput("");

      const isWin = row.correct;
      if (isWin) setPhase("won");

      // Persist after each guess (no-op in practice mode)
      persistProgress(newRows, isWin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  }

  function handleNewPractice() {
    router.push(`/mapguessr/practice?seed=${Math.floor(Math.random() * 100000)}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Practice banner */}
      {mode === "practice" && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5">
          <span className="text-yellow-400 text-sm">🎮</span>
          <p className="text-xs text-yellow-400" style={{ fontFamily: "var(--font-display)" }}>
            Practice mode — results are not saved
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1" style={{ fontFamily: "var(--font-display)" }}>
          {mode === "practice" ? "Practice Round" : `${dateLabel} · Day #${dayNumber}`}
        </p>
        <h1 className="text-4xl text-white sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          Map
          <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">Guessr</span>
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          Each guess reveals how that map compares to the hidden target. Identify today&apos;s official campaign map.
        </p>
      </div>

      <HowItWorks />
      <Legend />

      {/* Win card */}
      {phase === "won" && (
        <WinCard
          target={target}
          rows={rows}
          mode={mode}
          dateLabel={dateLabel}
          onNewPractice={handleNewPractice}
        />
      )}

      {/* Guest sign-in nudge — daily mode, before they finish */}
      {mode === "daily" && isLoaded && !isSignedIn && !nudgeDismissed && phase === "playing" && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5">
          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-display)" }}>
            💾{" "}
            <SignInButton mode="modal">
              <button className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Sign in
              </button>
            </SignInButton>{" "}
            to save your result and appear on the leaderboard
          </p>
          <button
            onClick={() => setNudgeDismissed(true)}
            className="text-gray-600 hover:text-gray-400 transition-colors text-sm shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search (in-flow — pushes table below it down when dropdown opens) */}
      <div className="mb-3">
        <SearchInput
          allMapNames={allMapNames}
          value={input}
          onChange={setInput}
          onSubmit={handleGuess}
          disabled={phase !== "playing"}
          loading={loading}
          guessedNames={guessedNames}
          mapCache={mapCache}
          fetchMapData={fetchMapData}
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        {phase !== "playing" && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleNewPractice}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              🎮 {mode === "practice" ? "New practice round" : "Try practice mode"}
            </button>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <p className="mt-4 mb-2 text-xs text-gray-600" style={{ fontFamily: "var(--font-display)" }}>
          {rows.length} guess{rows.length !== 1 ? "es" : ""} made
          {phase === "playing" && " · Keep going!"}
        </p>
      )}

      {/* Comparison table */}
      {rows.length > 0 && (
        <div className="mt-1 overflow-x-auto rounded-xl border border-white/8 bg-[#0d0d0d] px-4 pt-4 pb-2">
          <ColumnHeaders />
          <div className="flex flex-col">
            {rows.map((row, i) => (
              <GuessRowView
                key={`${row.mapName}-${i}`}
                row={row}
                isNewest={i === 0}
              />
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 && phase === "playing" && (
        <div className="mt-4 rounded-xl border border-dashed border-white/8 py-14 text-center">
          <p className="text-gray-600 text-sm">Make your first guess above</p>
          <p className="text-gray-700 text-xs mt-1.5">
            Pool: {allMapNames.length} official campaign maps
          </p>
        </div>
      )}
    </div>
  );
}
