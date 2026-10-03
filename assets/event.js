// Shared by every funnel page: the weekly event schedule.
// Event runs every Wednesday at 7:00 PM US Eastern time. It rolls over to the
// following Wednesday at midnight ET when Wednesday ends.
const EVENT_TZ = "America/New_York";
const EVENT_WEEKDAY = 3; // 0 = Sun … 3 = Wed
const EVENT_HOUR = 19;   // 7 PM

// ---- Weekly event date ----
// Wall-clock parts of a timestamp in the event time zone
function zonedParts(ts) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: EVENT_TZ, hourCycle: "h23",
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
    }).formatToParts(ts).map(x => [x.type, +x.value])
  );
  return p;
}
// Timestamp of a wall-clock time in the event time zone (handles EST/EDT)
function zonedToUtc(y, mo, d, h) {
  let ts = Date.UTC(y, mo - 1, d, h);
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(ts);
    const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ts;
    ts = Date.UTC(y, mo - 1, d, h) - offset;
  }
  return ts;
}
function nextEvent(now = Date.now()) {
  const p = zonedParts(now);
  const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const daysAhead = (EVENT_WEEKDAY - dow + 7) % 7; // 0 all day Wednesday
  const day = new Date(Date.UTC(p.year, p.month - 1, p.day + daysAhead));
  return zonedToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), EVENT_HOUR);
}


// Label like "Wednesday, October 7 · 7:00 PM ET"
function eventLabel(ts) {
  return new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TZ, weekday: "long", month: "long", day: "numeric" }).format(ts) +
    " · 7:00 PM ET";
}
