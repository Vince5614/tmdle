import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase";

const ADMIN_EMAIL = "steyversv@gmail.com";
const ALLOWED_GAMES = ["mapguessr", "wrorlower", "wrorlower-practice"];

// GET /api/admin/stats?game=mapguessr (default keeps old behavior intact)
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = user.emailAddresses[0]?.emailAddress;
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const game = req.nextUrl.searchParams.get("game") ?? "mapguessr";
  if (!ALLOWED_GAMES.includes(game)) {
    return NextResponse.json({ error: "Unknown game" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("game_results")
    .select("day_number, user_id, won, clue_index")
    .eq("game", game)
    .order("day_number", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by day. For wrorlower games, clue_index holds the score (0-10),
  // so avgClue doubles as the average score.
  const byDay: Record<number, { total: number; signedIn: number; guests: number; wins: number; clueIndexes: number[] }> = {};
  for (const row of data ?? []) {
    if (!byDay[row.day_number]) {
      byDay[row.day_number] = { total: 0, signedIn: 0, guests: 0, wins: 0, clueIndexes: [] };
    }
    const d = byDay[row.day_number];
    d.total++;
    if (row.user_id) d.signedIn++; else d.guests++;
    if (row.won) d.wins++;
    d.clueIndexes.push(row.clue_index);
  }

  const days = Object.entries(byDay)
    .map(([dayNumber, d]) => ({
      dayNumber: Number(dayNumber),
      ...d,
      winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0,
      avgClue: d.clueIndexes.length > 0
        ? Math.round((d.clueIndexes.reduce((a, b) => a + b, 0) / d.clueIndexes.length) * 10) / 10
        : 0,
    }))
    .sort((a, b) => b.dayNumber - a.dayNumber);

  return NextResponse.json({ days, totalAllTime: data?.length ?? 0 });
}
