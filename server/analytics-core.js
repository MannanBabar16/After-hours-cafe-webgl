import { createHmac, timingSafeEqual } from "node:crypto";

export const COLLECTION_START =
  process.env.ANALYTICS_STARTED_AT || "2026-10-20T00:00:00.000Z";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const types = new Set([
  "page_view",
  "game_start",
  "cafe_open",
  "coffee_brewed",
  "cookies_baked",
  "order_served",
  "shift_completed",
  "feature_use",
  "upgrade_bought",
  "supplies_ordered",
  "heartbeat",
]);
const labels = new Set([
  "espresso",
  "americano",
  "latte",
  "cappuccino",
  "vanilla",
  "flatwhite",
  "indoor",
  "drive",
  "first_person",
  "isometric",
  "phone_supply",
  "phone_equipment",
  "phone_bank",
  "phone_café",
  "phone_cafegram",
  "robot",
  "help",
  "workstation",
  "customization",
]);
export function authorized(header, secret) {
  if (!secret || secret.length < 24 || typeof header !== "string") return false;
  const actual = Buffer.from(header),
    expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function normalizeBatch(raw, secret, now = Date.now()) {
  if (
    !raw ||
    raw.v !== 1 ||
    !uuid.test(raw.visitor) ||
    !uuid.test(raw.session) ||
    !uuid.test(raw.batch) ||
    !Array.isArray(raw.events) ||
    raw.events.length < 1 ||
    raw.events.length > 120
  )
    throw new Error("Invalid batch");
  const events = raw.events.map((e) => {
    if (
      !e ||
      !types.has(e.type) ||
      typeof e.id !== "string" ||
      !e.id.startsWith(`${raw.session}:`) ||
      !/^\d{1,8}$/.test(e.id.slice(37)) ||
      !Number.isFinite(e.at) ||
      e.at > now + 60000 ||
      e.at < now - 86400000
    )
      throw new Error("Invalid event");
    const event = { id: e.id, type: e.type, at: Math.round(e.at) };
    if (labels.has(e.label)) event.label = e.label;
    if (e.type === "cookies_baked")
      event.count = Math.min(24, Math.max(1, Math.floor(Number(e.count) || 1)));
    if (e.type === "order_served")
      event.value = Math.min(10000, Math.max(0, Number(e.value) || 0));
    if (e.type === "heartbeat")
      event.value = Math.min(
        120,
        Math.max(0, Math.floor(Number(e.value) || 0)),
      );
    return event;
  });
  const referrer =
    typeof raw.meta?.referrer === "string" &&
    /^[a-z0-9.-]{1,100}$/i.test(raw.meta.referrer)
      ? raw.meta.referrer.toLowerCase()
      : "direct";
  return {
    v: 1,
    visitor: createHmac("sha256", secret)
      .update(raw.visitor)
      .digest("hex")
      .slice(0, 32),
    session: raw.session,
    batch: raw.batch,
    test: raw.test === true,
    receivedAt: now,
    meta: {
      referrer,
      device: ["mobile", "desktop"].includes(raw.meta?.device)
        ? raw.meta.device
        : "other",
      browser: ["Chrome", "Safari", "Firefox", "Edge"].includes(
        raw.meta?.browser,
      )
        ? raw.meta.browser
        : "Other",
    },
    events,
  };
}

export function aggregate(
  batches,
  { from, to, now = Date.now(), test = false } = {},
) {
  const start = Date.parse(`${from}T00:00:00Z`),
    end = Date.parse(`${to}T23:59:59.999Z`);
  const sessions = new Map(),
    seen = new Set(),
    days = new Map();
  for (let t = start; t <= end; t += 86400000)
    days.set(new Date(t).toISOString().slice(0, 10), {
      date: new Date(t).toISOString().slice(0, 10),
      visitors: new Set(),
      players: new Set(),
      visits: 0,
      activeSeconds: 0,
      coffees: 0,
      orders: 0,
    });
  const totals = {
    visits: 0,
    players: 0,
    activeSeconds: 0,
    coffees: 0,
    cookies: 0,
    orders: 0,
    shifts: 0,
    upgrades: 0,
    supplies: 0,
    inGameRevenue: 0,
  };
  const visitors = new Set(),
    playerVisitors = new Set(),
    online = new Set(),
    features = new Map(),
    recipes = new Map();
  const funnel = {
    visit: new Set(),
    play: new Set(),
    open: new Set(),
    brew: new Set(),
    serve: new Set(),
  };
  for (const batch of batches) {
    if (batch.test !== test) continue;
    for (const e of batch.events) {
      if (e.at < start || e.at > end || seen.has(e.id)) continue;
      seen.add(e.id);
      const day = days.get(new Date(e.at).toISOString().slice(0, 10));
      let session = sessions.get(batch.session);
      if (!session) {
        session = {
          visitor: batch.visitor,
          meta: batch.meta,
          started: false,
          visit: false,
          seconds: 0,
          first: e.at,
          last: e.at,
        };
        sessions.set(batch.session, session);
      }
      session.first = Math.min(session.first, e.at);
      session.last = Math.max(session.last, e.at);
      if (e.at >= now - 130000 && e.at <= now) online.add(batch.session);
      if (e.type === "page_view") {
        totals.visits++;
        session.visit = true;
        visitors.add(batch.visitor);
        day?.visitors.add(batch.visitor);
        if (day) day.visits++;
        funnel.visit.add(batch.session);
      }
      if (e.type === "game_start") {
        session.started = true;
        playerVisitors.add(batch.visitor);
        day?.players.add(batch.visitor);
        funnel.play.add(batch.session);
      }
      if (e.type === "cafe_open") funnel.open.add(batch.session);
      if (e.type === "coffee_brewed") {
        totals.coffees++;
        if (day) day.coffees++;
        funnel.brew.add(batch.session);
        recipes.set(
          e.label ?? "other",
          (recipes.get(e.label ?? "other") ?? 0) + 1,
        );
      }
      if (e.type === "order_served") {
        totals.orders++;
        totals.inGameRevenue += e.value ?? 0;
        if (day) day.orders++;
        funnel.serve.add(batch.session);
      }
      if (e.type === "cookies_baked") totals.cookies += e.count ?? 1;
      if (e.type === "heartbeat") {
        totals.activeSeconds += e.value ?? 0;
        session.seconds += e.value ?? 0;
        if (day) day.activeSeconds += e.value ?? 0;
      }
      if (e.type === "shift_completed") totals.shifts++;
      if (e.type === "upgrade_bought") totals.upgrades++;
      if (e.type === "supplies_ordered") totals.supplies++;
      if (e.type === "feature_use") {
        const name = e.label ?? "other";
        if (!features.has(name)) features.set(name, new Set());
        features.get(name).add(batch.session);
      }
    }
  }
  const grouped = (field) => {
    const map = new Map();
    for (const s of sessions.values())
      if (s.visit) {
        const label = s.meta[field];
        map.set(label, (map.get(label) ?? 0) + 1);
      }
    return [...map]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  };
  const playing = [...sessions.values()].filter((s) => s.started);
  totals.players = playing.length;
  const durations = playing.map((s) => s.seconds).sort((a, b) => a - b);
  const returning = new Map();
  for (const s of sessions.values())
    if (s.visit) returning.set(s.visitor, (returning.get(s.visitor) ?? 0) + 1);
  return {
    collectionStart: COLLECTION_START,
    generatedAt: new Date(now).toISOString(),
    from,
    to,
    test,
    totals: {
      ...totals,
      visitors: visitors.size,
      uniquePlayers: playerVisitors.size,
      online: online.size,
      averagePlaySeconds: playing.length
        ? Math.round(
            playing.reduce((n, s) => n + s.seconds, 0) / playing.length,
          )
        : 0,
      medianPlaySeconds: durations.length
        ? Math.round(
            (durations[Math.floor((durations.length - 1) / 2)] +
              durations[Math.floor(durations.length / 2)]) /
              2,
          )
        : 0,
      returningVisitors: [...returning.values()].filter((n) => n > 1).length,
    },
    daily: [...days.values()].map((d) => ({
      ...d,
      visitors: d.visitors.size,
      players: d.players.size,
    })),
    funnel: Object.entries(funnel).map(([label, set]) => ({
      label,
      count: set.size,
    })),
    features: [...features]
      .map(([label, set]) => ({ label, count: set.size }))
      .sort((a, b) => b.count - a.count),
    recipes: [...recipes]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    devices: grouped("device"),
    browsers: grouped("browser"),
    sources: grouped("referrer"),
  };
}
