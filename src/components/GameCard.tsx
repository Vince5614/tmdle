type GameCardProps = {
  title: string;
  description: string;
  accentColor: string;
  number: number;
};

export default function GameCard({
  title,
  description,
  accentColor,
  number,
}: GameCardProps) {
  return (
    <div
      className="game-card group flex cursor-not-allowed flex-col overflow-hidden rounded-2xl bg-[#141414]"
      style={{ "--card-glow": accentColor } as React.CSSProperties}
    >
      {/* Colored top area */}
      <div
        className="relative flex h-36 items-center justify-center overflow-hidden"
        style={{ backgroundColor: accentColor }}
      >
        {/* Diagonal speed lines overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(55deg, transparent, transparent 10px, rgba(0,0,0,0.08) 10px, rgba(0,0,0,0.08) 11px)",
          }}
        />
        {/* Dark gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/40" />

        {/* "DAILY" badge */}
        <span className="absolute right-3 top-3 rounded-full border border-white/30 bg-black/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          Daily
        </span>

        {/* Large translucent number */}
        <span
          className="relative select-none text-[6rem] font-black leading-none text-white/15"
          style={{ fontFamily: "var(--font-display)" }}
          aria-hidden
        >
          {number}
        </span>

        {/* Bottom edge fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#141414]/60 to-transparent" />
      </div>

      {/* Card content */}
      <div className="flex flex-1 flex-col p-5">
        <h2
          className="text-base font-bold tracking-wide text-white"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
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
              backgroundColor: `${accentColor}18`,
              color: accentColor,
              border: `1px solid ${accentColor}30`,
            }}
          >
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
