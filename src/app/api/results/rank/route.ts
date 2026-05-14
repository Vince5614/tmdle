import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// GET /api/results/rank?game=mapguessr&day_number=1
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ rank: null, total: 0 }, { status: 401 });

  const game = req.nextUrl.searchParams.get("game") ?? "mapguessr";
  const dayNumber = parseInt(req.nextUrl.searchParams.get("day_number") ?? "0");

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("game_results")
    .select("user_id, won, clue_index")
    .eq("game", game)
    .eq("day_number", dayNumber);

  if (!data || data.length === 0) return NextResponse.json({ rank: null, total: 0 });

  // Higher score = better: won gives 10 - clue_index, loss gives -1
  const score = (r: { won: boolean; clue_index: number }) =>
    r.won ? 10 - r.clue_index : -1;

  const user = data.find((r) => r.user_id === userId);
  if (!user) return NextResponse.json({ rank: null, total: data.length });

  const userScore = score(user);
  const rank = data.filter((r) => score(r) > userScore).length + 1;
  const percentile = Math.ceil((rank / data.length) * 100);

  return NextResponse.json({ rank, total: data.length, percentile });
}
