type GameCardProps = {
  title: string;
  description: string;
  accentColor: string;
  number: number;
  wide?: boolean;
};

export default function GameCard({
  title,
  description,
  accentColor,
  number,
  wide = false,
}: GameCardProps) {
  return (
    <div
      className={`game-card group flex cursor-not-allowed overflow-hidden rounded-2xl bg-[#111] ${wide ? "flex-row" : "flex-col"} h-full`}
      style={{ "--card-glow": accentColor } as React.CSSProperties}
    >
      {/* Colored accent section */}
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden ${wide ? "w-48" : "h-36 w-full"}`}
        style={{ backgroundColor: accentColor }}
      >
        {/* Diagonal speed lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(55deg, transparent, transparent 10px, rgba(0,0,0,0.07) 10px, rgba(0,0,0,0.07) 11px)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/40" />

        {/* DAILY badge */}
        <span className="absolute right-3 top-3 rounded-full border border-white/25 bg-black/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
          Daily
        </span>

        {/* Number */}
        <span
          className="relative select-none font-bold leading-none text-white/15"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: wide ? "5rem" : "6rem",
          }}
          aria-hidden
        >
          {number}
        </span>

        {/* Fade edge into card body */}
        {wide ? (
          <div className="absolute bottom-0 right-0 top-0 w-8 bg-gradient-to-r from-transparent to-[#111]/50" />
        ) : (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#111]/60 to-transparent" />
        )}
      </div>

      {/* Text content */}
      <div className="flex flex-1 flex-col justify-center p-5">
        <h2
          className="text-sm font-semibold tracking-wide text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
        <div className="mt-4">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: `${accentColor}15`,
              color: accentColor,
              border: `1px solid ${accentColor}28`,
            }}
          >
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
