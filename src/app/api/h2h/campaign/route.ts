import { NextRequest, NextResponse } from "next/server";
import { SEASONS, mapsForSeason } from "@/data/campaigns";
import { getMXMap } from "@/lib/mx";
import { nadeoGet } from "@/lib/nadeo";

export interface MapResult {
  name: string;
  number: number;
  p1Time: number | null;
  p2Time: number | null;
  p1Medal: number | null; // 1=bronze 2=silver 3=gold 4=author
  p2Medal: number | null;
  authorTime: number | null;
  goldTime: number | null;
}

export interface SeasonResult {
  season: string;
  maps: MapResult[];
  p1Wins: number;
  p2Wins: number;
  tied: number;
}

// Only fetch seasons that likely have MX data (exclude 2026)
const FETCHABLE = SEASONS.filter(s => !s.includes("2026"));

export async function GET(req: NextRequest) {
  const p1Id = req.nextUrl.searchParams.get("p1");
  const p2Id = req.nextUrl.searchParams.get("p2");
  const seasonParam = req.nextUrl.searchParams.get("season");

  if (!p1Id || !p2Id) return NextResponse.json({ error: "Missing player IDs" }, { status: 400 });

  const toFetch = seasonParam
    ? FETCHABLE.filter(s => s === seasonParam)
    : FETCHABLE.slice(-3); // default: last 3 seasons

  const seasonResults: SeasonResult[] = [];
  let lastError = "Could not load campaign data";

  for (const season of toFetch) {
    try {
      const mapNames = mapsForSeason(season);

      // Get TrackUIDs from MX (cached 24h)
      const mxData = await Promise.all(mapNames.map(n => getMXMap(n)));

      const uids = mxData.map(m => m?.trackUid ?? null);
      const validUids = uids.filter(Boolean) as string[];
      if (validUids.length === 0) continue;

      // Exchange UIDs → Nadeo map IDs + medal times
      const mapsRes = await nadeoGet(`/maps/?mapUidList=${validUids.join(",")}`);
      if (!mapsRes.ok) {
        lastError = `Nadeo /maps failed ${mapsRes.status}: ${await mapsRes.text()}`;
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapsData: any[] = await mapsRes.json();

      const uidToMap: Record<string, { mapId: string; authorScore: number | null; goldScore: number | null }> = {};
      for (const m of mapsData) {
        uidToMap[m.mapUid] = {
          mapId: m.mapId,
          authorScore: m.authorScore ?? null,
          goldScore: m.goldScore ?? null,
        };
      }

      const mapIds = validUids.map(uid => uidToMap[uid]?.mapId).filter(Boolean) as string[];
      if (mapIds.length === 0) continue;

      // Get records for both players on all maps in one call
      const recordsRes = await nadeoGet(
        `/v2/mapRecords/?accountIdList=${p1Id},${p2Id}&mapIdList=${mapIds.join(",")}`
      );
      if (!recordsRes.ok) {
        lastError = `Nadeo /mapRecords failed ${recordsRes.status}: ${await recordsRes.text()}`;
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records: any[] = await recordsRes.json();

      const maps: MapResult[] = mapNames.map((name, i) => {
        const uid = uids[i];
        const mapInfo = uid ? uidToMap[uid] : null;
        const mapId = mapInfo?.mapId ?? null;

        const p1rec = mapId ? records.find(r => r.accountId === p1Id && r.mapId === mapId) : null;
        const p2rec = mapId ? records.find(r => r.accountId === p2Id && r.mapId === mapId) : null;

        return {
          name,
          number: i + 1,
          p1Time: p1rec?.recordScore?.time ?? null,
          p2Time: p2rec?.recordScore?.time ?? null,
          p1Medal: p1rec?.medal ?? null,
          p2Medal: p2rec?.medal ?? null,
          authorTime: mapInfo?.authorScore ?? null,
          goldTime: mapInfo?.goldScore ?? null,
        };
      });

      const p1Wins = maps.filter(m => m.p1Time !== null && m.p2Time !== null && m.p1Time < m.p2Time).length;
      const p2Wins = maps.filter(m => m.p1Time !== null && m.p2Time !== null && m.p2Time < m.p1Time).length;
      const tied = maps.filter(m => m.p1Time !== null && m.p2Time !== null && m.p1Time === m.p2Time).length;

      seasonResults.push({ season, maps, p1Wins, p2Wins, tied });
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      continue;
    }
  }

  if (seasonResults.length === 0) {
    return NextResponse.json({ error: lastError }, { status: 500 });
  }

  return NextResponse.json({ seasons: seasonResults });
}
