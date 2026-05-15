import { NextRequest, NextResponse } from "next/server";

const UA = "tmdle/1.0 contact@tmdle.com";

const FLAG_EMOJI: Record<string, string> = {
  "Belgium": "🇧🇪", "France": "🇫🇷", "Germany": "🇩🇪", "Netherlands": "🇳🇱",
  "Sweden": "🇸🇪", "Finland": "🇫🇮", "Norway": "🇳🇴", "Denmark": "🇩🇰",
  "United Kingdom": "🇬🇧", "Poland": "🇵🇱", "Spain": "🇪🇸", "Italy": "🇮🇹",
  "Switzerland": "🇨🇭", "Austria": "🇦🇹", "Czech Republic": "🇨🇿", "Portugal": "🇵🇹",
  "United States": "🇺🇸", "Canada": "🇨🇦", "Australia": "🇦🇺", "Brazil": "🇧🇷",
  "Russia": "🇷🇺", "China": "🇨🇳", "Japan": "🇯🇵", "South Korea": "🇰🇷",
  "Hungary": "🇭🇺", "Romania": "🇷🇴", "Slovakia": "🇸🇰", "Slovenia": "🇸🇮",
  "Croatia": "🇭🇷", "Serbia": "🇷🇸", "Bulgaria": "🇧🇬", "Greece": "🇬🇷",
  "Turkey": "🇹🇷", "Ukraine": "🇺🇦", "Belarus": "🇧🇾", "Lithuania": "🇱🇹",
  "Latvia": "🇱🇻", "Estonia": "🇪🇪", "Luxembourg": "🇱🇺", "Iceland": "🇮🇸",
  "Ireland": "🇮🇪", "New Zealand": "🇳🇿", "Argentina": "🇦🇷", "Mexico": "🇲🇽",
  "Chile": "🇨🇱", "Colombia": "🇨🇴", "Peru": "🇵🇪", "Venezuela": "🇻🇪",
  "Israel": "🇮🇱", "Saudi Arabia": "🇸🇦", "UAE": "🇦🇪", "South Africa": "🇿🇦",
  "Morocco": "🇲🇦", "Egypt": "🇪🇬", "India": "🇮🇳", "Pakistan": "🇵🇰",
  "Malaysia": "🇲🇾", "Singapore": "🇸🇬", "Thailand": "🇹🇭", "Philippines": "🇵🇭",
};

const CONTINENTS = new Set(["Europe", "North America", "South America", "Asia", "Africa", "Oceania", "Middle East"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCountry(zone: any): { name: string; emoji: string } {
  let z = zone;
  while (z?.parent) {
    if (CONTINENTS.has(z.parent.name)) return { name: z.name, emoji: FLAG_EMOJI[z.name] ?? "🌍" };
    z = z.parent;
  }
  const name = zone?.name ?? "";
  return { name, emoji: FLAG_EMOJI[name] ?? "🌍" };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const res = await fetch(`https://trackmania.io/api/players/find?search=${encodeURIComponent(q)}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) return NextResponse.json([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = await res.json();
  const results = (data ?? []).slice(0, 6).map((item) => {
    const p = item.player;
    const country = extractCountry(p.zone);
    return {
      accountId: p.id as string,
      name: p.name as string,
      zoneName: (p.zone?.name as string) ?? "",
      country: country.name,
      flag: country.emoji,
    };
  });

  return NextResponse.json(results);
}
