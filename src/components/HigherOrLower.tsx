"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import type { WrlMap } from "@/lib/wrorlower";
import { ROUNDS } from "@/lib/wrorlower";

/* ── helpers ───────────────────────────────────────────────────────────── */

function fmt(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mil = ms % 1000;
  return `${m}:${String(s).padStart(2, "0")}.${String(mil).padStart(3, "0")}`;
}

/* deterministic placeholder until Supabase aggregates exist */
function crowdPct(uid: string): number {
  let h = 0;
  for (const c of uid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 35 + (h % 50);
}

function MapVisual({ m }: { m: WrlMap }) {
  if (!m.layoutOk) {
    return (
      <div className="wrl-thumbwrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.thumb} alt="map thumbnail" />
        <div className="wrl-thumbtip">
          <span>
            Track layout could not be generated for this map
            <br />
            showing the official screenshot instead
          </span>
        </div>
      </div>
    );
  }
  return (
    <svg viewBox="0 0 130 100" style={{ height: "88%", maxWidth: "92%" }} fill="none">
      {m.segs.map((s, i) => (
        <path key={i} d={s.d} stroke="#9c9483" strokeOpacity={s.o} strokeWidth={s.w}
          strokeLinejoin="round" strokeLinecap="round" />
      ))}
      <circle cx={m.sx} cy={m.sy} r="4" fill="#6fbf73" stroke="#15130f" strokeWidth="1.5" />
      <circle cx={m.fx} cy={m.fy} r="4" fill="#e0492e" stroke="#15130f" strokeWidth="1.5" />
    </svg>
  );
}

function MapCard({
  m, revealed, revealColor, children,
}: {
  m: WrlMap; revealed: boolean; revealColor?: "ok" | "bad" | null; children?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col overflow-hidden border border-[#383228] bg-[#1d1a15]">
      <div className="relative flex h-[170px] items-center justify-center border-b border-[#383228] bg-[#242019]">
        <MapVisual m={m} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="wrl-label">{m.src}</span>
        <span className="wrl-condensed text-2xl uppercase tracking-wide text-[#eae3d2]">{m.name}</span>
        <span className="wrl-label mt-2">{revealed ? "World record" : "World record is…"}</span>
        <span
          className={`wrl-mono mt-1 text-[32px] font-semibold tabular-nums ${
            !revealed ? "text-[#6b6557]"
            : revealColor === "ok" ? "text-[#6fbf73]"
            : revealColor === "bad" ? "text-[#e0492e]"
            : "text-[#eae3d2]"
          }`}
        >
          {revealed ? fmt(m.wr) : "?:??.???"}
        </span>
        {children}
      </div>
    </article>
  );
}

/* ── main component ────────────────────────────────────────────────────── */

const TOLERANCE_MS = 200; // gaps of 0.2s or less count as correct either way

export default function HigherOrLower({
  deck, dayNumber, mode,
}: {
  deck: WrlMap[]; dayNumber: number; mode: "daily" | "practice";
}) {
  const { isSignedIn, isLoaded } = useUser();
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<"guess" | "verdict" | "done">("guess");
  const [copied, setCopied] = useState(false);
  const [animTime, setAnimTime] = useState<number | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  // Daily is one-and-done: block play until we've checked for a prior result
  // (from Supabase when signed in, localStorage when guest). Practice is free.
  const [checking, setChecking] = useState(mode === "daily");
  const posted = useRef(false);
  const restoredRef = useRef(false);

  const L = deck[round];
  const R = deck[round + 1];
  const score = results.filter(Boolean).length;
  const lastOk = results[results.length - 1];

  /* animated count-up on reveal */
  useEffect(() => {
    if (phase !== "verdict" || !R) return;
    const target = R.wr;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / 700, 1);
      setAnimTime(Math.round(target * (0.4 + 0.6 * p)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, round, R]);

  function guess(saidSlower: boolean) {
    if (phase !== "guess") return;
    const photoFinish = Math.abs(R.wr - L.wr) <= TOLERANCE_MS;
    const ok = photoFinish || saidSlower === (R.wr > L.wr);
    setResults((r) => [...r, ok]);
    setPhase("verdict");
  }

  function next() {
    if (round >= ROUNDS - 1) {
      setPhase("done");
      return;
    }
    setAnimTime(null);
    setRound((r) => r + 1);
    setPhase("guess");
  }

  /* Restore a prior daily result so the day can't be replayed. Signed-in users
     get their canonical row from Supabase; guests get this browser's saved run.
     Either way we mark posted so the restored result is never re-recorded. */
  useEffect(() => {
    if (mode !== "daily" || !isLoaded || restoredRef.current) return;
    restoredRef.current = true;

    async function restore() {
      let prior: boolean[] | null = null;
      // Local copy first: it's written synchronously on completion for every
      // daily (guest or signed-in), so it locks instantly and is immune to the
      // POST-vs-reload race. The DB is only needed when this browser has no
      // local copy (e.g. a signed-in user returning on another device).
      try {
        const saved = localStorage.getItem(`hol_v1_${dayNumber}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.results)) prior = parsed.results.map(Boolean);
        }
      } catch {}

      if (!prior && isSignedIn) {
        try {
          const res = await fetch(`/api/results?game=wrorlower`);
          if (res.ok) {
            const data = await res.json();
            const today = data.find((r: { day_number: number }) => r.day_number === dayNumber);
            if (today && Array.isArray(today.wrong_guesses)) {
              prior = today.wrong_guesses.map((s: string) => s === "1");
            }
          }
        } catch {}
      }

      if (prior && prior.length > 0) {
        setResults(prior);
        setPhase("done");
        setAlreadyPlayed(true);
        posted.current = true; // already recorded — don't re-post
      }
      setChecking(false);
    }
    restore();
  }, [isLoaded, isSignedIn, mode, dayNumber]);

  /* Post + persist once on completion (fire and forget, errors non-fatal).
     Gated on Clerk being loaded so a signed-in finisher is never misfiled as a
     guest, and on the prior-play check so a restored result isn't re-posted. */
  useEffect(() => {
    if (phase !== "done" || posted.current) return;
    if (!isLoaded) return;                       // wait for known identity
    if (mode === "daily" && checking) return;    // wait for prior-play check
    if (mode === "practice" && !isSignedIn) return; // gated upstream; never post anon practice
    posted.current = true;

    const finalScore = results.filter(Boolean).length;
    const body = JSON.stringify({
      game: mode === "daily" ? "wrorlower" : "wrorlower-practice",
      day_number: mode === "daily" ? dayNumber : -1,
      won: finalScore >= 6,
      clue_index: finalScore,
      wrong_guesses: results.map((r) => (r ? "1" : "0")),
    });

    // Save the daily locally so a reload shows the locked result — and so a
    // guest (no account to dedupe against) counts only once per day.
    if (mode === "daily") {
      try {
        localStorage.setItem(`hol_v1_${dayNumber}`, JSON.stringify({ results, score: finalScore }));
      } catch {}
    }

    const url = isSignedIn ? "/api/results" : "/api/results/guest";
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body }).catch(() => {});
  }, [phase, results, isSignedIn, isLoaded, checking, mode, dayNumber]);

  const shareText = useMemo(() => {
    const grid = results.map((r) => (r ? "🟩" : "🟥")).join("");
    const head = mode === "daily" ? `Higher or Lower #${dayNumber}` : "Higher or Lower · practice";
    return `${head} — ${score}/${ROUNDS}\n${grid}\nhttps://tmdle.com/higherorlower`;
  }, [results, score, dayNumber, mode]);

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const pct = R ? crowdPct(R.uid) : 0;

  // Daily: don't render the board until we know whether today was already played
  if (mode === "daily" && checking) {
    return (
      <div className="border border-[#383228] bg-[#1d1a15] p-7">
        <span className="wrl-label">Loading today&apos;s deck…</span>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="border border-[#383228] bg-[#1d1a15] p-7">
        <span className="wrl-label">{alreadyPlayed ? "Already played today" : "Final score"}</span>
        <div className="wrl-condensed text-[64px] leading-none text-[#eae3d2]">
          {score}<span className="text-2xl text-[#9c9483]"> / {ROUNDS}</span>
        </div>
        <div className="my-4 text-xl tracking-[2px]">
          {results.map((r, i) => (
            <span key={i}>{r ? "🟩" : "🟥"}</span>
          ))}
        </div>
        <div className="mb-5 flex flex-wrap gap-8">
          <div>
            <div className="wrl-mono text-xl font-semibold text-[#eae3d2]">6.2</div>
            <div className="wrl-label">today&apos;s average*</div>
          </div>
          {mode === "daily" && (
            <div>
              <div className="wrl-mono text-xl font-semibold text-[#eae3d2]">#{dayNumber}</div>
              <div className="wrl-label">daily number</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={copyShare} className="wrl-btn-primary">
            {copied ? "Copied!" : "Copy result"}
          </button>
          {mode === "daily" ? (
            <Link href="/higherorlower/practice" className="wrl-btn">Practice mode</Link>
          ) : (
            <button onClick={() => location.reload()} className="wrl-btn">New practice run</button>
          )}
          <Link href="/" className="wrl-btn">More games</Link>
        </div>
        <p className="wrl-label mt-5">*placeholder until daily aggregates are live</p>
      </div>
    );
  }

  return (
    <div>
      {/* progress strip */}
      <div className="mb-6 flex gap-1">
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 ${
              i < results.length
                ? results[i] ? "bg-[#6fbf73]" : "bg-[#e0492e]"
                : i === results.length ? "bg-[#eae3d2]" : "bg-[#383228]"
            }`}
          />
        ))}
      </div>

      <section className="grid grid-cols-1 items-stretch sm:grid-cols-[1fr_56px_1fr]">
        <MapCard m={L} revealed revealColor={null} />
        <div className="flex items-center justify-center py-3 sm:py-0">
          <span className="wrl-condensed -skew-x-6 bg-[#eae3d2] px-2.5 py-1 text-lg font-bold text-[#15130f]">VS</span>
        </div>
        <MapCard
          m={{ ...R, wr: phase === "verdict" && animTime !== null ? animTime : R.wr }}
          revealed={phase === "verdict"}
          revealColor={phase === "verdict" ? (lastOk ? "ok" : "bad") : null}
        >
          {phase === "guess" && (
            <div className="mt-3 flex gap-2.5">
              <button onClick={() => guess(true)} className="wrl-btn-guess">Slower ▲</button>
              <button onClick={() => guess(false)} className="wrl-btn-guess">Faster ▼</button>
            </div>
          )}
        </MapCard>
      </section>

      {phase === "verdict" && (
        <div className="mt-6 flex flex-wrap items-center gap-5 border border-[#383228] bg-[#1d1a15] px-5 py-4">
          <span className={`wrl-condensed text-2xl font-bold uppercase ${lastOk ? "text-[#6fbf73]" : "text-[#e0492e]"}`}>
            {Math.abs(R.wr - L.wr) <= TOLERANCE_MS ? "Photo finish — counts!" : lastOk ? "Plus one" : "Off the pace"}
          </span>
          <div className="min-w-[200px] flex-1">
            <div className="wrl-label mb-1.5">
              {pct}% of players guessed this right · WR by {R.holder}
            </div>
            <div className="relative h-2 bg-[#383228]">
              <i className="absolute inset-y-0 left-0 bg-[#eae3d2] transition-[width] duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button onClick={next} className="wrl-btn-primary">
            {round >= ROUNDS - 1 ? "Finish →" : "Next map →"}
          </button>
        </div>
      )}

      {mode === "daily" && !isSignedIn && phase !== "guess" && (
        <div className="mt-4">
          <SignInButton mode="modal">
            <button className="wrl-label underline decoration-[#ff5800] underline-offset-4 hover:text-[#eae3d2]">
              Sign in to save your stats
            </button>
          </SignInButton>
        </div>
      )}
    </div>
  );
}
