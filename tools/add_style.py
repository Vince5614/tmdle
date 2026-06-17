#!/usr/bin/env python3
"""Tag each Higher or Lower pool map with its primary style (Tech, Reactor,
Fullspeed, …) for a small hint label next to the map name. Looks the map up on
trackmania.exchange by uid and reduces its tags to one style using the same
priority order the MapGuessr code uses (src/lib/mx.ts + mapguessr2.ts).

Resumable: maps that already have a "style" are skipped unless you pass --force.
No ghost downloads or dotnet — just one TMX call per map.

Usage: python tools/add_style.py [--force] [pool path]
"""
import json, sys, os, time, urllib.request, urllib.parse

UA = {"User-Agent": "tmdle/1.0 contact@chilly7383"}
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:] if a != "--force"]
FORCE = "--force" in sys.argv
POOL = args[0] if args else os.path.join(TOOLS_DIR, "..", "src", "data", "wrorlower-pool.json")

# Tag id → name, mirrored from src/lib/mx.ts
TAG_NAMES = {
    1: "Race", 2: "FullSpeed", 3: "Tech", 4: "RPG", 5: "LOL", 6: "Press Forward",
    7: "SpeedTech", 8: "MultiLap", 9: "Offroad", 10: "Trial", 11: "ZrT", 12: "SpeedFun",
    13: "Competitive", 14: "Ice", 15: "Dirt", 16: "Stunt", 17: "Reactor", 18: "Platform",
    19: "Slow Motion", 20: "Bumper", 21: "Fragile", 22: "Scenery", 23: "Kacky", 24: "Endurance",
    25: "Mini", 26: "Remake", 27: "Mixed", 28: "Nascar", 29: "SpeedDrift", 30: "Minigame",
    31: "Obstacle", 32: "Transitional", 33: "Grass", 34: "Backwards", 35: "Engine Off",
    36: "Signature", 37: "Royal", 38: "Water", 39: "Plastic", 40: "Arena", 41: "Freestyle",
    42: "Educational", 43: "Sausage", 44: "Bobsleigh", 45: "Pathfinding", 46: "FlagRush",
    47: "Puzzle", 48: "Freeblocking", 49: "Altered Nadeo", 50: "SnowCar", 51: "Wood",
    52: "Underwater", 53: "Turtle", 54: "RallyCar", 55: "MixedCar", 56: "Bugslide",
    57: "Mudslide", 58: "Moving Items", 59: "DesertCar", 60: "SpeedMapping", 61: "No Brakes",
    62: "Cruise Control", 63: "No Steering", 64: "RPG-Immersive", 65: "Pipes", 66: "Magnet",
    67: "No Grip", 68: "Precision", 69: "Clones",
}

# Priority + exclusions, mirrored from src/lib/mapguessr2.ts
STYLE_PRIORITY = [
    "FullSpeed", "Tech", "RPG", "Trial", "Reactor", "Platform",
    "Press Forward", "SpeedTech", "Endurance", "Kacky", "Mini",
    "Stunt", "LOL", "Obstacle", "Puzzle", "SpeedDrift", "Arena",
    "Nascar", "Offroad", "MultiLap", "Race",
]
NON_STYLE = {
    "SnowCar", "RallyCar", "MixedCar", "DesertCar", "Altered Nadeo", "Signature",
    "Ice", "Dirt", "Grass", "Competitive", "Scenery", "Remake", "Freestyle",
    "Educational", "Freeblocking", "FlagRush", "Royal", "Water", "Plastic",
    "Backwards", "Wood", "Underwater", "Turtle", "Bobsleigh", "Pathfinding",
    "Bumper", "Fragile", "Slow Motion", "Engine Off", "No Brakes", "Cruise Control",
    "No Steering", "Magnet", "No Grip", "Pipes", "Clones", "Moving Items",
    "Bugslide", "Mudslide", "SpeedMapping", "ZrT", "Mixed", "Minigame",
}

def primary_style(names):
    style = [t for t in names if t not in NON_STYLE]
    for s in STYLE_PRIORITY:
        if s in style:
            return s
    return style[0] if style else (names[0] if names else "Race")

def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

pool = json.load(open(POOL))
updated = 0
for m in pool:
    if not FORCE and m.get("style"):
        continue
    try:
        url = "https://trackmania.exchange/mapsearch2/search?api=on&limit=1&uid=" + urllib.parse.quote(m["uid"])
        res = (get(url).get("results") or [])
        if not res:
            raise ValueError("not on TMX")
        tags = res[0].get("Tags")
        names = [TAG_NAMES.get(int(t)) for t in tags.split(",")] if tags else []
        names = [n for n in names if n]
        m["style"] = primary_style(names)
        updated += 1
        print(f"ok  {m['style']:14s} {m['name'][:36]}", flush=True)
        json.dump(pool, open(POOL, "w"))
    except Exception as e:
        print(f"skip {m['name'][:30]}: {e}", flush=True)
    time.sleep(0.5)

print("done · styled", updated, "of", len(pool))
