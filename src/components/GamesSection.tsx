"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const GAMES = [
  {
    number: 1,
    title: "MapGuessr",
    description: "Guess the hidden campaign map using clues — surface, season, screenshot, clip. Fewer clues = higher score.",
    accentColor: "#00c4f0",
    image: null as string | null,
    href: "/mapguessr" as string | null,
  },
  { number: 2, title: "Head-to-Head", description: "Enter two TM usernames. See every shared map time side by side — color-coded, ranked, and scored.", accentColor: "#ff2d6b", image: null as string | null, href: null as string | null },
  { number: 3, title: "Ghost Race", description: "Two anonymous ghosts race the same map. Guess which is faster before they cross the finish line.", accentColor: "#ffd000", image: null as string | null, href: null as string | null },
  { number: 4, title: "Time Guesser", description: "Watch a ghost drive today's TOTD. Input your guess for the exact finish time in milliseconds.", accentColor: "#00e676", image: null as string | null, href: null as string | null },
  { number: 5, title: "PB Guesser", description: "See anonymised player stats and guess their trophy count or rank bracket. Higher or lower?", accentColor: "#ff6b00", image: null as string | null, href: null as string | null },
  { number: 6, title: "Gap Guesser", description: "Two ghosts finish the same map. Drag a slider to guess the exact millisecond gap between them.", accentColor: "#b44dff", image: null as string | null, href: null as string | null },
  { number: 7, title: "Finish Speed", description: "A car drives in a straight line then vanishes. Drag the speedometer needle to guess its exact km/h.", accentColor: "#ff3b5c", image: null as string | null, href: null as string | null },
  { number: 8, title: "Draw the Line", description: "Watch a ghost take a corner from above, then draw the racing line you remember on the empty track.", accentColor: "#34d399", image: null as string | null, href: null as string | null },
  { number: 9, title: "Pro or Joe", description: "Watch an anonymous ghost on a campaign map. Top 100 world player, or total casual? You decide.", accentColor: "#f59e0b", image: null as string | null, href: null as string | null },
];

type Game = typeof GAMES[number];

// ─── Game SVG icons ────────────────────────────────────────────────────────────

function GameIcon({ title, color, size = 28 }: { title: string; color: string; size?: number }) {
  const s = size;
  switch (title) {
    case "MapGuessr":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 3C12.477 3 8 7.477 8 13c0 7.5 10 20 10 20s10-12.5 10-20c0-5.523-4.477-10-10-10z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
          <circle cx="18" cy="13" r="3.5" stroke={color} strokeWidth="1.8"/>
          <text x="18" y="17" textAnchor="middle" fontSize="5" fontWeight="700" fill={color}>?</text>
        </svg>
      );
    case "Head-to-Head":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
          <rect x="6" y="8" width="9" height="20" rx="2" stroke={color} strokeWidth="1.8"/>
          <rect x="21" y="8" width="9" height="20" rx="2" stroke={color} strokeWidth="1.8"/>
          <path d="M15 18h6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      );
    case "Ghost Race":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
          <path d="M18 6C12.477 6 8 10.477 8 16v12l3-3 3 3 3-3 3 3 3-3 3 3V16c0-5.523-4.477-10-10-10z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
          <circle cx="14" cy="16" r="1.5" fill={color}/>
          <circle cx="22" cy="16" r="1.5" fill={color}/>
        </svg>
      );
    case "Time Guesser":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="20" r="11" stroke={color} strokeWidth="1.8"/>
          <path d="M18 20V13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M18 20l5 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M14 5h8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      );
    case "PB Guesser":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
          <path d="M12 6h12l-2 8H14L12 6z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M14 14c0 4 4 6 4 6s4-2 4-6" stroke={color} strokeWidth="1.8"/>
          <path d="M18 20v6M14 30h8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      );
    case "Gap Guesser":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
          <line x1="5" y1="12" x2="13" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="5" y1="18" x2="13" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="5" y1="24" x2="13" y2="24" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="23" y1="12" x2="31" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="23" y1="18" x2="31" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="23" y1="24" x2="31" y2="24" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M16 18h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 1.5"/>
        </svg>
      );
    case "Finish Speed":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
          <path d="M6 22a12 12 0 0 1 24 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M18 22L13 14" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="18" cy="22" r="2" fill={color}/>
        </svg>
      );
    case "Draw the Line":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
          <rect x="5" y="5" width="26" height="26" rx="3" stroke={color} strokeWidth="1.8"/>
          <path d="M9 27 C9 27 12 18 18 16 C24 14 27 9 27 9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      );
    case "Pro or Joe":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="12" r="5" stroke={color} strokeWidth="1.8"/>
          <path d="M8 30c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M14 12h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none">
          <rect x="6" y="6" width="24" height="24" rx="4" stroke={color} strokeWidth="1.8"/>
        </svg>
      );
  }
}

// ─── Game row ──────────────────────────────────────────────────────────────────

function GameRowInner({ number, title, description, accentColor, image, live }: Game & { live: boolean }) {
  return (
    <>
      {/* Thumbnail */}
      <div
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
      >
        {image ? (
          <Image src={image} alt={title} fill className="object-cover" sizes="56px" />
        ) : (
          <GameIcon title={title} color={accentColor} size={28} />
        )}
      </div>

      {/* Accent bar */}
      <div className="w-[3px] shrink-0 self-stretch rounded-full opacity-70" style={{ backgroundColor: accentColor }} />

      {/* Title + description */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        <p className="mt-0.5 truncate text-xs text-gray-500">{description}</p>
      </div>

      {/* Badges */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 sm:inline-flex">
          Daily
        </span>
        {live ? (
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}50` }}
          >
            Play
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Soon
          </span>
        )}
      </div>
    </>
  );
}

function GameRow({ game }: { game: Game }) {
  const live = !!game.href;
  const baseClass = "group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 w-full text-left";

  if (live) {
    return (
      <Link
        href={game.href!}
        className={`${baseClass} border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.02]`}
        style={{ background: `linear-gradient(to right, ${game.accentColor}12, transparent 55%)` }}
      >
        <GameRowInner {...game} live />
      </Link>
    );
  }

  return (
    <div
      className={`${baseClass} cursor-not-allowed border-white/5 opacity-60`}
      style={{ background: `linear-gradient(to right, ${game.accentColor}08, transparent 55%)` }}
    >
      <GameRowInner {...game} live={false} />
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────────

export default function GamesSection() {
  const [query, setQuery] = useState("");

  const filtered = GAMES.filter((g) => g.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <section>

      {/* Header + search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-normal uppercase tracking-[0.2em] text-gray-500" style={{ fontFamily: "var(--font-display)" }}>
            Today&apos;s Games
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {filtered.length} / {GAMES.length}
          </span>
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full rounded-xl border border-white/8 bg-[#111] py-2 pl-9 pr-9 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/15"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 h-px bg-gradient-to-r from-cyan-500/30 via-white/8 to-transparent" />

      {filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-[#111]">
          <p className="text-sm text-gray-500">No games match &ldquo;{query}&rdquo;</p>
          <button onClick={() => setQuery("")} className="text-xs text-cyan-400 hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((g) => <GameRow key={g.number} game={g} />)}
        </div>
      )}
    </section>
  );
}
