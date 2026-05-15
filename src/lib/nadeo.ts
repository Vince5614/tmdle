const UBI_AUTH = "https://public-ubiservices.ubi.com/v3/profiles/sessions";
const NADEO_TOKEN = "https://prod.trackmania.core.nadeo.online/v2/authentication/token/ubiservices";
const NADEO_BASE = "https://prod.trackmania.core.nadeo.online";
const UA = "tmdle/1.0 contact@tmdle.com";

// Persist across Next.js hot module reloads in dev so we don't re-auth on every HMR
const g = globalThis as typeof globalThis & { _nadeoCache?: { token: string; expiresAt: number } };

export async function getNadeoToken(): Promise<string> {
  if (g._nadeoCache && Date.now() < g._nadeoCache.expiresAt) return g._nadeoCache.token;

  const basic = Buffer.from(`${process.env.NADEO_EMAIL}:${process.env.NADEO_PASSWORD}`).toString("base64");

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
  if (!ubiRes.ok) throw new Error(`Ubisoft auth failed: ${ubiRes.status} ${await ubiRes.text()}`);
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
  if (!nadeoRes.ok) throw new Error(`Nadeo token failed: ${nadeoRes.status} ${await nadeoRes.text()}`);
  const { accessToken } = await nadeoRes.json();

  g._nadeoCache = { token: accessToken, expiresAt: Date.now() + 55 * 60 * 1000 };
  return accessToken;
}

export async function nadeoGet(path: string): Promise<Response> {
  const token = await getNadeoToken();
  return fetch(`${NADEO_BASE}${path}`, {
    headers: { Authorization: `nadeo_v1 t=${token}`, "User-Agent": UA },
  });
}
