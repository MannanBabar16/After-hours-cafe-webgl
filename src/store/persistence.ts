import type { GameState } from "./game";
import { customers, recipes, upgrades, SHIFT_SECONDS } from "../data/content";
import { freshBrew } from "../game/craft";
import { freshBusiness } from "../game/business";
export const safeStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* Play remains available when device storage is full. */
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* Restricted storage. */
    }
  },
};
export function mergeSave(saved: unknown, current: GameState): GameState {
  if (!saved || typeof saved !== "object") return current;
  const p = saved as Partial<GameState>;
  const finite = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && n >= 0;
  if (
    !(typeof p.money === "number" && Number.isFinite(p.money)) ||
    !finite(p.elapsed) ||
    !Array.isArray(p.unlocked) ||
    !Array.isArray(p.visitors)
  )
    return current;
  const merged = {
    ...current,
    ...p,
    phase: "title" as const,
    workstation: false,
    phone: false,
    settingsOpen: false,
    paused: false,
  };
  const numericKeys = [
    "reputation",
    "followers",
    "shift",
    "lifetimeEarned",
    "elapsed",
    "arrivalTimer",
    "visitorSerial",
    "revenue",
    "served",
    "perfect",
    "newRegulars",
    "followerStart",
  ] as const;
  for (const key of numericKeys)
    if (!finite(merged[key])) merged[key] = current[key];
  merged.business = {
    ...freshBusiness(),
    ...p.business,
    best: p.business?.best ?? {},
    claimed: p.business?.claimed ?? [],
    dirtySeats: p.business?.dirtySeats ?? [],
    journal: p.business?.journal ?? [],
  };
  const b = merged.business;
  const defaults = freshBusiness();
  for (const key of [
    "beans",
    "milk",
    "pastries",
    "ingredientCost",
    "supplySpend",
    "tips",
    "pastrySales",
    "rewards",
    "xp",
    "lifetimeServed",
    "cleanliness",
    "practiceCount",
  ] as const)
    if (!finite(b[key])) b[key] = defaults[key];
  b.cleanliness = Math.min(100, b.cleanliness);
  for (const key of ["owned", "pastryMenu", "overheadPaid", "guided"] as const)
    if (typeof b[key] !== "boolean") b[key] = defaults[key];
  b.name =
    typeof b.name === "string"
      ? b.name.trim().slice(0, 28) || defaults.name
      : defaults.name;
  for (const key of ["apron", "cup"] as const)
    if (typeof b[key] !== "string" || !/^#[\da-f]{6}$/i.test(b[key]))
      b[key] = defaults[key];
  if (!["sage", "rose", "midnight"].includes(b.theme)) b.theme = defaults.theme;
  if (!["friendly", "fair", "premium"].includes(b.pricing))
    b.pricing = defaults.pricing;
  b.dirtySeats = Array.isArray(b.dirtySeats)
    ? [
        ...new Set(
          b.dirtySeats.filter(
            (seat) => Number.isInteger(seat) && seat >= 0 && seat < 6,
          ),
        ),
      ]
    : [];
  b.claimed = Array.isArray(b.claimed)
    ? b.claimed.filter((id) => ["welcome", "craft", "trade"].includes(id))
    : [];
  b.journal = Array.isArray(b.journal)
    ? b.journal.filter((entry) => typeof entry === "string").slice(0, 8)
    : [];
  b.best = Object.fromEntries(
    Object.entries(b.best ?? {}).filter(
      ([id, score]) =>
        recipes.some((r) => r.id === id) && finite(score) && score <= 100,
    ),
  );
  b.lastCup = typeof b.lastCup === "string" ? b.lastCup : "";
  merged.managementOpen = false;
  merged.brew = { ...freshBrew(), ...p.brew, practice: false };
  merged.elapsed = Math.min(SHIFT_SECONDS, merged.elapsed);
  merged.shift = Math.max(1, Math.floor(merged.shift));
  merged.familiarity = Object.fromEntries(
    Object.entries(p.familiarity ?? {}).filter(
      ([id, visits]) => customers.some((c) => c.id === id) && finite(visits),
    ),
  );
  merged.drinkCounts = { ...current.drinkCounts, ...p.drinkCounts };
  for (const recipe of recipes)
    if (!finite(merged.drinkCounts[recipe.id]))
      merged.drinkCounts[recipe.id] = 0;
  merged.eventsDone = Array.isArray(p.eventsDone)
    ? p.eventsDone.filter((i) => Number.isInteger(i) && i >= 0 && i <= 2)
    : [];
  merged.unlocked = p.unlocked.filter((id) => recipes.some((r) => r.id === id));
  if (!merged.unlocked.length) merged.unlocked = ["espresso"];
  merged.purchased = Array.isArray(p.purchased)
    ? p.purchased.filter((id) => upgrades.some((u) => u.id === id))
    : [];
  merged.visitors = p.visitors.filter(
    (v) =>
      v &&
      customers.some((c) => c.id === v.id) &&
      Number.isInteger(v.seat) &&
      v.seat >= 0 &&
      v.seat < 6 &&
      finite(v.age) &&
      finite(v.uid) &&
      [
        "entering",
        "queueing",
        "ordering",
        "waiting",
        "receiving",
        "findingSeat",
        "sitting",
        "activity",
        "leaving",
      ].includes(v.phase) &&
      recipes.some((r) => r.id === v.recipe),
  );
  merged.settings = { ...current.settings, ...p.settings };
  for (const key of ["master", "music", "sfx", "smoothing"] as const)
    merged.settings[key] = finite(merged.settings[key])
      ? Math.min(1, merged.settings[key])
      : current.settings[key];
  if (merged.settings.graphics !== "high" && merged.settings.graphics !== "low")
    merged.settings.graphics = "high";
  merged.posts = Array.isArray(p.posts)
    ? p.posts
        .filter((post) => post && customers.some((c) => c.id === post.customer))
        .slice(0, 24)
    : [];
  if (
    !p.brew ||
    !recipes.some((r) => r.id === p.brew?.recipe) ||
    ![
      "empty",
      "grinding",
      "dosed",
      "distributed",
      "tamping",
      "locked",
      "purge",
      "pour",
      "water",
      "cleaning",
      "placed",
      "extracting",
      "milk",
      "steaming",
      "foam",
      "ready",
    ].includes(p.brew.stage) ||
    !finite(p.brew.progress) ||
    !finite(p.brew.milk)
  )
    merged.brew = freshBrew();
  else if (p.brew.stage === "steaming")
    merged.brew = {
      ...freshBrew(),
      ...p.brew,
      stage: "milk",
      milk: 0,
      practice: false,
    };
  if (p.tray && !recipes.some((r) => r.id === p.tray?.recipe))
    merged.tray = null;
  return merged;
}
