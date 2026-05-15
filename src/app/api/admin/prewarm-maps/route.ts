import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase";
import { getAllMapNames } from "@/data/campaigns";
import { buildEnrichedMap } from "@/lib/mapguessr2";

const ADMIN_EMAIL = "steyversv@gmail.com";

// One call processes up to BUDGET maps in batches to avoid Vercel timeouts (60s)
// and hammering MX too hard.
const BUDGET = 15;
const PARALLEL = 2;
const DELAY_BETWEEN_BATCHES_MS = 600;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// POST /api/admin/prewarm-maps
// Admin only. Fetches and caches MX data for any uncached campaign map.
// Returns progress so the admin UI can loop until all maps are cached.
export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = user.emailAddresses[0]?.emailAddress;
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createServerSupabase();
  const allNames = getAllMapNames();

  // Find already-cached names
  const { data: existing, error: existingErr } = await sb
    .from("map_metadata")
    .select("name");
  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }
  const cachedSet = new Set((existing ?? []).map((r) => r.name));
  const toFetch = allNames.filter((n) => !cachedSet.has(n)).slice(0, BUDGET);

  let cached = 0;
  let errors = 0;
  const failedNames: string[] = [];

  // Process in small parallel batches with a delay between them.
  for (let i = 0; i < toFetch.length; i += PARALLEL) {
    const batch = toFetch.slice(i, i + PARALLEL);
    const results = await Promise.allSettled(batch.map((name) => buildEnrichedMap(name)));

    const upserts: Array<{ name: string; data: unknown; updated_at: string }> = [];
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === "fulfilled" && r.value) {
        upserts.push({
          name: batch[j],
          data: r.value,
          updated_at: new Date().toISOString(),
        });
        cached++;
      } else {
        errors++;
        failedNames.push(batch[j]);
      }
    }

    if (upserts.length > 0) {
      const { error: upErr } = await sb.from("map_metadata").upsert(upserts);
      if (upErr) errors += upserts.length;
    }

    // Brief pause between batches so we don't hammer MX
    if (i + PARALLEL < toFetch.length) await sleep(DELAY_BETWEEN_BATCHES_MS);
  }

  const totalCached = cachedSet.size + cached;
  return NextResponse.json({
    total: allNames.length,
    totalCached,
    newlyCached: cached,
    errors,
    failedSample: failedNames.slice(0, 5),
    remaining: allNames.length - totalCached,
    hasMore: totalCached < allNames.length,
  });
}
