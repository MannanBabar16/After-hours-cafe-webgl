import type { GameState } from "../store/game";

export interface GameEvent {
  type: string;
  label?: string;
  count?: number;
  value?: number;
}
export function isPlaying(s: GameState) {
  return (
    (s.phase === "playing" || s.phase === "closing") &&
    !s.paused &&
    !s.help &&
    !s.settingsOpen
  );
}

// Observe completed transitions. Never call an action or write to the game store.
export function gameplayEvents(s: GameState, p: GameState): GameEvent[] {
  if (s.phase === "title") return [];
  const events: GameEvent[] = [];
  if (
    (s.phase === "playing" || s.phase === "closing") &&
    (p.phase === "title" || p.phase === "summary")
  ) {
    return [{ type: "game_start" }]; // Hydrated progress is a baseline, not new activity.
  }
  if (p.phase === "title") return [];
  if (
    s.shift !== p.shift ||
    s.business.lifetimeServed < p.business.lifetimeServed
  )
    return [];
  if (s.ops.open && !p.ops.open) events.push({ type: "cafe_open" });
  if (s.ops.machine.stage === "ready" && p.ops.machine.stage === "brewing")
    events.push({ type: "coffee_brewed", label: s.ops.machine.recipe });
  if (s.ops.oven.stage === "ready" && p.ops.oven.stage === "baking")
    events.push({ type: "cookies_baked", count: s.ops.oven.quantity });
  if (s.served > p.served) {
    for (const id of s.ops.paidOrderIds.filter(
      (id) => !p.ops.paidOrderIds.includes(id),
    )) {
      const order = s.ops.orders.find((o) => o.id === id);
      events.push({
        type: "order_served",
        label: order?.channel ?? "indoor",
        value: order?.payment ?? 0,
      });
    }
  }
  if (s.phase === "summary" && p.phase !== "summary")
    events.push({ type: "shift_completed" });
  if (s.cameraMode !== p.cameraMode)
    events.push({
      type: "feature_use",
      label: s.cameraMode === "first" ? "first_person" : "isometric",
    });
  if (s.phone && (!p.phone || s.phoneApp !== p.phoneApp))
    events.push({
      type: "feature_use",
      label: `phone_${s.phoneApp.toLowerCase()}`,
    });
  if (s.ops.robot.stage === "outbound" && p.ops.robot.stage !== "outbound")
    events.push({ type: "feature_use", label: "robot" });
  if (s.help && !p.help) events.push({ type: "feature_use", label: "help" });
  if (s.workstation && !p.workstation)
    events.push({ type: "feature_use", label: "workstation" });
  if (
    s.business.theme !== p.business.theme ||
    s.business.apron !== p.business.apron ||
    s.business.cup !== p.business.cup
  )
    events.push({ type: "feature_use", label: "customization" });
  if (s.ops.transactions !== p.ops.transactions) {
    const previous = new Set(p.ops.transactions.map((t) => t.id));
    for (const t of s.ops.transactions)
      if (
        !previous.has(t.id) &&
        (t.kind === "upgrade" || t.kind === "supplies")
      )
        events.push({
          type: t.kind === "upgrade" ? "upgrade_bought" : "supplies_ordered",
        });
  }
  return events;
}
