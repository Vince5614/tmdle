import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#383228] py-8 text-center">
      <p className="text-sm text-[#6b6557]">
        Made by{" "}
        <a
          href="https://www.twitch.tv/chilly7383"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#ff5800] transition-colors hover:text-[#eae3d2]"
        >
          chilly
        </a>
        {" · "}
        <span>tmdle.com</span>
        {" · "}
        <span>{new Date().getFullYear()}</span>
      </p>

      <div className="mt-3 flex items-center justify-center gap-3 text-xs">
        <Link href="/faq" className="text-[#6b6557] transition-colors hover:text-[#eae3d2]">FAQ</Link>
        <span className="text-[#383228]">·</span>
        <Link href="/privacy" className="text-[#6b6557] transition-colors hover:text-[#eae3d2]">Privacy</Link>
        <span className="text-[#383228]">·</span>
        <Link href="/terms" className="text-[#6b6557] transition-colors hover:text-[#eae3d2]">Terms</Link>
      </div>

      <p className="mx-auto mt-3 max-w-md px-4 text-[10px] leading-relaxed text-[#6b6557]">
        Unofficial fan project — not affiliated with or endorsed by Ubisoft or Nadeo. Trackmania is a
        trademark of its respective owners. Map and record data from trackmania.io and trackmania.exchange.
      </p>
    </footer>
  );
}
