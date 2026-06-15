#!/usr/bin/env python3
"""Build the Higher or Lower map pool: TOTD maps with WR + best-view ghost layouts.

Resumable: existing maps are kept, only new TOTDs (current + previous month)
are fetched. Run monthly — locally or via .github/workflows/refresh-pool.yml.

Usage: python tools/build_pool.py [pool path]
Defaults to src/data/wrorlower-pool.json. Needs numpy and the dotnet 8 SDK
(tools/gbxdump.csproj parses the WR ghosts).
"""
import json, re, subprocess, time, urllib.request, sys, os, tempfile
import numpy as np

UA = {"User-Agent": "tmdle.com / chilly7383"}
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
POOL = sys.argv[1] if len(sys.argv) > 1 else os.path.join(TOOLS_DIR, "..", "src", "data", "wrorlower-pool.json")
DOTNET = ["dotnet","run","-c","Release","--project",TOOLS_DIR,"--"]
W,H,PAD,NSEG = 130,100,10,14

def get(url, binary=False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read() if binary else json.loads(r.read())

def strip_codes(n):
    n = re.sub(r"\$[0-9a-fA-F]{3}","",n); n = re.sub(r"\$[oiswntgzmOISWNTGZM<>]","",n)
    return n.replace("$$","$").strip()

def to_box(XY):
    mn=XY.min(axis=0); span=np.maximum(XY.max(axis=0)-mn,1e-6)
    sc=min((W-2*PAD)/span[0],(H-2*PAD)/span[1])
    off=np.array([(W-span[0]*sc)/2,(H-span[1]*sc)/2])
    return (XY-mn)*sc+off

def decimate(B,mx=240):
    step=max(1,len(B)//mx); return np.vstack([B[::step],B[-1:]])

def overlap_ratio(P,cell=5.0):
    dense=[P[0]]
    for a,b in zip(P[:-1],P[1:]):
        d=np.linalg.norm(b-a)
        for t in np.linspace(0,1,max(2,int(d/1.5)))[1:]: dense.append(a+(b-a)*t)
    D=np.array(dense)
    L=np.sum(np.linalg.norm(np.diff(D,axis=0),axis=1))
    return len(set(map(tuple,(D//cell).astype(int))))/max(L/cell,1)

def view_basis(az,el):
    az,el=np.radians(az),np.radians(el)
    v=np.array([np.cos(el)*np.cos(az),np.sin(el),np.cos(el)*np.sin(az)])
    up=np.array([0,1,0]); r=np.cross(up,v); r/=np.linalg.norm(r)+1e-9
    return r,np.cross(v,r)

def best_layout(P):
    C=P-P.mean(axis=0); cands=[]
    _,_,Vt=np.linalg.svd(C,full_matrices=False); cands.append(C@Vt[:2].T)
    for el in (90,65,45,25):
        for az in range(0,360,30):
            r,u=view_basis(az,el); cands.append(np.column_stack([C@r,C@u]))
            if el==90: break
    best=max(cands,key=lambda XY: overlap_ratio(decimate(to_box(XY))))
    sc=overlap_ratio(decimate(to_box(best)))
    XY=best.copy()
    if XY[0,0]>XY[-1,0]: XY[:,0]=-XY[:,0]
    c=np.corrcoef(P[:,1],XY[:,1])[0,1]
    if not np.isnan(c) and c>0: XY[:,1]=-XY[:,1]
    return to_box(XY), sc

def segs(B):
    pts=decimate(B); out=[]
    for i,idx in enumerate(np.array_split(np.arange(len(pts)),NSEG)):
        lo=max(idx[0]-1,0)
        d="M "+" L ".join(f"{x:.1f} {y:.1f}" for x,y in pts[lo:idx[-1]+1])
        t=i/(NSEG-1); out.append({"d":d,"o":round(0.30+0.70*t,2),"w":round(2.0+1.0*t,1)})
    return out

pool = json.load(open(POOL)) if os.path.exists(POOL) else []
done = {m["uid"] for m in pool}
added = 0
months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

for page in (0,1):
    totd = get(f"https://trackmania.io/api/totd/{page}")
    for day in totd["days"]:
        m = day["map"]; uid = m["mapUid"]
        if uid in done: continue
        name = strip_codes(m["name"])
        try:
            lb = get(f"https://trackmania.io/api/leaderboard/map/{uid}?offset=0&length=1")
            top = lb["tops"][0]
            gpath = os.path.join(tempfile.gettempdir(), f"{uid}.Ghost.Gbx")
            if not os.path.exists(gpath):
                open(gpath,"wb").write(get("https://trackmania.io"+top["url"], binary=True))
                time.sleep(1.0)
            out = subprocess.run(DOTNET+[gpath], capture_output=True, text=True, timeout=120)
            g = json.loads(out.stdout)
            if g["count"] < 10 or g["time"] != top["time"]: raise ValueError("ghost mismatch")
            P = np.array([(p["x"],p["y"],p["z"]) for p in g["pts"]])
            B, sc = best_layout(P)
            pool.append({
                "uid": uid, "name": name,
                # Stamped so getDailyDeck can exclude maps until the day after
                # they land — a mid-day deploy must never change today's deck.
                "added": time.strftime("%Y-%m-%d", time.gmtime()),
                "src": f"Track of the Day · {day['monthday']} {months[totd['month']-1]} {totd['year']}",
                "wr": top["time"], "holder": top["player"]["name"],
                "thumb": m["thumbnailUrl"],
                "segs": segs(B),
                "sx": round(float(B[0,0]),1), "sy": round(float(B[0,1]),1),
                "fx": round(float(B[-1,0]),1), "fy": round(float(B[-1,1]),1),
                "layoutOk": bool(sc >= 0.7),
            })
            done.add(uid)
            added += 1
            print(f"ok {len(pool):3d} {sc:.2f} {name[:36]}", flush=True)
            json.dump(pool, open(POOL,"w"))
        except Exception as e:
            print(f"skip {name[:30]}: {e}", flush=True)
        time.sleep(0.8)

print("pool size:", len(pool), "· added this run:", added)
