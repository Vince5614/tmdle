// DST + midnight boundary test for the Brussels daily logic
const TZ = "Europe/Brussels";
const LAUNCH_KEY = "2026-05-14";
function dayKey(now){ return new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).format(now); }
function keyToUTC(k){ const [y,m,d]=k.split("-").map(Number); return Date.UTC(y,m-1,d); }
function dayNumber(now){ return Math.max(1, Math.round((keyToUTC(dayKey(now))-keyToUTC(LAUNCH_KEY))/86400000)+1); }

const cases = [
  // summer (CEST = UTC+2): Brussels midnight is 22:00 UTC previous day
  ["2026-06-11T21:59:59Z", "2026-06-11"],
  ["2026-06-11T22:00:00Z", "2026-06-12"],   // flip at exactly midnight Brussels
  ["2026-06-11T23:30:00Z", "2026-06-12"],
  // winter (CET = UTC+1): flip at 23:00 UTC
  ["2026-12-31T22:59:59Z", "2026-12-31"],
  ["2026-12-31T23:00:00Z", "2027-01-01"],
  // DST spring-forward night 2026-03-29 (02:00→03:00)
  ["2026-03-28T22:59:59Z", "2026-03-28"],
  ["2026-03-28T23:00:00Z", "2026-03-29"],
  // DST fall-back night 2026-10-25 (03:00→02:00)
  ["2026-10-24T21:59:59Z", "2026-10-24"],
  ["2026-10-24T22:00:00Z", "2026-10-25"],
];
let fail = 0;
for (const [iso, expect] of cases) {
  const got = dayKey(new Date(iso));
  const ok = got === expect;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${iso} -> ${got} (expect ${expect})`);
}
// day numbers strictly increase across a full year, one per Brussels day
let prev = 0, mono = true;
for (let t = Date.parse("2026-05-14T00:00:00Z"); t < Date.parse("2027-05-14T00:00:00Z"); t += 3600_000) {
  const n = dayNumber(new Date(t));
  if (n < prev || n > prev + 1) { mono = false; console.log("FAIL monotonic at", new Date(t).toISOString(), prev, "->", n); break; }
  prev = n;
}
console.log(mono ? "PASS monotonic day numbers over a full year (hourly steps)" : "FAIL monotonic");
process.exit(fail || !mono ? 1 : 0);
