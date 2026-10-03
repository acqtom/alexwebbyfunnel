// Shared behaviour for the post-registration funnel pages. Load after event.js.

// Link to a sibling funnel page, e.g. funnelUrl("survey").
// Opened as a local file there's no server to resolve a folder's index.html.
function funnelUrl(page, params) {
  const base = `../${page}/${location.protocol === "file:" ? "index.html" : ""}`;
  const query = params ? `?${new URLSearchParams(params)}` : "";
  return base + query;
}

// First name passed along from the registration form (?name=)
function firstName() {
  const name = (new URLSearchParams(location.search).get("name") || "").trim().slice(0, 30);
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
}

function setProgress(pct) {
  const fill = document.getElementById("progress-fill");
  if (!fill) return;
  fill.textContent = `${pct}%`;
  fill.closest(".progress").setAttribute("aria-valuenow", pct);
  requestAnimationFrame(() => { fill.style.width = `${pct}%`; });
}

// ---- Stars ----
(function () {
  const stars = document.getElementById("stars");
  if (!stars) return;
  for (let i = 0; i < 60; i++) {
    const s = document.createElement("span");
    const size = Math.random() < 0.85 ? 2 : 4;
    s.className = "star";
    s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 70}%;opacity:${0.25 + Math.random() * 0.6};${size === 4 ? "border-radius:0;" : ""}`;
    stars.appendChild(s);
  }
})();

// ---- Countdown boxes to the next event (#cd-d, #cd-h, #cd-m, #cd-s) ----
(function () {
  const els = ["d", "h", "m", "s"].map(k => document.getElementById(`cd-${k}`));
  if (els.some(el => !el)) return;
  const label = document.getElementById("event-time");
  const pad = n => String(n).padStart(2, "0");
  function tick() {
    const event = nextEvent();
    const diff = Math.max(0, event - Date.now());
    const parts = [
      Math.floor(diff / 86400000),
      Math.floor((diff % 86400000) / 3600000),
      Math.floor((diff % 3600000) / 60000),
      Math.floor((diff % 60000) / 1000),
    ];
    els.forEach((el, i) => { el.textContent = pad(parts[i]); });
    if (label) label.textContent = eventLabel(event);
  }
  tick();
  setInterval(tick, 1000);
})();
