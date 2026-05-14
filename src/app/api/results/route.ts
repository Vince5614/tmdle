import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// GET /api/results?game=mapguessr  — fetch all results for the signed-in user
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const game = req.nextUrl.searchParams.get("game") ?? "mapguessr";
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("game_results")
    .select("*")
    .eq("user_id", userId)
    .eq("game", game)
    .order("day_number", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/results  — save a completed game
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { game, day_number, won, clue_index, wrong_guesses } = body;

  if (!game || day_number == null || won == null || clue_index == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { error } = await supabase
    .from("game_results")
    .upsert(
      { user_id: userId, game, day_number, won, clue_index, wrong_guesses: wrong_guesses ?? [] },
      { onConflict: "user_id,game,day_number" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
