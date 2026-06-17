#!/usr/bin/env python3
"""Upgrade the Higher or Lower pool with speed-colored racing lines.

For every map already in the pool, re-fetches the current WR ghost, derives the
car's speed from the spacing between uniform-time samples, and rewrites the SVG
segments coloured slow→fast. Identity fields (uid, name, src, wr, holder, thumb)
are LEFT UNTOUCHED so daily answers never change — only the visual is upgraded.

Resumable: maps that already carry coloured segments (segs[0].c) are skipped
unless you pass --force. Needs numpy + the dotnet 8 SDK (tools/gbxdump.csproj).

Usage: python tools/add_speed.py [--force] [pool path]
"""
import json, subprocess, time, urllib.request, sys, os, tempfile
import numpy as np

UA = {"User-Agent": "tmdle.com / chilly7383"}
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:] if a != "--force"]
FORCE = "--force" in sys.argv
POOL = args[0] if args else os.path.join(TOOLS_DIR, "..", "src", "data", "wrorlower-pool.json")
DOTNET = ["dotnet", "run", "-c", "Release", "--project", TOOLS_DIR, "--"]
W, H, PAD, NSEG = 130, 100, 10, 28

# ABSOLUTE speed colour scale: km/h maps to colour the same way on every track,
# so a given speed always reads the same. KMH_MAX is the top of the ramp (fast
# road maps top out near here); PCLIP caps teleporter/respawn spikes so a single
# bad sample can't blow up a segment's average or the hover read-out.
KMH_MAX = 430.0
PCLIP = 550.0

# slow → fast colour ramp (blue → green → amber → papaya), readable on #15130f
RAMP = [(0.0, (74, 144, 217)), (0.40, (111, 191, 115)), (0.72, (240, 200, 70)), (1.0, (255, 88, 0))]

def ramp(t):
    t = max(0.0, min(1.0, float(t)))
    for i in range(len(RAMP) - 1):
        t0, c0 = RAMP[i]; t1, c1 = RAMP[i + 1]
        if t <= t1:
            f = (t - t0) / (t1 - t0) if t1 > t0 else 0.0
            r, g, b = (round(c0[k] + (c1[k] - c0[k]) * f) for k in range(3))
            return f"#{r:02x}{g:02x}{b:02x}"
    return "#ff5800"

def kmh_color(kmh):
    return ramp(kmh / KMH_MAX)

def get(url, binary=False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read() if binary else json.loads(r.read())

def to_box(XY):
    mn = XY.min(axis=0); span = np.maximum(XY.max(axis=0) - mn, 1e-6)
    sc = min((W - 2 * PAD) / span[0], (H - 2 * PAD) / span[1])
    off = np.array([(W - span[0] * sc) / 2, (H - span[1] * sc) / 2])
    return (XY - mn) * sc + off

def decimate_idx(n, mx=240):
    step = max(1, n // mx)
    idx = list(range(0, n, step))
    if idx[-1] != n - 1: idx.append(n - 1)
    return np.array(idx)

def overlap_ratio(P, cell=5.0):
    dense = [P[0]]
    for a, b in zip(P[:-1], P[1:]):
        d = np.linalg.norm(b - a)
        for t in np.linspace(0, 1, max(2, int(d / 1.5)))[1:]: dense.append(a + (b - a) * t)
    D = np.array(dense)
    L = np.sum(np.linalg.norm(np.diff(D, axis=0), axis=1))
    return len(set(map(tuple, (D // cell).astype(int)))) / max(L / cell, 1)

def view_basis(az, el):
    az, el = np.radians(az), np.radians(el)
    v = np.array([np.cos(el) * np.cos(az), np.sin(el), np.cos(el) * np.sin(az)])
    up = np.array([0, 1, 0]); r = np.cross(up, v); r /= np.linalg.norm(r) + 1e-9
    return r, np.cross(v, r)

def best_layout(P):
    """Returns the full-length 2D box path plus the readability score and the
    permutation applied (flips) so a per-point speed array stays aligned."""
    C = P - P.mean(axis=0); cands = []
    _, _, Vt = np.linalg.svd(C, full_matrices=False); cands.append(C @ Vt[:2].T)
    for el in (90, 65, 45, 25):
        for az in range(0, 360, 30):
            r, u = view_basis(az, el); cands.append(np.column_stack([C @ r, C @ u]))
            if el == 90: break
    def score(XY):
        B = to_box(XY); return overlap_ratio(B[decimate_idx(len(B))])
    best = max(cands, key=score); sc = score(best)
    XY = best.copy()
    if XY[0, 0] > XY[-1, 0]: XY[:, 0] = -XY[:, 0]
    c = np.corrcoef(P[:, 1], XY[:, 1])[0, 1]
    if not np.isnan(c) and c > 0: XY[:, 1] = -XY[:, 1]
    return to_box(XY), sc

def point_kmh(P, ts, race_ms):
    """Real km/h per point: distance between samples / time between samples.
    Uses each sample's own timestamp when present, else a uniform period from
    the race time. Spikes are clipped to PCLIP."""
    diffs = np.linalg.norm(np.diff(P, axis=0), axis=1)  # metres, len n-1
    times = None
    if ts is not None and len(ts) == len(P) and all(t is not None for t in ts):
        t = np.asarray(ts, dtype=float)
        if np.all(np.diff(t) >= 0): times = t
    if times is not None:
        dt = np.diff(times) / 1000.0
    else:
        period = (float(race_ms) / 1000.0) / max(len(P) - 1, 1)
        dt = np.full(len(P) - 1, period)
    dt = np.where(dt <= 0, np.nan, dt)
    seg = np.clip(np.nan_to_num(diffs / dt * 3.6, nan=0.0), 0, PCLIP)  # km/h, len n-1
    return np.concatenate([seg[:1], (seg[:-1] + seg[1:]) / 2, seg[-1:]])  # len n

def segs(B, kmh):
    idx = decimate_idx(len(B))
    pts, spd = B[idx], kmh[idx]
    out = []
    for chunk in np.array_split(np.arange(len(pts)), NSEG):
        lo = max(chunk[0] - 1, 0)
        d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts[lo:chunk[-1] + 1])
        v = float(np.mean(spd[chunk]))  # representative km/h for this segment
        out.append({"d": d, "o": 0.9, "w": 2.6, "c": kmh_color(v), "v": round(v)})
    return out

pool = json.load(open(POOL))
upgraded = 0
for m in pool:
    if not FORCE and m.get("segs") and m["segs"][0].get("c"):
        continue
    uid, name = m["uid"], m["name"]
    try:
        lb = get(f"https://trackmania.io/api/leaderboard/map/{uid}?offset=0&length=1")
        top = lb["tops"][0]
        gpath = os.path.join(tempfile.gettempdir(), f"{uid}.Ghost.Gbx")
        if not os.path.exists(gpath):
            open(gpath, "wb").write(get("https://trackmania.io" + top["url"], binary=True))
            time.sleep(1.0)
        out = subprocess.run(DOTNET + [gpath], capture_output=True, text=True, timeout=120)
        g = json.loads(out.stdout)
        if g["count"] < 10: raise ValueError("too few samples")
        P = np.array([(p["x"], p["y"], p["z"]) for p in g["pts"]])
        ts = [p.get("t") for p in g["pts"]]
        B, sc = best_layout(P)
        kmh = point_kmh(P, ts, g.get("time"))
        m["segs"] = segs(B, kmh)
        m["sx"], m["sy"] = round(float(B[0, 0]), 1), round(float(B[0, 1]), 1)
        m["fx"], m["fy"] = round(float(B[-1, 0]), 1), round(float(B[-1, 1]), 1)
        m["layoutOk"] = bool(sc >= 0.7)
        upgraded += 1
        print(f"ok  {upgraded:3d}  {sc:.2f}  {name[:36]}", flush=True)
        json.dump(pool, open(POOL, "w"))
    except Exception as e:
        print(f"skip {name[:30]}: {e}", flush=True)
    time.sleep(0.8)

print("done · upgraded", upgraded, "of", len(pool))
