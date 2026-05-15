import { createServerSupabase } from "@/lib/supabase";

const UBI_AUTH = "https://public-ubiservices.ubi.com/v3/profiles/sessions";
const NADEO_TOKEN = "https://prod.trackmania.core.nadeo.online/v2/authentication/token/ubiservices";
const NADEO_BASE = "https://prod.trackmania.core.nadeo.online";
const UA = "tmdle/1.0 contact@tmdle.com";

// In-memory cache (warm serverless instance). Survives Next.js HMR via globalThis.
const g = globalThis as typeof globalThis & { _nadeoCache?: { token: string; expiresAt: number } };

function setMemoryCache(token: string, expiresAt: number) {
  g._nadeoCache = { token, expiresAt };
}

// Persistent cache shared across all serverless instances (cold starts safe).
async function readSupabaseToken(): Promise<{ token: string; expiresAt: number } | null> {
  try {
    const sb = createServerSupabase();
    const { data } = await sb
      .from("nadeo_tokens")
      .select("token, expires_at")
      .eq("id", 1)
      .maybeSingle();
    if (!data || !data.token) return null;
    const expiresAt = new Date(data.expires_at).getTime();
    // Refresh ~5min before actual expiry so requests don't fail mid-flight
    if (Date.now() >= expiresAt - 5 * 60 * 1000) return null;
    return { token: data.token, expiresAt };
  } catch {
    return null;
  }
}

async function writeSupabaseToken(token: string, expiresAt: number) {
  try {
    const sb = createServerSupabase();
    await sb.from("nadeo_tokens").upsert({
      id: 1,
      token,
      expires_at: new Date(expiresAt).toISOString(),
    });
  } catch {
    // Non-fatal — memory cache still keeps this instance working
  }
}

async function refreshFromUbisoft(): Promise<string> {
  const basic = Buffer.from(
    `${process.env.NADEO_EMAIL}:${process.env.NADEO_PASSWORD}`
  ).toString("base64");

  const ubiRes = await fetch(UBI_AUTH, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
      "Ubi-AppId": "86263886-327a-4328-ac69-527f0d20a237",
      "User-Agent": UA,
    },
    body: "{}",
  });

  if (!ubiRes.ok) {
    // If we got rate-limited, another instance may have already refreshed the
    // token to Supabase — re-read it before giving up
    if (ubiRes.status === 429) {
      const sb = await readSupabaseToken();
      if (sb) {
        setMemoryCache(sb.token, sb.expiresAt);
        return sb.token;
      }
    }
    throw new Error(`Ubisoft auth failed: ${ubiRes.status} ${await ubiRes.text()}`);
  }
  const { ticket } = await ubiRes.json();

  const nadeoRes = await fetch(NADEO_TOKEN, {
    method: "POST",
    headers: {
      Authorization: `nadeo_v1 t=${ticket}`,
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
    body: JSON.stringify({ audience: "NadeoServices" }),
  });
  if (!nadeoRes.ok) {
    throw new Error(`Nadeo token failed: ${nadeoRes.status} ${await nadeoRes.text()}`);
  }
  const { accessToken } = await nadeoRes.json();

  const expiresAt = Date.now() + 55 * 60 * 1000;
  setMemoryCache(accessToken, expiresAt);
  await writeSupabaseToken(accessToken, expiresAt);
  return accessToken;
}

export async function getNadeoToken(): Promise<string> {
  // 1. In-memory cache (single warm instance — fastest path)
  if (g._nadeoCache && Date.now() < g._nadeoCache.expiresAt) {
    return g._nadeoCache.token;
  }

  // 2. Shared persistent cache (Supabase) — survives cold starts &
  //    is shared across all serverless instances
  const sb = await readSupabaseToken();
  if (sb) {
    setMemoryCache(sb.token, sb.expiresAt);
    return sb.token;
  }

  // 3. Refresh from Ubisoft (rate-limited — only happens ~hourly)
  return refreshFromUbisoft();
}

export async function nadeoGet(path: string): Promise<Response> {
  const token = await getNadeoToken();
  return fetch(`${NADEO_BASE}${path}`, {
    headers: { Authorization: `nadeo_v1 t=${token}`, "User-Agent": UA },
  });
}
