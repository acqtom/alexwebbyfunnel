// Vercel serverless function: POST /api/register
// Registers a sign-up from /masterclassreg into the WebinarJam webinar.
// The API key stays on the server (Vercel → Settings → Environment Variables).

const API = "https://api.webinarjam.com/webinarjam";
const API_KEY = process.env.WEBINARJAM_API_KEY;
const WEBINAR_ID = "2";
const TZ = "America/New_York";
const EVENT_WEEKDAY = 3; // Wednesday, 7 PM ET — matches assets/event.js

async function callWebinarJam(endpoint, params) {
  const res = await fetch(`${API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ api_key: API_KEY, ...params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== "success") {
    throw new Error(data.message || `WebinarJam ${endpoint} failed (${res.status})`);
  }
  return data;
}

// Date of the Wednesday the pages are showing, as "YYYY-MM-DD" in ET.
// Rolls over at midnight ET when Wednesday ends, same as the pages.
function nextEventDate(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(now).map(x => [x.type, +x.value]));
  const today = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const ahead = (EVENT_WEEKDAY - today.getUTCDay() + 7) % 7;
  return new Date(today.getTime() + ahead * 86400000).toISOString().slice(0, 10);
}

// The WebinarJam session on that Wednesday, falling back to the first upcoming one
async function nextScheduleId() {
  const { webinar } = await callWebinarJam("webinar", { webinar_id: WEBINAR_ID });
  const schedules = (webinar && webinar.schedules) || [];
  if (!schedules.length) throw new Error("This webinar has no upcoming sessions");
  const date = nextEventDate();
  const match = schedules.find(s => String(s.date || "").startsWith(date));
  return (match || schedules[0]).schedule;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!API_KEY) return res.status(500).json({ error: "Registration isn't set up yet (missing API key)" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim();
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Please enter your name and a valid email." });
  }

  const [firstName, ...rest] = fullName.split(/\s+/);
  const params = {
    webinar_id: WEBINAR_ID,
    first_name: firstName,
    last_name: rest.join(" "),
    email,
    ip_address: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim(),
  };
  const phone = String(body.phone || "").replace(/\D/g, "");
  if (phone) {
    params.phone = phone;
    params.phone_country_code = String(body.countryCode || "+1");
  }

  try {
    params.schedule = await nextScheduleId();
    const { user = {} } = await callWebinarJam("register", params);
    return res.status(200).json({
      ok: true,
      liveRoomUrl: user.live_room_url || null,
      thankYouUrl: user.thank_you_url || null,
    });
  } catch (err) {
    console.error("WebinarJam registration failed:", err.message);
    return res.status(502).json({ error: "We couldn't register you just now. Please try again." });
  }
};
