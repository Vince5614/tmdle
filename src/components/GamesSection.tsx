"use client";

import { useState } from "react";
import Image from "next/image";

const GAMES = [
  {
    number: 1,
    title: "Daily Game 1",
    description: "Guess the Trackmania map from clues. One shot per day.",
    accentColor: "#00c4f0",
    image: null as string | null,
  },
  {
    number: 2,
    title: "Daily Game 2",
    description: "Guess the Trackmania map from clues. One shot per day.",
    accentColor: "#ff2d6b",
    image: null as string | null,
  },
  {
    number: 3,
    title: "Daily Game 3",
    description: "Guess the Trackmania map from clues. One shot per day.",
    accentColor: "#ffd000",
    image: null as string | null,
  },
  {
    number: 4,
    title: "Daily Game 4",
    description: "Guess the Trackmania map from clues. One shot per day.",
    accentColor: "#00e676",
    image: null as string | null,
  },
  {
    number: 5,
    title: "Daily Game 5",
    description: "Guess the Trackmania map from clues. One shot per day.",
    accentColor: "#ff6b00",
    image: null as string | null,
  },
  {
    number: 6,
    title: "Daily Game 6",
    description: "Guess the Trackmania map from clues. One shot per day.",
    accentColor: "#b44dff",
    image: null as string | null,
  },
];

type Game = typeof GAMES[number];

function GameRow({ number, title, description, accentColor, image }: Game) {
  return (
    <div
      className="group flex cursor-not-allowed items-center gap-4 rounded-2xl border border-white/5 p-4 transition-all duration-200 hover:border-white/10"
      style={{
        background: `linear-gradient(to right, ${accentColor}12, transparent 55%)`,
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
        style={{
          backgroundColor: `${accentColor}20`,
          border: `1px solid ${accentColor}30`,
        }}
      >
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          /* Placeholder — accent color + number */
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="text-lg font-bold leading-none"
              style={{ fontFamily: "var(--font-display)", color: accentColor }}
            >
              {String(number).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {/* Accent bar */}
      <div
        className="w-[3px] shrink-0 self-stretch rounded-full opacity-70"
        style={{ backgroundColor: accentColor }}
      />

      {/* Title + description */}
      <div className="min-w-0 flex-1">
        <h2
          className="truncate text-sm font-semibold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <p className="mt-0.5 truncate text-xs text-gray-500">{description}</p>
      </div>

      {/* Right badges */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 sm:inline-flex">
          Daily
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `${accentColor}18`,
            color: accentColor,
            border: `1px solid ${accentColor}35`,
          }}
        >
          Soon
        </span>
      </div>
    </div>
  );
}

export default function GamesSection() {
  const [query, setQuery] = useState("");

  const filtered = GAMES.filter((g) =>
    g.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section>
      {/* Section header + search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-normal uppercase tracking-[0.2em] text-gray-500"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Today&apos;s Games
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {filtered.length} / {GAMES.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full rounded-xl border border-white/8 bg-[#111] py-2 pl-9 pr-9 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/15"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mb-5 h-px bg-gradient-to-r from-cyan-500/30 via-white/8 to-transparent" />

      {/* Game list */}
      {filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-[#111]">
          <p className="text-sm text-gray-500">No games match &ldquo;{query}&rdquo;</p>
          <button onClick={() => setQuery("")} className="text-xs text-cyan-400 hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((g) => (
            <GameRow key={g.number} {...g} />
          ))}
        </div>
      )}
    </section>
  );
}
