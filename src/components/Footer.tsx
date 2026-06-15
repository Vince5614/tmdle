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
    </footer>
  );
}
