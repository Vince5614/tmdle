export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 text-center">
      <p className="text-sm text-gray-500">
        Made by{" "}
        <a
          href="https://www.twitch.tv/chilly7383"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
        >
          chilly
        </a>
        {" · "}
        <span className="text-gray-500">tmdle.com</span>
        {" · "}
        <span className="text-gray-600">{new Date().getFullYear()}</span>
      </p>
    </footer>
  );
}
