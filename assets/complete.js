// Shared by the survey result pages. Load after event.js and funnel.js.

// ---- Links: fill these in ----
const COMMUNITY_URL = "https://chat.whatsapp.com/GcUyaEb48lp8vp1GnOfkYj?mode=gi_t";
const BOOKING_URL = "#";   // e.g. your Calendly link (qualified page only)

const EVENT_TITLE = "Turn Your Free Time into a High Paying Side Hustle in 2026 with Alex Liubicevas";
const EVENT_MINUTES = 60;
const LIVE_ROOM_URL = "https://event.webinarjam.com/4o892g/go/live/n5ly3nf5i8s0s1";
const EVENT_DETAILS = `Join the live masterclass here: ${LIVE_ROOM_URL}`;

// "Wednesday, October 7th 2026 · 4:00 PM (PT) / 7:00 PM (ET)"
function eventWhen(ts) {
  const d = new Date(ts);
  const fmt = (opts, tz) => new Intl.DateTimeFormat("en-US", { timeZone: tz || EVENT_TZ, ...opts }).format(d);
  const day = +fmt({ day: "numeric" });
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const time = tz => fmt({ hour: "numeric", minute: "2-digit" }, tz);
  return `${fmt({ weekday: "long" })}, ${fmt({ month: "long" })} ${day}${suffix} ${fmt({ year: "numeric" })} · ` +
    `${time("America/Los_Angeles")} (PT) / ${time()} (ET)`;
}

// Calendar timestamps in UTC, e.g. 20261007T230000Z
const calStamp = ts => new Date(ts).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function googleCalendarUrl(start) {
  const end = start + EVENT_MINUTES * 60000;
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT_TITLE,
    dates: `${calStamp(start)}/${calStamp(end)}`,
    details: EVENT_DETAILS,
  });
  // Google expects a literal "/" between start and end
  return `https://calendar.google.com/calendar/render?${p}`.replace("%2F", "/");
}

// .ics file for Apple Calendar / Outlook
function icsUrl(start) {
  const end = start + EVENT_MINUTES * 60000;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Masterclass//EN",
    "BEGIN:VEVENT",
    `UID:${calStamp(start)}-masterclass`,
    `DTSTAMP:${calStamp(Date.now())}`,
    `DTSTART:${calStamp(start)}`,
    `DTEND:${calStamp(end)}`,
    `SUMMARY:${EVENT_TITLE}`,
    `DESCRIPTION:${EVENT_DETAILS}`,
    `LOCATION:${LIVE_ROOM_URL}`,
    `URL:${LIVE_ROOM_URL}`,
    "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", `DESCRIPTION:${EVENT_TITLE}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
}

// ---- Fill in the page ----
(function () {
  const start = nextEvent();
  document.querySelectorAll("[data-when]").forEach(el => { el.textContent = eventWhen(start); });
  document.querySelectorAll("[data-gcal]").forEach(el => { el.href = googleCalendarUrl(start); });
  document.querySelectorAll("[data-ics]").forEach(el => { el.href = icsUrl(start); });
  document.querySelectorAll("[data-community]").forEach(el => { el.href = COMMUNITY_URL; });
  document.querySelectorAll("[data-booking]").forEach(el => { el.href = BOOKING_URL; });
  setProgress(99);
})();
