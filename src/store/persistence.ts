import type { GameState } from "./game";
import { customers, upgrades } from "../data/content";
import type { RecipeId } from "../data/content";
import {
  products,
  equipment,
  equipmentIds,
  supplyIds,
  caps,
} from "../data/operations";
import type { ProductId, EquipmentId, SupplyId } from "../data/operations";
import { freshOperations, emptyMachine, emptyOven } from "./operationTypes";
import type { Carry, ProductItem, Operations, Order } from "./operationTypes";

let pending: { key: string; value: string } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastWrite = 0;
function flush() {
  if (!pending) return;
  try {
    if (typeof localStorage !== "undefined")
      localStorage.setItem(pending.key, pending.value);
  } catch {
    /* Storage restrictions do not stop play. */
  }
  pending = null;
  lastWrite = Date.now();
  if (timer) clearTimeout(timer);
  timer = null;
}
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flush();
  });
}
export const safeStorage = {
  getItem: (key: string) => {
    if (pending?.key === key) return pending.value;
    try {
      return typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    pending = { key, value };
    if (Date.now() - lastWrite > 900) flush();
    else if (!timer) timer = setTimeout(flush, 900);
  },
  removeItem: (key: string) => {
    if (pending?.key === key) pending = null;
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    } catch {
      /* Restricted storage. */
    }
  },
};
const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const n = (value: unknown, fallback = 0, max = 1e6, min = 0) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
const whole = (value: unknown, fallback = 0, max = 1e6) =>
  Math.floor(n(value, fallback, max));
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const str = (v: unknown, fallback = "", max = 100) =>
  typeof v === "string" ? v.slice(0, max) : fallback;
const isProduct = (v: unknown): v is ProductId =>
  typeof v === "string" && v in products;
const item = (v: unknown): ProductItem | null => {
  const p = record(v);
  return isProduct(p.product) && typeof p.id === "number"
    ? { id: whole(p.id), product: p.product, quality: n(p.quality, 1, 1) }
    : null;
};
function carryValue(v: unknown, o: Operations): Carry | null {
  const c = record(v);
  if (c.kind === "box" && o.boxes.some((b) => b.id === c.boxId))
    return { kind: "box", boxId: Number(c.boxId) };
  if (c.kind === "cup") return { kind: "cup" };
  if (c.kind === "trash")
    return { kind: "trash", label: str(c.label, "Empty packaging") };
  if (c.kind === "product") {
    const i = item(c.item);
    return i ? { kind: "product", item: i } : null;
  }
  if (c.kind === "tray")
    return {
      kind: "tray",
      items: arr(c.items)
        .map(item)
        .filter((i): i is ProductItem => !!i)
        .slice(0, caps(o.levels, "tray")),
    };
  if (c.kind === "bakingTray")
    return {
      kind: "bakingTray",
      quantity: whole(c.quantity, 0, 8),
      baked: c.baked === true,
      quality: n(c.quality, 1, 1),
    };
  return null;
}
export function mergeBusinessSave(
  saved: unknown,
  current: GameState,
): GameState {
  const p = record(saved);
  if (typeof p.money !== "number" || !Number.isFinite(p.money)) return current;
  const s: GameState = {
    ...current,
    money: n(p.money, current.money, 1e6, -100),
    phase: "title",
    hasSave:
      p.inProgress === true ||
      n(p.elapsed) > 0 ||
      n(p.served) > 0 ||
      n(p.shift, 1) > 1 ||
      n(record(p.ops).overhead) > 0,
    phone: false,
    workstation: false,
    paused: false,
    settingsOpen: false,
    help: false,
    managementOpen: false,
    debugOpen: false,
  };
  for (const key of [
    "reputation",
    "followers",
    "lifetimeEarned",
    "elapsed",
    "revenue",
    "served",
    "newRegulars",
    "followerStart",
  ] as const)
    s[key] = n(
      p[key],
      current[key],
      key === "elapsed" ? 720 : key === "reputation" ? 100 : 1e6,
    );
  s.shift = Math.max(1, whole(p.shift, 1, 999));
  const b = record(p.business);
  s.business = {
    ...current.business,
    name: str(b.name, current.business.name, 28) || current.business.name,
    owned: b.owned === true,
    xp: n(b.xp),
    lifetimeServed: whole(b.lifetimeServed),
  };
  for (const key of ["apron", "cup"] as const)
    if (typeof b[key] === "string" && /^#[0-9a-f]{6}$/i.test(b[key]))
      s.business[key] = b[key];
  if (["sage", "rose", "midnight"].includes(String(b.theme)))
    s.business.theme = b.theme as GameState["business"]["theme"];
  if (["fair", "friendly", "premium"].includes(String(b.pricing)))
    s.business.pricing = b.pricing as GameState["business"]["pricing"];
  s.unlocked = [
    ...new Set([
      ...current.unlocked,
      ...arr(p.unlocked).filter(
        (id): id is RecipeId => isProduct(id) && id !== "cookie",
      ),
    ]),
  ];
  s.purchased = arr(p.purchased).filter(
    (id): id is string =>
      typeof id === "string" && upgrades.some((u) => u.id === id),
  );
  s.familiarity = Object.fromEntries(
    Object.entries(record(p.familiarity))
      .filter(([id]) => customers.some((c) => c.id === id))
      .map(([id, visits]) => [id, whole(visits, 0, 999)]),
  );
  s.posts = arr(p.posts)
    .filter((post) => customers.some((c) => c.id === record(post).customer))
    .slice(0, 24)
    .map((post) => {
      const d = record(post);
      return {
        id: whole(d.id),
        customer: String(d.customer),
        text: str(d.text, "", 350),
        likes: whole(d.likes, 0, 99999),
        theme: "coffee" as const,
        time: str(d.time, "Earlier"),
      };
    });
  const settings = record(p.settings);
  s.settings = { ...current.settings };
  for (const key of ["master", "music", "sfx", "smoothing"] as const)
    s.settings[key] = n(settings[key], current.settings[key], 1);
  if (settings.graphics === "low" || settings.graphics === "high")
    s.settings.graphics = settings.graphics;
  s.cameraMode = p.cameraMode === "first" ? "first" : "isometric";
  const pos = record(p.player);
  s.player = {
    x: n(pos.x, -0.6, 5.6, -8.5),
    z: n(pos.z, -1.2, 6.5, -2.1),
    angle: n(pos.angle, Math.PI, Math.PI * 100, -Math.PI * 100),
  };
  s.inProgress = p.inProgress === true;
  s.eventsDone = arr(p.eventsDone).filter(
    (v): v is number => v === 0 || v === 1,
  );
  s.event = p.event === "rain" || p.event === "viral" ? p.event : "none";
  const raw = record(p.ops);
  const o = freshOperations();
  if (!Object.keys(raw).length) {
    // Older saves already used bean and milk portions. Transfer those once,
    // distribute between containers and boxes, and preserve cash / café identity.
    o.boxes = [];
    const old = {
      beans: Math.floor(n(b.beans, 12)),
      milk: Math.floor(n(b.milk, 8)),
      cups: 10,
      dough: 0,
      syrup: 0,
    };
    for (const id of supplyIds) {
      const capacity =
        id === "beans"
          ? 10
          : id === "milk"
            ? 8
            : id === "cups"
              ? 10
              : id === "dough"
                ? 24
                : 10;
      o.containers[id] = Math.min(old[id], capacity);
      const extra = old[id] - o.containers[id];
      if (extra)
        o.boxes.push({
          id: ++o.serial,
          supply: id,
          quantity: extra,
          x: -8.15,
          z: -0.75 + o.boxes.length * 0.9,
          location: "storage",
          slot: o.boxes.length,
        });
    }
    o.display = {
      quantity: Math.min(12, whole(b.pastries, 0, 100)),
      quality: 1,
    };
    s.ops = o;
    s.carry = null;
    s.visitors = [];
    return s;
  }
  const levels = record(raw.levels);
  for (const id of equipmentIds)
    o.levels[id] = whole(levels[id], 0, equipment[id].values.length - 1);
  const containers = record(raw.containers);
  for (const id of supplyIds) {
    const equipmentId: EquipmentId | null =
      id === "beans"
        ? "hopper"
        : id === "milk"
          ? "milkTank"
          : id === "cups"
            ? "cupDispenser"
            : null;
    o.containers[id] = whole(
      containers[id],
      0,
      equipmentId ? caps(o.levels, equipmentId) : id === "dough" ? 24 : 10,
    );
  }
  const seenBoxes = new Set<number>();
  o.boxes = arr(raw.boxes)
    .filter((box) => {
      const d = record(box);
      if (
        !supplyIds.includes(d.supply as SupplyId) ||
        typeof d.id !== "number" ||
        seenBoxes.has(d.id)
      )
        return false;
      seenBoxes.add(d.id);
      return true;
    })
    .slice(0, 40)
    .map((box) => {
      const d = record(box);
      return {
        id: whole(d.id),
        supply: d.supply as SupplyId,
        quantity: whole(d.quantity, 0, 10000),
        x: n(d.x, -8.15, 5.7, -8.6),
        z: n(d.z, 0, 8, -2.5),
        location: ["delivery", "floor", "storage", "carried"].includes(
          String(d.location),
        )
          ? (d.location as "storage")
          : "floor",
        slot: Math.floor(n(d.slot, -1, 22, -1)),
      };
    });
  const m = record(raw.machine);
  const recipe =
    isProduct(m.recipe) && m.recipe !== "cookie" ? m.recipe : "espresso";
  o.machine = {
    ...emptyMachine(),
    recipe,
    stage: ["empty", "cup", "brewing", "ready"].includes(String(m.stage))
      ? (m.stage as "empty")
      : "empty",
    elapsed: n(m.elapsed, 0, 60),
    duration: n(m.duration, 4, 20, 0.5),
    item: item(m.item),
  };
  if (o.machine.stage === "ready" && !o.machine.item)
    o.machine = emptyMachine();
  const oven = record(raw.oven);
  o.oven = {
    ...emptyOven(),
    stage: ["empty", "loaded", "baking", "ready"].includes(String(oven.stage))
      ? (oven.stage as "empty")
      : "empty",
    quantity: whole(oven.quantity, 0, 8),
    elapsed: n(oven.elapsed, 0, 10000),
    duration: n(oven.duration, 20, 40, 1),
    quality: n(oven.quality, 1, 1),
    doorOpen: oven.doorOpen === true,
  };
  const display = record(raw.display);
  o.display = {
    quantity: whole(display.quantity, 0, caps(o.levels, "display")),
    quality: n(display.quality, 1, 1),
  };
  o.handoff = arr(raw.handoff)
    .map(item)
    .filter((v): v is ProductItem => !!v)
    .slice(0, 6);
  o.orders = arr(raw.orders)
    .slice(0, 12)
    .filter((order) =>
      ["indoor", "drive"].includes(String(record(order).channel)),
    )
    .map((order) => {
      const d = record(order);
      return {
        id: whole(d.id),
        channel: d.channel as Order["channel"],
        customer: str(d.customer, "minho"),
        visitorUid: whole(d.visitorUid),
        accepted: d.accepted === true,
        paid: d.paid === true,
        age: n(d.age, 0, 2000),
        payment: n(d.payment),
        reaction: str(d.reaction, "", 150),
        vehicle: ["compact", "sedan", "suv", "van"].includes(String(d.vehicle))
          ? (d.vehicle as "compact")
          : "compact",
        color: /^#[0-9a-f]{6}$/i.test(String(d.color))
          ? String(d.color)
          : "#8ea89c",
        vehiclePhase: ["arriving", "waiting", "leaving"].includes(
          String(d.vehiclePhase),
        )
          ? (d.vehiclePhase as "waiting")
          : "waiting",
        vehicleAge: n(d.vehicleAge, 0, 20),
        vehicleZ: n(d.vehicleZ, 12, 20, -20),
        lines: arr(d.lines)
          .filter((l) => isProduct(record(l).product))
          .slice(0, 5)
          .map((line) => {
            const l = record(line);
            const quantity = Math.max(1, whole(l.quantity, 1, 5));
            return {
              product: l.product as ProductId,
              quantity,
              delivered: whole(l.delivered, 0, quantity),
              discount: n(l.discount, 0, 60),
              price: n(l.price, products[l.product as ProductId].price, 12, 1),
            };
          }),
      };
    })
    .filter(
      (order) =>
        order.lines.length &&
        (order.channel === "drive" ||
          customers.some((c) => c.id === order.customer)),
    );
  o.shipments = arr(raw.shipments)
    .slice(0, 3)
    .map((sh) => {
      const d = record(sh);
      return {
        id: whole(d.id),
        stage: ["ordered", "arriving", "unloading", "leaving"].includes(
          String(d.stage),
        )
          ? (d.stage as "ordered")
          : "ordered",
        age: n(d.age, 0, 1000),
        items: arr(d.items)
          .filter((i) => supplyIds.includes(record(i).supply as SupplyId))
          .map((i) => ({
            supply: record(i).supply as SupplyId,
            packs: whole(record(i).packs, 1, 5),
          }))
          .filter((i) => i.packs > 0),
      };
    });
  const truck = record(raw.truck);
  o.truck = {
    stage: ["gone", "arriving", "parked", "leaving"].includes(
      String(truck.stage),
    )
      ? (truck.stage as "gone")
      : "gone",
    elapsed: n(truck.elapsed, 0, 20),
  };
  const r = record(raw.robot);
  o.robot = {
    stage: ["idle", "outbound", "returning"].includes(String(r.stage))
      ? (r.stage as "idle")
      : "idle",
    orderId: typeof r.orderId === "number" ? whole(r.orderId) : null,
    elapsed: n(r.elapsed, 0, 50),
    items: arr(r.items)
      .map(item)
      .filter((v): v is ProductItem => !!v)
      .slice(0, caps(o.levels, "robot")),
    route: arr(r.route)
      .filter((point) => Array.isArray(point) && point.length === 2)
      .map((point) => [n(point[0], 0, 5.5, -5.5), n(point[1], 0, 4.5, -2)]),
  };
  if (
    !o.orders.some((order) => order.id === o.robot.orderId) &&
    o.robot.stage === "outbound"
  ) {
    o.handoff = [...o.handoff, ...o.robot.items].slice(0, 6);
    o.robot = {
      stage: "idle",
      elapsed: 0,
      orderId: null,
      items: [],
      route: [],
    };
  }
  o.grounds = whole(raw.grounds, 0, 8);
  o.open = raw.open === true;
  o.closing = raw.closing === true;
  o.onboarding = whole(raw.onboarding, 0, 10);
  o.indoorTimer = n(raw.indoorTimer, 5, 90);
  o.driveTimer = n(raw.driveTimer, 30, 120);
  o.cleaningTimer = n(raw.cleaningTimer, 0, 15);
  for (const key of [
    "supplySpend",
    "upgradeSpend",
    "ingredientCost",
    "overhead",
    "tips",
  ] as const)
    o[key] = n(raw[key]);
  o.paidOrderIds = arr(raw.paidOrderIds)
    .filter((v): v is number => Number.isInteger(v))
    .slice(-80);
  o.menuPrices = Object.fromEntries(
    Object.entries(record(raw.menuPrices)).filter(
      ([id, v]) => isProduct(id) && typeof v === "number" && v >= 1 && v <= 12,
    ),
  );
  o.transactions = arr(raw.transactions)
    .slice(0, 60)
    .map((t) => {
      const d = record(t);
      return {
        id: whole(d.id),
        kind: ["sale", "supplies", "upgrade", "operating", "reward"].includes(
          String(d.kind),
        )
          ? (d.kind as "sale")
          : "sale",
        label: str(d.label, "Transaction", 100),
        amount: n(d.amount, 0, 1e6, -1e6),
        time: str(d.time, "Earlier", 12),
      };
    });
  o.spills = arr(raw.spills)
    .slice(0, 4)
    .map((spill) => {
      const d = record(spill);
      return {
        id: whole(d.id),
        x: n(d.x, 2, 5.5, -5.5),
        z: n(d.z, 1, 4, -2),
        age: n(d.age),
      };
    });
  o.loose = arr(raw.loose)
    .slice(0, 30)
    .map((loose) => {
      const d = record(loose);
      return {
        id: whole(d.id),
        carry: carryValue(d.carry, o),
        x: n(d.x, 0, 5.8, -8.5),
        z: n(d.z, 1, 6.5, -2),
      };
    })
    .filter(
      (v): v is Operations["loose"][number] =>
        !!v.carry && v.carry.kind !== "box",
    );
  o.serial =
    Math.max(
      whole(raw.serial, 100),
      ...o.boxes.map((b) => b.id),
      ...o.orders.map((o) => o.id),
      ...o.loose.map((o) => o.id),
      ...o.shipments.map((sh) => sh.id),
      ...o.handoff.map((i) => i.id),
    ) + 1;
  s.ops = o;
  s.carry = carryValue(p.carry, o);
  const carriedId = s.carry?.kind === "box" ? s.carry.boxId : null;
  o.boxes = o.boxes.map((box) =>
    box.id === carriedId
      ? { ...box, location: "carried" }
      : box.location === "carried"
        ? { ...box, location: "floor", x: s.player.x, z: s.player.z }
        : box,
  );
  s.visitors = arr(p.visitors)
    .slice(0, 6)
    .filter(
      (v) =>
        customers.some((c) => c.id === record(v).id) &&
        o.orders.some((order) => order.visitorUid === record(v).uid),
    )
    .map((v) => {
      const d = record(v);
      return {
        uid: whole(d.uid),
        id: String(d.id),
        seat: whole(d.seat, 0, 5),
        recipe:
          isProduct(d.recipe) && d.recipe !== "cookie" ? d.recipe : "espresso",
        phase: [
          "entering",
          "ordering",
          "waiting",
          "receiving",
          "findingSeat",
          "activity",
          "leaving",
        ].includes(String(d.phase))
          ? (d.phase as "waiting")
          : "waiting",
        age: n(d.age, 0, 200),
        accepted: d.accepted === true,
        paid: d.paid === true,
        posted: d.posted === true,
        pastry: d.pastry === true,
        payment: n(d.payment),
      };
    });
  return s;
}
