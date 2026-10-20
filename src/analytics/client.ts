import { useGame } from "../store/game";
import { gameplayEvents, isPlaying } from "./model";
import type { GameEvent } from "./model";

// Optional, first-party telemetry. This module owns no game state or saves.
export function startAnalytics() {
  const query = new URLSearchParams(location.search);
  const test = query.get("analytics") === "test";
  if (
    query.get("analytics") === "off" ||
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl ||
    localStorageSafe("get", "ahc-analytics-optout") === "1" ||
    (location.hostname !== "after-hours-cafe-webgl.vercel.app" && !test)
  )
    return;
  const uuid = () => crypto.randomUUID();
  const session = uuid();
  let visitor = localStorageSafe("get", "ahc-analytics-visitor");
  if (!visitor || !/^[a-f0-9-]{36}$/.test(visitor)) {
    visitor = uuid();
    localStorageSafe("set", "ahc-analytics-visitor", visitor);
  }
  let seq = 0,
    activeMs = 0,
    last = performance.now(),
    lastActive = 0,
    sending = false,
    stopped = false;
  let state = useGame.getState();
  let visible = !document.hidden;
  const once = new Set<string>();
  const queue: Array<GameEvent & { id: string; at: number }> = [];
  const record = (e: GameEvent) => {
    if (stopped) return;
    const key = `${e.type}:${e.label ?? ""}`;
    if ((e.type === "feature_use" || e.type === "game_start") && once.has(key))
      return;
    once.add(key);
    if (queue.length < 120)
      queue.push({ ...e, id: `${session}:${++seq}`, at: Date.now() });
  };
  const clock = () => {
    const now = performance.now();
    // Bound gaps: suspended tabs and sleeping computers do not inflate play time.
    if (visible && isPlaying(state))
      activeMs += Math.min(5000, Math.max(0, now - last));
    last = now;
  };
  const meta = (() => {
    let referrer = "direct";
    try {
      if (document.referrer) referrer = new URL(document.referrer).hostname;
    } catch {
      /* no referrer */
    }
    const ua = navigator.userAgent;
    return {
      referrer,
      device: /Mobile|Android|iPhone|iPad/.test(ua) ? "mobile" : "desktop",
      browser: /Edg\//.test(ua)
        ? "Edge"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Other",
    };
  })();
  let pending: { id: string; events: typeof queue } | null = null;
  const body = () =>
    JSON.stringify({
      v: 1,
      visitor,
      session,
      batch: pending!.id,
      test,
      meta,
      events: pending!.events,
    });
  const flush = async (leaving = false) => {
    if (sending || stopped) return;
    clock();
    const seconds = Math.floor(activeMs / 1000);
    if (seconds > lastActive || (visible && !queue.length)) {
      record({ type: "heartbeat", value: seconds - lastActive });
      lastActive = seconds;
    }
    if (!pending && queue.length)
      pending = { id: uuid(), events: queue.splice(0, 120) };
    if (!pending) return;
    const payload = body();
    if (leaving) {
      // Keep the same batch ID for retries; storage is immutable and idempotent.
      try {
        navigator.sendBeacon(
          "/api/analytics/events",
          new Blob([payload], { type: "application/json" }),
        );
      } catch {
        /* optional */
      }
      return;
    }
    sending = true;
    try {
      const response = await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
        signal: AbortSignal.timeout(7000),
      });
      if (response.ok) pending = null;
      else if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 429
      )
        pending = null;
    } catch {
      /* bounded retry next flush; gameplay never waits */
    } finally {
      sending = false;
    }
  };
  record({ type: "page_view" });
  const unsubscribe = useGame.subscribe((next, previous) => {
    try {
      // Only inspect relevant transitions; there are no renders, network calls or clock reads per frame.
      if (
        next.phase !== previous.phase ||
        next.paused !== previous.paused ||
        next.help !== previous.help ||
        next.settingsOpen !== previous.settingsOpen
      )
        clock();
      for (const event of gameplayEvents(next, previous)) record(event);
      state = next;
    } catch {
      state = next;
    }
  });
  const tick = setInterval(clock, 5000);
  const flushTimer = setInterval(() => {
    void flush();
  }, 60000);
  const first = setTimeout(() => {
    void flush();
  }, 3000);
  const visibility = () => {
    clock();
    visible = !document.hidden;
    if (!visible) void flush(true);
  };
  const pagehide = () => {
    void flush(true);
  };
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pagehide", pagehide);
  const online = () => {
    void flush();
  };
  window.addEventListener("online", online);
  return () => {
    stopped = true;
    unsubscribe();
    clearInterval(tick);
    clearInterval(flushTimer);
    clearTimeout(first);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("pagehide", pagehide);
    window.removeEventListener("online", online);
  };
}

function localStorageSafe(action: "get" | "set", key: string, value = "") {
  try {
    if (action === "set") localStorage.setItem(key, value);
    else return localStorage.getItem(key);
  } catch {
    /* blocked storage */
  }
  return null;
}
