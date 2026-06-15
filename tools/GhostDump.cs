using GBX.NET;
using GBX.NET.Engines.Game;
using GBX.NET.LZO;
using System.Text.Json;

Gbx.LZO = new Lzo();
Gbx.ZLib = new GBX.NET.ZLib.ZLib();
var node = Gbx.ParseNode(args[0]);
var ghost = node switch {
    CGameCtnGhost g => g,
    CGameCtnReplayRecord r => r.GetGhosts().FirstOrDefault(),
    _ => (CGameCtnGhost?)null
};
if (ghost?.RecordData is null) { Console.Error.WriteLine("no record data"); return; }

var pts = new List<object>();
foreach (var elem in ghost.RecordData.EntList)
{
    foreach (var s in elem.Samples)
    {
        var prop = s.GetType().GetProperty("Position");
        if (prop is null) continue;
        var v = prop.GetValue(s);
        if (v is GBX.NET.Vec3 p) pts.Add(new { x = p.X, y = p.Y, z = p.Z });
    }
}
Console.WriteLine(JsonSerializer.Serialize(new { time = ghost.RaceTime?.TotalMilliseconds, count = pts.Count, pts }));
