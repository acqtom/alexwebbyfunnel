// Sends funnel data to the Google Sheet via the Apps Script web app
// (see google-apps-script/Code.gs for the receiving side).

// Paste your Apps Script web app URL here (ends in /exec)
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxUxw_oSkaujSauoGZqER1mzvTdBSR1ouNEdLENWfoA48hXbATD6hRa5bnoNWbFGdGF/exec";

const LEAD_KEY = "funnel_lead";

// The person's sign-up details, kept so the survey can be matched to them
function saveLead(lead) {
  try { localStorage.setItem(LEAD_KEY, JSON.stringify(lead)); } catch (e) {}
}
function loadLead() {
  try { return JSON.parse(localStorage.getItem(LEAD_KEY)) || {}; } catch (e) { return {}; }
}

// UTM tags from the current page link, e.g. utm_source=instagram
function utmParams() {
  const out = {};
  new URLSearchParams(location.search).forEach((v, k) => { if (k.startsWith("utm_")) out[k] = v; });
  return out;
}

// sheet: "Registrations" or "Survey". Fire-and-forget; keepalive lets it finish
// even if the page navigates away straight after.
function sendToSheet(sheet, data) {
  if (!SHEET_URL) {
    console.warn("SHEET_URL not set in assets/sheet.js; not sent:", sheet, data);
    return Promise.resolve();
  }
  return fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    // text/plain avoids a CORS preflight, which Apps Script can't answer
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ sheet, data }),
  }).catch(err => console.warn("Sheet send failed", err));
}
