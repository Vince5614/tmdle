"use client";

import { useReducer, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import type { DailyChallenge, GameState, GamePhase, Clue } from "@/types/mapguessr";

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_INPUT"; payload: string }
  | { type: "NEXT_CLUE" }
  | { type: "RESTORE"; payload: { clueIndex: number } };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_INPUT":   return { ...state, input: action.payload };
    case "NEXT_CLUE":  return { ...state, clueIndex: Math.min(state.clueIndex + 1, 3), input: "" };
    case "RESTORE":    return { ...state, clueIndex: action.payload.clueIndex, input: "" };
    default:           return state;
  }
}

// ─── Fuzzy search helper ───────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().replace(/[\s\-_]/g, "");
}

// ─── Intro modal ───────────────────────────────────────────────────────────────

function IntroModal({ dayNumber, dateLabel, onPlay }: {
  dayNumber: number;
  dateLabel: string;
  onPlay: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-8 flex flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/25">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 3C12.477 3 8 7.477 8 13c0 7.5 10 20 10 20s10-12.5 10-20c0-5.523-4.477-10-10-10z"
              stroke="#00c4f0" strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="18" cy="13" r="3.5" stroke="#00c4f0" strokeWidth="1.8"/>
            <text x="18" y="17.5" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#00c4f0">?</text>
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          <span className="text-white">Map</span>
          <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">Guessr</span>
        </h2>

        <p className="text-xs text-gray-400 mb-5" style={{ fontFamily: "var(--font-display)" }}>
          {dateLabel} · Day #{dayNumber}
        </p>

        <p className="text-sm text-gray-300 leading-relaxed mb-7">
          Identify today&apos;s official Trackmania campaign map. Each wrong guess reveals a new clue. Fewer clues = higher score.
        </p>

        <div className="w-full h-px bg-white/8 mb-6" />

        <button
          onClick={onPlay}
          className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide text-black transition-all bg-[#00c4f0] hover:bg-[#00d4ff]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Play
        </button>
      </div>
    </div>
  );
}

// ─── Post-game modal ───────────────────────────────────────────────────────────

function PostGameModal({ won, emojiGrid, score, mapName, mxId, mode, isSignedIn, shareText, onClose }: {
  won: boolean;
  emojiGrid: string;
  score: number;
  mapName: string;
  mxId: number | null;
  mode: "daily" | "practice";
  isSignedIn: boolean;
  shareText: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  function copyShare() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-7 flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-3xl mb-2 tracking-wider">{emojiGrid}</p>
        <p className="text-lg font-bold text-white mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
          {won ? "Well played! 🎉" : "Better luck tomorrow"}
        </p>
        <p className="text-xs text-gray-400 mb-1">{mapName}</p>
        <p className="text-xs text-gray-500 mb-6">
          {won ? `${score}/4 ⭐` : "0/4 ❌"} {mode === "practice" ? "· Practice round" : ""}
        </p>

        <div className="w-full flex flex-col gap-3">
          {mode === "daily" && (
            <button
              onClick={copyShare}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </button>
          )}

          {mxId && (
            <a
              href={`https://trackmania.exchange/maps/${mxId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white flex items-center justify-center gap-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              🗺️ View on TrackMania Exchange
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="opacity-50">
                <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
              </svg>
            </a>
          )}

          {!isSignedIn && (
            <SignInButton mode="modal">
              <button className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-400 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/15"
                style={{ fontFamily: "var(--font-display)" }}>
                🔐 Sign in to save your stats
              </button>
            </SignInButton>
          )}

          <button
            onClick={() => router.push("/mapguessr/practice")}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-gray-300 transition-colors hover:bg-white/10"
            style={{ fontFamily: "var(--font-display)" }}
          >
            🎮 Practice round <span className="text-gray-500 text-xs">(not the daily)</span>
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full rounded-xl border border-white/8 py-3 text-sm text-gray-400 transition-colors hover:text-gray-200"
            style={{ fontFamily: "var(--font-display)" }}
          >
            🕹️ More games
          </button>
        </div>

        <button onClick={onClose} className="mt-4 text-xs text-gray-600 hover:text-gray-400 transition-colors">
          See result details
        </button>
      </div>
    </div>
  );
}

// ─── Clue card ────────────────────────────────────────────────────────────────

function ClueCard({ clue, revealed, className = "" }: { clue: Clue; revealed: boolean; className?: string }) {
  if (!revealed) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border border-white/8 bg-[#111] px-5 py-4 opacity-60 ${className}`}>
        <span className="text-lg">🔒</span>
        <span className="text-sm text-gray-300" style={{ fontFamily: "var(--font-display)" }}>
          {clue.label}
        </span>
      </div>
    );
  }

  if (!clue.available) {
    return (
      <div className={`rounded-xl border border-white/10 bg-[#111] px-5 py-4 ${className}`}>
        <div className="flex items-center gap-2 mb-1">
          <span>{clue.icon}</span>
          <span className="text-xs text-gray-400 uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>
            {clue.label}
          </span>
        </div>
        <p className="text-sm text-gray-500 italic">Not available</p>
      </div>
    );
  }

  if (clue.type === "screenshot" && clue.mediaPath) {
    return (
      <div className={`rounded-xl border border-white/10 bg-[#111] overflow-hidden flex flex-col ${className}`}>
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 shrink-0">
          <span>{clue.icon}</span>
          <span className="text-xs text-gray-400 uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>
            {clue.label}
          </span>
        </div>
        <div className="relative w-full aspect-video flex-1">
          <Image src={clue.mediaPath} alt="Map screenshot" fill className="object-cover" />
        </div>
      </div>
    );
  }

  if (clue.type === "tags" && clue.value) {
    return (
      <div className={`rounded-xl border border-cyan-500/20 bg-[#111] px-5 py-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span>{clue.icon}</span>
          <span className="text-xs text-gray-400 uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>
            {clue.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {clue.value.split(",").map((tag) => (
            <span key={tag} className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300"
              style={{ fontFamily: "var(--font-display)" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-cyan-500/20 bg-[#111] px-5 py-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{clue.icon}</span>
        <span className="text-xs text-gray-400 uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>
          {clue.label}
        </span>
      </div>
      <p className="text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
        {clue.value ?? "—"}
      </p>
      {clue.subValue && <p className="mt-1 text-sm text-gray-400">{clue.subValue}</p>}
    </div>
  );
}

// ─── Guess input ───────────────────────────────────────────────────────────────

function GuessInput({ allMapNames, value, onChange, onSubmit, disabled, wrongGuesses }: {
  allMapNames: string[];
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  disabled: boolean;
  wrongGuesses: string[];
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value.length > 0
    ? allMapNames.filter((n) => {
        const q = normalize(value);
        return normalize(n).includes(q) || n.toLowerCase().includes(value.toLowerCase());
      }).slice(0, 10)
    : [];

  const isValidGuess = allMapNames.includes(value);
  const showNoMatch = value.length > 2 && filtered.length === 0;

  function select(name: string) {
    onChange(name);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div>
      {wrongGuesses.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {wrongGuesses.map((g) => (
            <span key={g} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400">
              ✗ {g}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => { onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValidGuess) onSubmit(value.trim());
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Type a campaign track name…"
            className={`w-full rounded-xl border bg-[#111] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:ring-1 disabled:cursor-not-allowed disabled:opacity-40 ${
              showNoMatch
                ? "border-red-500/40 focus:border-red-500/50 focus:ring-red-500/10"
                : "border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20"
            }`}
          />
          {showNoMatch && (
            <p className="absolute -bottom-5 left-1 text-[11px] text-red-400/80">No map found</p>
          )}
          {open && filtered.length > 0 && (
            <ul onMouseDown={(e) => e.preventDefault()} className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
              {filtered.map((name) => (
                <li key={name}>
                  <button
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 transition-colors hover:bg-white/5 hover:text-white"
                    onMouseDown={() => select(name)}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          disabled={disabled || !isValidGuess}
          onClick={() => onSubmit(value.trim())}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-400 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-30"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Guess
        </button>
      </div>
    </div>
  );
}

// ─── Score dots ───────────────────────────────────────────────────────────────

function ScoreDots({ clueIndex, phase }: { clueIndex: number; phase: GamePhase }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 4 }, (_, i) => {
        const used = i <= clueIndex;
        const isLast = phase !== "playing" && i === clueIndex;
        return (
          <div key={i} className={`h-2.5 w-2.5 rounded-full transition-all ${
            isLast && phase === "won" ? "bg-green-400 ring-2 ring-green-400/30"
            : used ? "bg-cyan-500" : "bg-white/15"
          }`} />
        );
      })}
      <span className="ml-2 text-xs text-gray-400">
        {phase === "playing" && `Clue ${clueIndex + 1} / 4`}
        {phase === "won" && `✓ Clue ${clueIndex + 1}`}
        {phase === "lost" && "No more clues"}
      </span>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ won, map, clueIndex, dayNumber, mode, isSignedIn }: {
  won: boolean;
  map: DailyChallenge["map"];
  clueIndex: number;
  dayNumber: number;
  mode: "daily" | "practice";
  isSignedIn: boolean;
}) {
  const [rank, setRank] = useState<{ rank: number; total: number; percentile: number } | null>(null);
  const score = won ? 4 - clueIndex : 0;

  useEffect(() => {
    if (mode !== "daily" || !isSignedIn) return;
    const t = setTimeout(() => {
      fetch(`/api/results/rank?game=mapguessr&day_number=${dayNumber}`)
        .then((r) => r.json())
        .then((d) => { if (d.rank) setRank(d); })
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [dayNumber, mode, isSignedIn]);

  return (
    <div className={`rounded-2xl border p-6 ${won ? "border-green-500/25 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: "var(--font-display)" }}>
        {won ? "Well played 🎉" : "Better luck tomorrow"}
      </p>
      <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
        {map.name}
      </h2>

      {map.thumbnailUrl && (
        <div className="relative mb-4 h-36 w-full overflow-hidden rounded-xl">
          <Image src={map.thumbnailUrl} alt={map.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2 left-3 flex gap-2">
            {map.surface !== "Unknown" && (
              <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-gray-300 backdrop-blur-sm">
                {{ Road: "🛣️", Dirt: "🪨", Grass: "🌿", Ice: "❄️" }[map.surface] ?? ""} {map.surface}
              </span>
            )}
            {map.lengthName && (
              <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-gray-300 backdrop-blur-sm">
                ⏱ {map.lengthName}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl tracking-wider">
            {Array.from({ length: 4 }, (_, i) => {
              if (i < clueIndex) return "🟥";
              if (i === clueIndex) return won ? "🟩" : "🟥";
              return "⬛";
            }).join("")}
          </span>
          <span className="text-sm text-gray-300">{won ? `${score}/4` : "0/4"}</span>
        </div>
        {rank && (
          <div className="text-right">
            <p className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
              #{rank.rank} today
            </p>
            <p className="text-[10px] text-gray-400">of {rank.total} · Top {rank.percentile}%</p>
          </div>
        )}
      </div>

      {map.mxId && (
        <a
          href={`https://trackmania.exchange/maps/${map.mxId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          🗺️ View on TrackMania Exchange
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="opacity-50">
            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
          </svg>
        </a>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MapGuessr({ challenge, mode = "daily" }: {
  challenge: DailyChallenge;
  mode?: "daily" | "practice";
}) {
  const { map, clues, allMapNames, dayNumber, dateLabel } = challenge;
  const router = useRouter();

  const [state, dispatch] = useReducer(reducer, {
    phase: "playing", clueIndex: 0, guesses: [], input: "",
  });
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [wrong, setWrong] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(false);
  const [showPostGame, setShowPostGame] = useState(false);
  const justFinished = useRef(false);
  const practiceRestored = useRef(false);

  const { isSignedIn } = useUser();
  const saveKey = `mg_day_${dayNumber}`;

  // If the server sent a stale dayNumber (ISR cache), force a fresh render
  useEffect(() => {
    const launch = new Date("2026-05-14T00:00:00Z");
    const clientDay = Math.max(1, Math.floor((Date.now() - launch.getTime()) / 86_400_000) + 1);
    if (clientDay !== dayNumber) router.refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "practice") return;
    try {
      const seen = localStorage.getItem(`mg_intro_${dayNumber}`);
      if (!seen) setShowIntro(true);
    } catch {
      setShowIntro(true);
    }
  }, [dayNumber, mode]);

  // Restore practice state from sessionStorage
  useEffect(() => {
    if (mode !== "practice") return;
    try {
      const saved = sessionStorage.getItem(`mg_practice_${map.name}`);
      if (saved) {
        const { phase: p, clueIndex: ci, wrong: w } = JSON.parse(saved);
        dispatch({ type: "RESTORE", payload: { clueIndex: ci ?? 0 } });
        setPhase(p ?? "playing");
        setWrong(w ?? []);
      }
    } catch {}
    practiceRestored.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save practice state to sessionStorage on every change
  useEffect(() => {
    if (mode !== "practice" || !practiceRestored.current) return;
    try {
      sessionStorage.setItem(`mg_practice_${map.name}`, JSON.stringify({
        phase, clueIndex: state.clueIndex, wrong,
      }));
    } catch {}
  }, [phase, wrong, state.clueIndex, mode, map.name]);

  useEffect(() => {
    async function restore() {
      try {
        if (isSignedIn) {
          const res = await fetch(`/api/results?game=mapguessr`);
          if (res.ok) {
            const data = await res.json();
            const today = data.find((r: { day_number: number }) => r.day_number === dayNumber);
            if (today) {
              dispatch({ type: "RESTORE", payload: { clueIndex: today.clue_index } });
              setPhase(today.won ? "won" : "lost");
              setWrong(today.wrong_guesses ?? []);
            }
          }
        } else {
          const saved = localStorage.getItem(saveKey);
          if (saved) {
            const { phase: p, clueIndex: ci, wrong: w } = JSON.parse(saved);
            dispatch({ type: "RESTORE", payload: { clueIndex: ci ?? 0 } });
            setPhase(p ?? "playing");
            setWrong(w ?? []);
          }
        }
      } catch {}
    }
    restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  useEffect(() => {
    if (phase !== "won" && phase !== "lost") return;
    if (mode === "practice") return;
    const payload = { phase, clueIndex: state.clueIndex, wrong };
    if (isSignedIn) {
      fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "mapguessr", day_number: dayNumber, won: phase === "won", clue_index: state.clueIndex, wrong_guesses: wrong }),
      }).catch(() => {});
    } else {
      try {
        localStorage.setItem(saveKey, JSON.stringify(payload));
        const prev = JSON.parse(localStorage.getItem("mg_history") ?? "[]");
        if (!prev.some((e: { dayNumber: number }) => e.dayNumber === dayNumber)) {
          prev.push({ dayNumber, dateLabel, won: phase === "won", clueIndex: state.clueIndex, wrong });
          localStorage.setItem("mg_history", JSON.stringify(prev));
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if ((phase !== "won" && phase !== "lost") || !justFinished.current) return;
    const t = setTimeout(() => setShowPostGame(true), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  function handlePlay() {
    try { localStorage.setItem(`mg_intro_${dayNumber}`, "1"); } catch {}
    setShowIntro(false);
  }

  function handleGuess(raw: string) {
    const guess = raw.trim();
    if (!guess || phase !== "playing") return;
    if (guess === map.name) {
      justFinished.current = true;
      setPhase("won");
      dispatch({ type: "SET_INPUT", payload: guess });
    } else {
      setWrong((prev) => [...prev, guess]);
      dispatch({ type: "SET_INPUT", payload: "" });
      if (state.clueIndex >= 3) {
        justFinished.current = true;
        setPhase("lost");
      } else {
        dispatch({ type: "NEXT_CLUE" });
      }
    }
  }

  const gameOver = phase !== "playing";
  const emojiGrid = Array.from({ length: 4 }, (_, i) => {
    if (i < state.clueIndex) return "🟥";
    if (i === state.clueIndex) return (phase === "won") ? "🟩" : "🟥";
    return "⬛";
  }).join("");
  const score = phase === "won" ? 4 - state.clueIndex : 0;
  const shareText = [`MAPGUESSR — Day #${dayNumber}`, emojiGrid, phase === "won" ? `${score}/4 ⭐` : "0/4 ❌", "https://tmdle.com/mapguessr"].join("\n");

  return (
    <>
      {showIntro && (
        <IntroModal dayNumber={dayNumber} dateLabel={dateLabel} onPlay={handlePlay} />
      )}

      {showPostGame && (
        <PostGameModal
          won={phase === "won"}
          emojiGrid={emojiGrid}
          score={score}
          mapName={map.name}
          mxId={map.mxId}
          mode={mode}
          isSignedIn={isSignedIn ?? false}
          shareText={shareText}
          onClose={() => setShowPostGame(false)}
        />
      )}

      <div className="mx-auto max-w-5xl px-4 py-8">
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
            Map<span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">Guessr</span>
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            Identify today&apos;s official campaign map using as few clues as possible.
          </p>
        </div>

        {/* Score dots */}
        <div className="mb-5">
          <ScoreDots clueIndex={state.clueIndex} phase={phase} />
        </div>

        {/* Guess input — shown at top while playing */}
        {!gameOver && (
          <div className="relative mb-6" style={{ zIndex: 30 }}>
            <GuessInput
              allMapNames={allMapNames}
              value={state.input}
              onChange={(v) => dispatch({ type: "SET_INPUT", payload: v })}
              onSubmit={handleGuess}
              disabled={gameOver}
              wrongGuesses={wrong}
            />
          </div>
        )}

        {/* Clue grid — 2 columns: [left: season/wr/tags] [right: screenshot] */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-4 items-start mb-6">
          {/* Left column: text clues */}
          <div className="flex flex-col gap-3 order-2 md:order-1">
            {clues.slice(1).map((clue, i) => (
              <ClueCard
                key={clue.type}
                clue={clue}
                revealed={(i + 1) <= state.clueIndex || gameOver}
              />
            ))}
          </div>

          {/* Right column: screenshot (always first revealed) */}
          <div className="order-1 md:order-2">
            <ClueCard clue={clues[0]} revealed={true} />
          </div>
        </div>

        {/* Result card — shown below clues after game ends */}
        {gameOver && (
          <div className="flex flex-col gap-3">
            <ResultCard
              won={phase === "won"}
              map={map}
              clueIndex={state.clueIndex}
              dayNumber={dayNumber}
              mode={mode}
              isSignedIn={isSignedIn ?? false}
            />
            <button
              onClick={() => router.push("/mapguessr/practice")}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              🎮 {mode === "practice" ? "New practice round" : "Play a practice round"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
