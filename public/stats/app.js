const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat("en");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let key = "",
  data = null,
  controller,
  requestId = 0;
try {
  key = sessionStorage.getItem("ahc-owner-key") || "";
} catch {
  /* private mode */
}
const names = {
  visit: "Opened the game",
  play: "Started playing",
  open: "Opened the café",
  brew: "Made a coffee",
  serve: "Served an order",
  first_person: "First-person camera",
  isometric: "Isometric camera",
  phone_supply: "Supply shop",
  phone_equipment: "Equipment shop",
  phone_bank: "Bank / finances",
  phone_café: "Café management",
  phone_cafegram: "CaféGram",
  robot: "Serving robot",
  help: "Help & controls",
  workstation: "Coffee workstation",
  customization: "Style customization",
};
const pretty = (label) =>
  names[label] || label.charAt(0).toUpperCase() + label.slice(1);
function preset(days) {
  const to = new Date(),
    from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days + 1);
  $("from").value = from.toISOString().slice(0, 10);
  $("to").value = to.toISOString().slice(0, 10);
  document
    .querySelectorAll("[data-days]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(Number(b.dataset.days) === days)),
    );
}
preset(7);
function lock() {
  key = "";
  data = null;
  requestId++;
  controller?.abort();
  try {
    sessionStorage.removeItem("ahc-owner-key");
  } catch {
    /* optional */
  }
  $("dashboard").hidden = true;
  $("login").hidden = false;
  $("logout").hidden = true;
  for (const id of [
    "metrics",
    "chart",
    "funnel",
    "features",
    "sources",
    "devices",
    "browsers",
    "recipes",
  ])
    $(id).replaceChildren();
  $("key").value = "";
  $("key").focus();
}
async function load() {
  if (!key) return;
  const id = ++requestId;
  controller?.abort();
  const from = $("from").value,
    to = $("to").value;
  if (
    !from ||
    !to ||
    from > to ||
    (Date.parse(to) - Date.parse(from)) / 86400000 > 92
  ) {
    $("notice").textContent = "Choose a valid range of up to 93 days.";
    $("refresh").disabled = false;
    return;
  }
  $("refresh").disabled = true;
  controller = new AbortController();
  const currentKey = key;
  try {
    const response = await fetch(
      `/api/analytics/stats?${new URLSearchParams({ from, to, test: $("cohort").value === "test" ? "1" : "0" })}`,
      {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: controller.signal,
      },
    );
    if (id !== requestId) return;
    if (response.status === 401) {
      lock();
      $("login-error").textContent = "That key did not unlock this dashboard.";
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load stats.");
    if (key !== currentKey || id !== requestId) return;
    data = result;
    $("login").hidden = true;
    $("dashboard").hidden = false;
    $("logout").hidden = false;
    $("login-error").textContent = "";
    try {
      sessionStorage.setItem("ahc-owner-key", key);
    } catch {
      /* tab memory still works */
    }
    render();
  } catch (error) {
    if (error.name === "AbortError") return;
    $("live-label").textContent = "Connection interrupted";
    const message =
      error.message +
      " Last successfully loaded data stays visible; refresh to retry.";
    if ($("dashboard").hidden) $("login-error").textContent = message;
    else {
      $("notice").textContent = message;
      $("notice").className = "notice error";
    }
  } finally {
    if (id === requestId) $("refresh").disabled = false;
  }
}
function render() {
  const t = data.totals;
  const minutes = (n) =>
    n < 60 ? `${n}s` : `${Math.floor(n / 60)}m ${n % 60}s`;
  const cards = [
    ["Unique browsers", t.visitors, "Anonymous browser profiles"],
    ["Play sessions", t.players, `${t.uniquePlayers} distinct browsers played`],
    [
      "Average play time",
      minutes(t.averagePlaySeconds),
      `Median ${minutes(t.medianPlaySeconds)} · foreground time`,
    ],
    [
      "Visit → play",
      t.visits ? `${Math.round((t.players / t.visits) * 100)}%` : "—",
      `${fmt.format(t.visits)} visits / page loads`,
    ],
    ["Coffee made", t.coffees, `${fmt.format(t.cookies)} cookies baked`],
    [
      "Orders served",
      t.orders,
      `$${fmt.format(Math.round(t.inGameRevenue))} simulated café revenue`,
    ],
    [
      "Shifts completed",
      t.shifts,
      `${t.upgrades} upgrades · ${t.supplies} stock purchases`,
    ],
    [
      "Returning browsers",
      t.returningVisitors,
      "2+ visits within this date range",
    ],
  ];
  $("metrics").innerHTML = cards
    .map(
      ([title, value, note]) =>
        `<article class="metric"><span class="metric-title">${escape(title)}</span><strong class="metric-value">${escape(typeof value === "number" ? fmt.format(value) : value)}</strong><span class="metric-note">${escape(note)}</span></article>`,
    )
    .join("");
  $("live-label").textContent =
    `${t.online} seen in last 2 min${data.to < new Date().toISOString().slice(0, 10) ? " · historical range" : ""}`;
  $("notice").className = data.quality.partial ? "notice error" : "notice";
  $("notice").textContent =
    (data.test ? "TEST TRAFFIC ONLY · " : "") +
    (data.quality.note ||
      `Collecting since ${new Date(data.collectionStart).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. Earlier visits were not tracked. ${t.visits ? "" : "No visits recorded in this range yet."}`);
  chart();
  bars("funnel", data.funnel, "No player journeys yet.", true);
  bars(
    "features",
    data.features,
    "Feature discoveries will appear as people play.",
  );
  bars(
    "sources",
    data.sources,
    "Traffic sources will appear after the first visit.",
  );
  bars("devices", data.devices, "No device data yet.");
  bars("browsers", data.browsers, "");
  bars("recipes", data.recipes, "Waiting for the first coffee.");
  $("updated").textContent =
    `Updated ${new Date(data.generatedAt).toLocaleTimeString()} · UTC dates · ${data.quality.batchCount} stored batches`;
  $("insight").textContent =
    t.players < 5
      ? "Let a few more people play before drawing conclusions. A small sample can swing quickly."
      : `${Math.round((t.players / Math.max(1, t.visits)) * 100)}% of visits reached play. ${data.funnel.find((x) => x.label === "brew")?.count || 0} sessions made coffee. Watch that gap as you improve the introduction.`;
}
function bars(id, rows, empty, funnel = false) {
  const max = Math.max(1, ...rows.map((r) => r.count)),
    denominator = funnel ? Math.max(1, rows[0]?.count || 0) : max;
  $(id).innerHTML = rows.length
    ? rows
        .slice(0, 12)
        .map(
          (r) =>
            `<div class="bar-row ${funnel ? "funnel-row" : ""}"><div class="bar-label"><span>${escape(pretty(r.label))}</span><strong>${fmt.format(r.count)}${funnel ? ` <span class="muted">· ${Math.round((r.count / denominator) * 100)}%</span>` : ""}</strong></div><div class="track"><div class="fill" style="width:${Math.min(100, (r.count / max) * 100)}%"></div></div></div>`,
        )
        .join("")
    : `<p class="empty">${escape(empty)}</p>`;
}
function chart() {
  if (!data) return;
  const metric = $("metric").value,
    rows = data.daily,
    max = Math.max(1, ...rows.map((d) => d[metric]));
  $("chart").innerHTML =
    `<div class="chart-tip" id="chart-tip">${rows.every((d) => !d[metric]) ? "No activity for this metric yet." : ""}</div><div class="plot">${rows.map((d) => `<button class="plot-day" aria-label="${d.date}: ${metric === "activeSeconds" ? (d[metric] / 60).toFixed(1) : d[metric]} ${escape($("metric").selectedOptions[0].text)}" data-date="${d.date}"><span class="plot-bar" style="height:${Math.max(1, (d[metric] / max) * 100)}%"></span></button>`).join("")}</div><div class="chart-labels"><span class="plot-label">${rows[0]?.date || ""}</span><span class="plot-label">${rows[Math.floor(rows.length / 2)]?.date || ""}</span><span class="plot-label">${rows.at(-1)?.date || ""}</span></div>`;
  for (const button of $("chart").querySelectorAll("button"))
    for (const event of ["pointerenter", "focus", "click"])
      button.addEventListener(event, () => {
        $("chart-tip").textContent = button.getAttribute("aria-label");
      });
}
$("unlock").addEventListener("submit", (event) => {
  event.preventDefault();
  key = $("key").value.trim();
  void load();
});
$("logout").addEventListener("click", lock);
$("refresh").addEventListener("click", () => void load());
$("metric").addEventListener("change", chart);
$("cohort").addEventListener("change", () => void load());
document.querySelectorAll("[data-days]").forEach((b) =>
  b.addEventListener("click", () => {
    preset(Number(b.dataset.days));
    void load();
  }),
);
for (const id of ["from", "to"])
  $(id).addEventListener("change", () => {
    document
      .querySelectorAll("[data-days]")
      .forEach((b) => b.setAttribute("aria-pressed", "false"));
    void load();
  });
$("export").addEventListener("click", () => {
  if (!data) return;
  const quote = (s) => `"${String(s).replaceAll('"', '""')}"`;
  const lines = [
    [
      "date_utc",
      "unique_browsers",
      "players",
      "visits",
      "active_seconds",
      "coffees",
      "orders",
    ],
    ...data.daily.map((d) => [
      d.date,
      d.visitors,
      d.players,
      d.visits,
      d.activeSeconds,
      d.coffees,
      d.orders,
    ]),
    [],
    ["summary_metric", "value"],
    ...Object.entries(data.totals),
    [],
    ["collection_started", data.collectionStart],
    ["traffic", data.test ? "test" : "live"],
    ["partial", data.quality.partial],
  ];
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + lines.map((r) => r.map(quote).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `cafe-stats-${data.test ? "test" : "live"}-${data.from}-${data.to}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
setInterval(() => {
  if (!document.hidden && key && !$("dashboard").hidden) void load();
}, 60000);
if (key) void load();
