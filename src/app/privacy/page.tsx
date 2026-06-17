import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "How TMDLE handles your data.",
  alternates: { canonical: "/privacy" },
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

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="wrl-label mb-1">Legal</p>
      <h1 className="mb-1 text-4xl text-[#eae3d2]" style={{ fontFamily: "var(--font-display)" }}>
        Privacy <span className="text-[#ff5800]">Policy</span>
      </h1>
      <p className="wrl-label mb-8">Last updated {UPDATED}</p>

      <Section title="Who we are">
        <p>
          TMDLE (&quot;we&quot;, &quot;the site&quot;) is a free, community-made hub of daily Trackmania games,
          operated by an individual creator (&quot;chilly&quot;) and reachable through the{" "}
          <a className="text-[#ff5800] hover:text-[#eae3d2]" href="https://discord.com/invite/7ePXZyd6hW" target="_blank" rel="noopener noreferrer">TMDLE Discord</a>.
          This policy explains what data we handle and why.
        </p>
      </Section>

      <Section title="What we collect">
        <p><strong className="text-[#eae3d2]">Account details.</strong> If you choose to sign in, authentication is handled by Clerk, which stores your email address and basic account info. We never see or store your password.</p>
        <p><strong className="text-[#eae3d2]">Game results.</strong> When you finish a daily game we save the day, your score/guesses and whether you won. For signed-in players this is linked to your account so we can show your stats and streaks; for guests it is stored without any identifier, purely as an anonymous play count.</p>
        <p><strong className="text-[#eae3d2]">On your device.</strong> We use your browser&apos;s local storage to remember your progress and stop you replaying the same daily — this stays on your device and is not personal data we collect.</p>
        <p><strong className="text-[#eae3d2]">Analytics.</strong> We use Vercel Web Analytics, which is privacy-friendly and aggregate: it does not use cookies and does not build a profile of you.</p>
      </Section>

      <Section title="Why we use it">
        <p>To run the games, save your stats and streaks, keep the daily fair (one play per day), show aggregate numbers like daily averages, and understand overall traffic so we can improve the site. Our legal bases are providing the service you requested and our legitimate interest in running and improving it.</p>
      </Section>

      <Section title="Who processes it">
        <p>We rely on a few trusted providers that process data on our behalf:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><a className="text-[#ff5800] hover:text-[#eae3d2]" href="https://clerk.com/legal/privacy" target="_blank" rel="noopener noreferrer">Clerk</a> — sign-in and account management.</li>
          <li><a className="text-[#ff5800] hover:text-[#eae3d2]" href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase</a> — database storing game results.</li>
          <li><a className="text-[#ff5800] hover:text-[#eae3d2]" href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel</a> — hosting and aggregate analytics.</li>
        </ul>
        <p>We do not sell your data or share it for advertising.</p>
      </Section>

      <Section title="Cookies">
        <p>The only cookies we set are the strictly-necessary ones Clerk uses to keep you signed in. Our analytics is cookieless, so we do not show a cookie consent banner.</p>
      </Section>

      <Section title="How long we keep it">
        <p>Account data is kept while your account exists. Game results are kept to maintain stats and leaderboards. You can ask us to delete your account and associated results at any time.</p>
      </Section>

      <Section title="Your rights">
        <p>If you are in the EU/EEA, the GDPR gives you the right to access, correct, export or delete your data, and to object to or restrict its processing. To exercise any of these, contact us via the{" "}
          <a className="text-[#ff5800] hover:text-[#eae3d2]" href="https://discord.com/invite/7ePXZyd6hW" target="_blank" rel="noopener noreferrer">TMDLE Discord</a> and we will help.</p>
      </Section>

      <Section title="Children">
        <p>TMDLE is intended for a general audience. If you are under the age required to consent to data processing in your country, please use the site without signing in.</p>
      </Section>

      <Section title="Changes">
        <p>We may update this policy as the site evolves. Material changes will be reflected by the &quot;last updated&quot; date above.</p>
      </Section>

      <Link href="/" className="wrl-btn mt-4 inline-block">← Back to TMDLE</Link>
    </div>
  );
}
