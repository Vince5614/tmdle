import Link from "next/link";

export const metadata = {
  title: "FAQ — What is TMDLE & the daily Trackmania game",
  description:
    "Frequently asked questions about TMDLE: what the daily Trackmania game is, how to play MapGuessr and Higher or Lower, whether it's free, and who made it.",
  alternates: { canonical: "/faq" },
};

// Single source of truth: rendered visibly AND emitted as FAQPage JSON-LD so
// the structured data always matches the on-page text (Google requirement).
const FAQS: { q: string; a: string }[] = [
  {
    q: "What is TMDLE?",
    a: "TMDLE is a free hub of daily Trackmania games. Every day there's a new puzzle — the same one for everyone — that you can play right in your browser. It's made by the Trackmania community, for the community.",
  },
  {
    q: "What is the daily Trackmania game?",
    a: "Each day TMDLE serves one fresh challenge per game that resets at midnight Central European Time. Everybody plays the same daily, you get one attempt, and you can share your result — like a Wordle, but for Trackmania.",
  },
  {
    q: "Which games can I play?",
    a: "Two daily games right now. MapGuessr: identify today's official Trackmania campaign map from attribute clues. Higher or Lower: ten real maps in a chain — guess whether the next map's world record time is faster or slower than the last. More games are planned.",
  },
  {
    q: "How do I play MapGuessr?",
    a: "Guess campaign map names. Each guess reveals how close you are across season, year, map number, surface, car and style — green for an exact match, yellow for close — until you pin down today's map in as few guesses as possible.",
  },
  {
    q: "How do I play Higher or Lower?",
    a: "You're shown a map and its world-record time, then the next map with its record hidden. Call whether that record is faster or slower, ten rounds in a row. Records within 0.2s of each other count either way.",
  },
  {
    q: "Is TMDLE free?",
    a: "Yes, completely free. You can play the daily games without an account. Signing in is optional and just saves your stats and streaks across devices.",
  },
  {
    q: "Do I need to own Trackmania or have an account?",
    a: "No. TMDLE runs entirely in your browser and you don't need the game installed. Map, record and player data comes from community sources like trackmania.io and trackmania.exchange.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes — TMDLE works in any modern mobile or desktop browser.",
  },
  {
    q: "When does the daily reset?",
    a: "At midnight Central European Time (Europe/Brussels), so a brand-new daily is ready each morning.",
  },
  {
    q: "Who made TMDLE?",
    a: "TMDLE is made by chilly, a Trackmania streamer and speedrunner. You can follow along on Twitch and join the community on the TMDLE Discord.",
  },
  {
    q: "Is TMDLE affiliated with Ubisoft or Nadeo?",
    a: "No. TMDLE is an unofficial fan project and is not affiliated with or endorsed by Ubisoft or Nadeo. Trackmania is a trademark of its respective owners.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      <p className="wrl-label mb-1">Help</p>
      <h1 className="mb-2 text-4xl text-[#eae3d2]" style={{ fontFamily: "var(--font-display)" }}>
        Frequently Asked <span className="text-[#ff5800]">Questions</span>
      </h1>
      <p className="mb-10 text-sm text-[#9c9483]">
        Everything you might want to know about TMDLE and the daily Trackmania games.
      </p>

      <div className="space-y-8">
        {FAQS.map((f) => (
          <section key={f.q}>
            <h2 className="wrl-condensed mb-2 text-xl uppercase tracking-wide text-[#eae3d2]">{f.q}</h2>
            <p className="text-sm leading-relaxed text-[#9c9483]">{f.a}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/mapguessr" className="wrl-btn-primary">Play MapGuessr</Link>
        <Link href="/higherorlower" className="wrl-btn">Play Higher or Lower</Link>
        <Link href="/" className="wrl-btn">Home</Link>
      </div>
    </div>
  );
}
