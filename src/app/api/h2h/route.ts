import { NextRequest, NextResponse } from "next/server";

const TMIO = "https://trackmania.io/api";
const UA = "tmdle/1.0 contact@tmdle.com";

async function tmio(path: string) {
  const res = await fetch(`${TMIO}${path}`, {
    headers: { "User-Agent": UA },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

function divisionName(div: { position?: number; rule?: string } | null): string {
  if (!div) return "Unranked";
  if (div.rule) {
    return div.rule
      .replace(/(\d)/, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .replace("trackmaster", "Trackmaster");
  }
  const names: Record<number, string> = {
    1: "Bronze 1", 2: "Bronze 2", 3: "Bronze 3",
    4: "Silver 1", 5: "Silver 2", 6: "Silver 3",
    7: "Gold 1", 8: "Gold 2", 9: "Gold 3",
    10: "Master 1", 11: "Master 2", 12: "Master 3",
    13: "Trackmaster",
  };
  return names[div.position ?? 0] ?? "Unranked";
}

const FLAG_EMOJI: Record<string, string> = {
  "Belgium": "🇧🇪", "France": "🇫🇷", "Germany": "🇩🇪", "Netherlands": "🇳🇱",
  "Sweden": "🇸🇪", "Finland": "🇫🇮", "Norway": "🇳🇴", "Denmark": "🇩🇰",
  "United Kingdom": "🇬🇧", "Poland": "🇵🇱", "Spain": "🇪🇸", "Italy": "🇮🇹",
  "Switzerland": "🇨🇭", "Austria": "🇦🇹", "Czech Republic": "🇨🇿", "Portugal": "🇵🇹",
  "United States": "🇺🇸", "Canada": "🇨🇦", "Australia": "🇦🇺", "Brazil": "🇧🇷",
  "Russia": "🇷🇺", "China": "🇨🇳", "Japan": "🇯🇵", "South Korea": "🇰🇷",
  "Hungary": "🇭🇺", "Romania": "🇷🇴", "Slovakia": "🇸🇰", "Croatia": "🇭🇷",
  "Turkey": "🇹🇷", "Ukraine": "🇺🇦", "Lithuania": "🇱🇹", "Latvia": "🇱🇻",
  "Estonia": "🇪🇪", "Luxembourg": "🇱🇺", "Ireland": "🇮🇪", "New Zealand": "🇳🇿",
  "Argentina": "🇦🇷", "Mexico": "🇲🇽", "Chile": "🇨🇱", "Colombia": "🇨🇴",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCountryFlag(zone: any): string {
  const chain: string[] = [];
  let z = zone;
  while (z) { chain.push(z.name); z = z.parent; }
  const country = chain.length >= 3 ? chain[chain.length - 3] : chain[0] ?? "";
  return FLAG_EMOJI[country] ?? "🌍";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shape(player: any, profile: any) {
  const mm2v2 = profile?.matchmaking?.find((m: any) => m.info.typename === "2v2");
  const mmRoyal = profile?.matchmaking?.find((m: any) => m.info.typename === "Royal");
  return {
    accountId: player.id as string,
    displayName: player.name as string,
    clubTag: (player.tag as string) ?? null,
    countryFlag: extractCountryFlag(player.zone),
    zone: player.zone ? { name: player.zone.name as string, flag: player.zone.flag as string } : null,
    trophies: {
      points: (profile?.trophies?.points ?? 0) as number,
      counts: (profile?.trophies?.counts ?? Array(9).fill(0)) as number[],
      echelon: (profile?.trophies?.echelon ?? 0) as number,
      zonePositions: (profile?.trophies?.zonepositions ?? []) as number[],
    },
    matchmaking: {
      twoVTwo: mm2v2 ? {
        rank: mm2v2.info.rank as number,
        score: mm2v2.info.score as number,
        total: mm2v2.total as number,
        division: divisionName(mm2v2.info.division),
      } : null,
      royal: mmRoyal ? {
        rank: mmRoyal.info.rank as number,
        score: mmRoyal.info.score as number,
        total: mmRoyal.total as number,
        division: divisionName(mmRoyal.info.division),
      } : null,
    },
  };
}

export async function GET(req: NextRequest) {
  const p1Name = req.nextUrl.searchParams.get("p1");
  const p2Name = req.nextUrl.searchParams.get("p2");
  if (!p1Name || !p2Name) return NextResponse.json({ error: "Missing player names" }, { status: 400 });

  const [r1, r2] = await Promise.all([
    tmio(`/players/find?search=${encodeURIComponent(p1Name)}`),
    tmio(`/players/find?search=${encodeURIComponent(p2Name)}`),
  ]);

  const p1 = r1?.[0]?.player;
  const p2 = r2?.[0]?.player;
  if (!p1) return NextResponse.json({ error: `Player "${p1Name}" not found` }, { status: 404 });
  if (!p2) return NextResponse.json({ error: `Player "${p2Name}" not found` }, { status: 404 });

  const [prof1, prof2] = await Promise.all([
    tmio(`/player/${p1.id}`),
    tmio(`/player/${p2.id}`),
  ]);

  return NextResponse.json({ player1: shape(p1, prof1), player2: shape(p2, prof2) });
}
