import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description: "The terms for using TMDLE.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "17 June 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="wrl-condensed mb-2 text-xl uppercase tracking-wide text-[#eae3d2]">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-[#9c9483]">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="wrl-label mb-1">Legal</p>
      <h1 className="mb-1 text-4xl text-[#eae3d2]" style={{ fontFamily: "var(--font-display)" }}>
        Terms of <span className="text-[#ff5800]">Service</span>
      </h1>
      <p className="wrl-label mb-8">Last updated {UPDATED}</p>

      <Section title="The basics">
        <p>TMDLE is a free, community-made collection of daily Trackmania games. By using the site you agree to these terms. If you don&apos;t agree, please don&apos;t use it.</p>
      </Section>

      <Section title="Not affiliated with Ubisoft or Nadeo">
        <p>TMDLE is an unofficial fan project. It is not affiliated with, endorsed by, or sponsored by Ubisoft Entertainment or Nadeo. &quot;Trackmania&quot; and related names, logos and game assets are the property of their respective owners. Map, world-record and player data is sourced from community services including trackmania.io and trackmania.exchange, and remains the property of those services and the original map authors and players.</p>
      </Section>

      <Section title="Your account and fair use">
        <p>If you create an account (via Clerk), you&apos;re responsible for activity under it. Please use the site reasonably: don&apos;t attempt to break, overload, scrape, or abuse it, cheat the daily games, or interfere with other players&apos; experience.</p>
      </Section>

      <Section title="Availability">
        <p>The site is provided &quot;as is&quot; and &quot;as available&quot;. It&apos;s a hobby project — games, data and features may change, break, or go offline at any time, and daily puzzles depend on third-party data we don&apos;t control.</p>
      </Section>

      <Section title="Limitation of liability">
        <p>To the fullest extent allowed by law, we are not liable for any loss or damage arising from your use of TMDLE, including lost stats, downtime, or inaccuracies in third-party game data.</p>
      </Section>

      <Section title="Changes and contact">
        <p>We may update these terms as the site evolves; the &quot;last updated&quot; date reflects the latest version. These terms are governed by the laws of Belgium. Questions? Reach us via the{" "}
          <a className="text-[#ff5800] hover:text-[#eae3d2]" href="https://discord.com/invite/7ePXZyd6hW" target="_blank" rel="noopener noreferrer">TMDLE Discord</a>.</p>
      </Section>

      <Link href="/" className="wrl-btn mt-4 inline-block">← Back to TMDLE</Link>
    </div>
  );
}
