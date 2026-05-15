import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// POST /api/results/guest — save a completed game for a non-authenticated user
// user_id is null, these rows are purely for play count analytics
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { game, day_number, won, clue_index, wrong_guesses } = body;

  if (!game || day_number == null || won == null || clue_index == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("game_results")
    .insert({
      user_id: null,
      game,
      day_number,
      won,
      clue_index,
      wrong_guesses: wrong_guesses ?? [],
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
