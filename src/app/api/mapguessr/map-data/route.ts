import { NextRequest, NextResponse } from "next/server";
import { buildEnrichedMap } from "@/lib/mapguessr2";
import { getAllMapNames } from "@/data/campaigns";
import { createServerSupabase } from "@/lib/supabase";
import type { EnrichedMap } from "@/types/mapguessr2";

// 14 days — MX data for official maps changes very rarely (only WR updates)
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

// GET /api/mapguessr/map-data?name=...
// Returns EnrichedMap. Reads from Supabase cache first, falls back to MX, then
// writes back so the next request is instant.
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const validNames = getAllMapNames();
  if (!validNames.includes(name)) {
    return NextResponse.json({ error: "Not a valid campaign map" }, { status: 404 });
  }

  const sb = createServerSupabase();

  // 1. Try Supabase cache
  try {
    const { data: cached } = await sb
      .from("map_metadata")
      .select("data, updated_at")
      .eq("name", name)
      .maybeSingle();

    if (cached?.data) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json(cached.data as EnrichedMap, {
          headers: {
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
            "X-Cache": "HIT",
          },
        });
      }
    }
  } catch {
    // Supabase unreachable — fall through to MX
  }

  // 2. Cache miss → fetch from MX
  const data = await buildEnrichedMap(name);
  if (!data) {
    return NextResponse.json({ error: "Map data not available on MX" }, { status: 404 });
  }

  // 3. Write back to Supabase (non-blocking — don't await)
  sb.from("map_metadata")
    .upsert({ name, data, updated_at: new Date().toISOString() })
    .then(() => {});

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      "X-Cache": "MISS",
    },
  });
}
