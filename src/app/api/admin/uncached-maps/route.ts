import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase";
import { getAllMapNames } from "@/data/campaigns";

const ADMIN_EMAIL = "steyversv@gmail.com";

// GET /api/admin/uncached-maps
// Admin-only diagnostic: returns the full list of campaign map names that
// don't yet have an entry in `map_metadata`, grouped by season so we can spot
// patterns (e.g. "all of Fall 2025 is missing").
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = user.emailAddresses[0]?.emailAddress;
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createServerSupabase();
  const { data: existing, error } = await sb.from("map_metadata").select("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cached = new Set((existing ?? []).map((r) => r.name));
  const allNames = getAllMapNames();
  const uncached = allNames.filter((n) => !cached.has(n));

  // Group by season for easier diagnosis
  const bySeason: Record<string, string[]> = {};
  for (const n of uncached) {
    const m = n.match(/^(.+) - (\d{2})$/);
    if (!m) continue;
    const season = m[1];
    if (!bySeason[season]) bySeason[season] = [];
    bySeason[season].push(n);
  }

  return NextResponse.json({
    total: allNames.length,
    cached: cached.size,
    uncached: uncached.length,
    bySeason,
  });
}
