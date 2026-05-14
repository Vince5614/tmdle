import { createClient } from "@supabase/supabase-js";

// Server-only client — uses service role key, never sent to browser
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface GameResult {
  id: string;
  user_id: string;
  game: string;
  day_number: number;
  won: boolean;
  clue_index: number;
  wrong_guesses: string[];
  created_at: string;
}
