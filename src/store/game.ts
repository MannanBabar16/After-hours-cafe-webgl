import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { upgrades, customerById, seats } from "../data/content";
import type { RecipeId, Style } from "../data/content";
import {
  products,
  caps,
  supplyCatalog,
  equipment,
  unitCost,
} from "../data/operations";
import type {
  SupplyId,
  EquipmentId,
  StationId,
  ProductId,
} from "../data/operations";
import { audio } from "../game/audio";
import { freshOperations, emptyMachine, emptyOven } from "./operationTypes";
import type { Operations, Carry, ProductItem } from "./operationTypes";
import {
  tickOperations,
  fulfill,
  itemsInHand,
  transaction,
  round,
  containerCapacity,
  ingredientCost,
  makeOrder,
} from "./operationsLogic";
import { safeStorage, mergeBusinessSave } from "./persistence";
import { walkable } from "../game/navigation";

export type Phase = "title" | "playing" | "closing" | "summary";
export type CustomerPhase =
  | "entering"
  | "queueing"
  | "ordering"
  | "waiting"
  | "receiving"
  | "findingSeat"
  | "sitting"
  | "activity"
  | "leaving";
export interface Visitor {
  uid: number;
  id: string;
  seat: number;
  recipe: RecipeId;
  phase: CustomerPhase;
  age: number;
  accepted: boolean;
  paid: boolean;
  posted: boolean;
  payment?: number;
  pastry?: boolean;
  art?: "heart" | "rosetta" | "none";
}
export interface Post {
  id: number;
  customer: string;
  text: string;
  likes: number;
  theme: "rain" | "coffee" | "cat" | "decor";
  time: string;
}
export interface Toast {
  id: number;
  title: string;
  detail: string;
  type: "social" | "money" | "upgrade" | "info";
  age: number;
}
export interface Settings {
  master: number;
  music: number;
  sfx: number;
  smoothing: number;
  graphics: "high" | "low";
}
export interface Business {
  name: string;
  apron: string;
  cup: string;
  theme: "sage" | "rose" | "midnight";
  pricing: "friendly" | "fair" | "premium";
  owned: boolean;
  xp: number;
  lifetimeServed: number;
}
export interface GameState {
  phase: Phase;
  money: number;
  reputation: number;
  followers: number;
  shift: number;
  lifetimeEarned: number;
  business: Business;
  unlocked: RecipeId[];
  purchased: string[];
  familiarity: Record<string, number>;
  posts: Post[];
  visitors: Visitor[];
  elapsed: number;
  revenue: number;
  served: number;
  newRegulars: number;
  followerStart: number;
  ops: Operations;
  carry: Carry | null;
  player: { x: number; z: number; angle: number };
  cameraMode: "isometric" | "first";
  phone: boolean;
  phoneApp: "Supply" | "Equipment" | "Bank" | "Café" | "CafeGram";
  workstation: boolean;
  managementOpen: boolean;
  settingsOpen: boolean;
  help: boolean;
  paused: boolean;
  hasSave: boolean;
  inProgress: boolean;
  debugOpen: boolean;
  event: "none" | "rain" | "flicker" | "viral";
  eventsDone: number[];
  toasts: Toast[];
  settings: Settings;
  newGame: () => void;
  continueGame: () => void;
  nextShift: () => void;
  resetSave: () => void;
  tick: (dt: number) => void;
  notify: (title: string, detail: string, type?: Toast["type"]) => void;
  togglePhone: (app?: GameState["phoneApp"]) => void;
  back: () => void;
  toggleCamera: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setBusiness: (patch: Partial<Business>) => void;
  openCafe: () => void;
  closeCafe: () => void;
  startBrew: (recipe: RecipeId) => void;
  interactStation: (id: StationId) => void;
  takeBox: (id: number) => void;
  pickupLoose: (id: number) => void;
  drop: () => void;
  refill: (supply: SupplyId) => void;
  orderSupplies: (cart: Partial<Record<SupplyId, number>>) => void;
  buyEquipment: (id: EquipmentId) => void;
  buy: (id: string) => void;
  buyCafe: () => void;
  acceptOrder: (id: number) => void;
  serve: (id: number) => void;
  loadRobot: () => void;
  cleanSpill: (id: number) => void;
  setMenuPrice: (id: ProductId, price: number) => void;
  debug: (action: string) => void;
}

const freshSave = () => ({
  money: 85,
  reputation: 12,
  followers: 24,
  shift: 1,
  lifetimeEarned: 0,
  business: {
    name: "After Hours Café",
    apron: "#47634f",
    cup: "#f4e6cd",
    theme: "sage" as const,
    pricing: "fair" as const,
    owned: false,
    xp: 0,
    lifetimeServed: 0,
  },
  unlocked: ["espresso", "americano", "latte", "cappuccino"] as RecipeId[],
  purchased: ["plant", "poster"],
  familiarity: {} as Record<string, number>,
  posts: [] as Post[],
  followerStart: 24,
  ops: freshOperations(),
  carry: null as Carry | null,
  player: { x: -0.6, z: -1.2, angle: Math.PI },
  cameraMode: "isometric" as const,
  elapsed: 0,
  revenue: 0,
  served: 0,
  newRegulars: 0,
  visitors: [] as Visitor[],
  event: "none" as const,
  eventsDone: [] as number[],
});
const clone = (s: GameState): GameState => ({
  ...s,
  ops: {
    ...s.ops,
    containers: { ...s.ops.containers },
    boxes: s.ops.boxes.map((b) => ({ ...b })),
    levels: { ...s.ops.levels },
    machine: { ...s.ops.machine },
    oven: { ...s.ops.oven },
    display: { ...s.ops.display },
    robot: { ...s.ops.robot },
  },
});
const handAvailable = (s: GameState) =>
  !s.carry ||
  (s.carry.kind === "tray" &&
    s.carry.items.length < caps(s.ops.levels, "tray"));
const placeItem = (s: GameState, item: ProductItem) => {
  s.carry =
    s.carry?.kind === "tray"
      ? { kind: "tray", items: [...s.carry.items, item] }
      : { kind: "product", item };
};
const toast = (
  s: GameState,
  title: string,
  detail: string,
  type: Toast["type"] = "info",
) => {
  s.toasts = [
    ...s.toasts.slice(-2),
    { id: ++s.ops.serial, title, detail, type, age: 0 },
  ];
};
export const styleScores = (purchased: string[]): Record<Style, number> => {
  const styles = { Cozy: 25, Nature: 8, Study: 12, Modern: 10 };
  for (const id of purchased) {
    const u = upgrades.find((u) => u.id === id);
    if (u) styles[u.style] += u.points;
  }
  return styles;
};
export const familiarityLabel = (visits: number) =>
  visits >= 3 ? "Regular" : visits >= 1 ? "Familiar" : "New face";

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...freshSave(),
      phase: "title",
      phone: false,
      phoneApp: "Supply",
      workstation: false,
      managementOpen: false,
      settingsOpen: false,
      help: false,
      paused: false,
      debugOpen: false,
      hasSave: !!safeStorage.getItem("after-hours-cafe-v1"),
      inProgress: false,
      toasts: [],
      settings: {
        master: 0.65,
        music: 0.3,
        sfx: 0.6,
        smoothing: 0.6,
        graphics: "high",
      },
      newGame: () => {
        audio.stopMachines();
        audio.setClosing(false);
        set({
          ...freshSave(),
          phase: "playing",
          inProgress: true,
          hasSave: true,
          phone: false,
          workstation: false,
          managementOpen: false,
          paused: false,
          toasts: [],
        });
      },
      continueGame: () => {
        const s = get();
        audio.setClosing(false);
        set({
          phase: s.ops.closing
            ? "closing"
            : s.inProgress
              ? "playing"
              : "summary",
          paused: false,
        });
      },
      nextShift: () => {
        const s = clone(get());
        s.phase = "playing";
        s.shift++;
        s.elapsed = 0;
        s.revenue = 0;
        s.served = 0;
        s.newRegulars = 0;
        s.followerStart = s.followers;
        s.event = "none";
        s.eventsDone = [];
        s.visitors = [];
        s.ops = {
          ...s.ops,
          orders: [],
          paidOrderIds: [],
          supplySpend: 0,
          upgradeSpend: 0,
          ingredientCost: 0,
          tips: 0,
          overhead: 0,
          indoorTimer: 5,
          driveTimer: 25,
          open: false,
          closing: false,
        };
        s.paused = false;
        s.phone = false;
        s.workstation = false;
        s.managementOpen = false;
        s.inProgress = true;
        audio.setClosing(false);
        set(s);
      },
      resetSave: () => {
        safeStorage.removeItem("after-hours-cafe-v1");
        audio.stopMachines();
        set({
          ...freshSave(),
          phase: "title",
          hasSave: false,
          inProgress: false,
          phone: false,
          paused: false,
          settingsOpen: false,
        });
      },
      tick: (dt) => set(tickOperations(get(), dt)),
      notify: (title, detail, type = "info") => {
        const s = clone(get());
        toast(s, title, detail, type);
        set({ toasts: s.toasts, ops: s.ops });
      },
      togglePhone: (app) => {
        const s = get();
        if (s.phase === "title" || s.phase === "summary") return;
        audio.play("click");
        set({
          phone: app ? true : !s.phone,
          phoneApp: app ?? s.phoneApp,
          workstation: false,
          managementOpen: false,
        });
      },
      back: () => {
        const s = get();
        if (s.settingsOpen) set({ settingsOpen: false });
        else if (s.help) set({ help: false });
        else if (s.debugOpen) set({ debugOpen: false });
        else if (s.phone || s.managementOpen)
          set({ phone: false, managementOpen: false });
        else if (s.workstation) set({ workstation: false });
        else set({ paused: !s.paused });
      },
      toggleCamera: () => {
        const s = get();
        if (
          (s.phase !== "playing" && s.phase !== "closing") ||
          s.phone ||
          s.settingsOpen ||
          s.paused ||
          s.help
        )
          return;
        set({
          cameraMode: s.cameraMode === "first" ? "isometric" : "first",
          workstation: false,
        });
        audio.play("click");
      },
      updateSettings: (patch) => {
        const settings = { ...get().settings, ...patch };
        audio.update(settings);
        set({ settings });
      },
      setBusiness: (patch) =>
        set({ business: { ...get().business, ...patch } }),
      openCafe: () => {
        const s = get();
        if (s.phase !== "playing") return;
        set({
          ops: {
            ...s.ops,
            open: true,
            onboarding: Math.max(1, s.ops.onboarding),
          },
        });
        audio.play("door");
        get().notify(
          "The lights are on",
          "Take your first order at the counter. No need to rush.",
        );
      },
      closeCafe: () => {
        const s = clone(get());
        if (s.phase !== "playing") return;
        s.ops.open = false;
        s.ops.closing = true;
        s.phase = "closing";
        s.ops.orders = s.ops.orders.filter((o) => o.accepted || o.paid);
        s.visitors = s.visitors.filter((v) => v.accepted || v.paid);
        toast(
          s,
          "Last orders, softly",
          "Finish accepted orders, then review your evening.",
        );
        set(s);
      },
      startBrew: (recipe) => {
        const s = clone(get());
        const m = s.ops.machine;
        const p = products[recipe];
        if (!s.unlocked.includes(recipe)) return;
        if (m.stage !== "cup") {
          toast(
            s,
            "Place an empty cup first",
            "Take one from the dispenser and put it below the spout.",
          );
          set(s);
          return;
        }
        if (s.ops.grounds >= 8) {
          toast(
            s,
            "Empty the grounds drawer",
            "Take the grounds to the trash bin, then brew again.",
          );
          set(s);
          return;
        }
        for (const id of ["beans", "milk", "syrup"] as const)
          if (s.ops.containers[id] < p[id]) {
            toast(
              s,
              `Need more ${supplyCatalog[id].name.toLowerCase()}`,
              "Carry a matching supply box here to refill.",
            );
            set(s);
            return;
          }
        for (const id of ["beans", "milk", "syrup"] as const)
          s.ops.containers[id] -= p[id];
        s.ops.ingredientCost = round(
          s.ops.ingredientCost + ingredientCost(recipe),
        );
        s.ops.grounds++;
        s.ops.machine = {
          stage: "brewing",
          recipe,
          elapsed: 0,
          duration: p.seconds / caps(s.ops.levels, "machine"),
          item: null,
        };
        s.workstation = false;
        toast(
          s,
          `${p.name} is brewing`,
          "You can take an order, restock, or prepare a cookie tray.",
        );
        audio.machine("grinder");
        set(s);
      },
      takeBox: (id) => {
        const s = clone(get());
        const box = s.ops.boxes.find((b) => b.id === id);
        if (!box || box.location === "carried") return;
        if (s.carry) {
          toast(
            s,
            "Your hands are full",
            "G puts your carried object safely down.",
          );
          set(s);
          return;
        }
        box.location = "carried";
        s.carry = { kind: "box", boxId: id };
        audio.play("paper");
        set(s);
      },
      pickupLoose: (id) => {
        const s = clone(get());
        if (s.carry) return;
        const loose = s.ops.loose.find((o) => o.id === id);
        if (!loose) return;
        s.carry = loose.carry;
        s.ops.loose = s.ops.loose.filter((o) => o.id !== id);
        audio.play("cup");
        set(s);
      },
      drop: () => {
        const s = clone(get());
        if (!s.carry) return;
        const proposedX = s.player.x + Math.sin(s.player.angle) * 0.6,
          proposedZ = s.player.z + Math.cos(s.player.angle) * 0.6;
        const safe = walkable(proposedX, proposedZ, s.purchased);
        const x = safe ? proposedX : s.player.x,
          z = safe ? proposedZ : s.player.z;
        if (s.carry.kind === "box") {
          const box = s.ops.boxes.find(
            (b) => b.id === (s.carry as { boxId: number }).boxId,
          );
          if (box) {
            box.location = "floor";
            box.x = x;
            box.z = z;
            box.slot = -1;
          }
        } else
          s.ops.loose = [
            ...s.ops.loose,
            { id: ++s.ops.serial, carry: s.carry, x, z },
          ];
        s.carry = null;
        audio.play("cup");
        set(s);
      },
      refill: (supply) => {
        const s = clone(get());
        if (s.carry?.kind !== "box") {
          toast(
            s,
            "Bring a supply box",
            "Pick up the matching labeled box from storage or your delivery.",
          );
          set(s);
          return;
        }
        const box = s.ops.boxes.find(
          (b) => b.id === (s.carry as { boxId: number }).boxId,
        );
        if (!box || box.supply !== supply) {
          toast(
            s,
            "That box belongs elsewhere",
            `This equipment uses ${supplyCatalog[supply].name.toLowerCase()}.`,
          );
          set(s);
          return;
        }
        const quantity = Math.min(
          box.quantity,
          containerCapacity(s, supply) - s.ops.containers[supply],
        );
        if (quantity <= 0) {
          toast(s, "Already topped up", "Keep the remaining box in storage.");
          set(s);
          return;
        }
        box.quantity -= quantity;
        s.ops.containers[supply] += quantity;
        audio.play("refill");
        toast(
          s,
          `+${quantity} ${supplyCatalog[supply].unit}`,
          box.quantity
            ? `${box.quantity} left in the box. No stock wasted.`
            : "The empty packaging can go in the bin.",
        );
        set(s);
      },
      orderSupplies: (cart) => {
        const s = clone(get());
        const items = Object.entries(cart)
          .filter(
            ([id, packs]) =>
              id in supplyCatalog &&
              Number.isInteger(packs) &&
              (packs ?? 0) > 0 &&
              (packs ?? 0) <= 5,
          )
          .map(([supply, packs]) => ({
            supply: supply as SupplyId,
            packs: packs!,
          }));
        const incoming = s.ops.shipments
          .filter((sh) => sh.stage === "ordered" || sh.stage === "arriving")
          .reduce(
            (n, sh) => n + sh.items.reduce((sum, item) => sum + item.packs, 0),
            0,
          );
        if (
          !items.length ||
          s.ops.shipments.length >= 3 ||
          s.ops.boxes.length +
            incoming +
            items.reduce((n, item) => n + item.packs, 0) >
            40
        ) {
          toast(
            s,
            "A little room for the delivery",
            "Unpack a few boxes before adding another large order.",
          );
          set(s);
          return;
        }
        const cost = items.reduce(
          (n, item) => n + supplyCatalog[item.supply].price * item.packs,
          0,
        );
        const recovery =
          s.money < cost &&
          s.money >= -20 &&
          cost <= 15 &&
          (s.ops.containers.beans < 1 ||
            s.ops.containers.cups < 1 ||
            s.ops.containers.milk < 2);
        if (s.money < cost && !recovery) {
          toast(
            s,
            "A little more in the till first",
            "Serve an order, or use stock already in the backroom.",
          );
          set(s);
          return;
        }
        s.money = round(s.money - cost);
        s.ops.supplySpend = round(s.ops.supplySpend + cost);
        s.ops.transactions = transaction(
          s,
          "supplies",
          recovery
            ? "Supplier credit · stock delivery"
            : "Stock delivery ordered",
          -cost,
        );
        s.ops.shipments = [
          ...s.ops.shipments,
          { id: ++s.ops.serial, items, stage: "ordered", age: 0 },
        ];
        audio.play("click");
        toast(
          s,
          "Your supplies are on their way",
          "A truck will bring real boxes to the front entrance shortly.",
        );
        set(s);
      },
      buyEquipment: (id) => {
        const s = clone(get());
        const def = equipment[id];
        const level = s.ops.levels[id];
        const price = def.prices[level];
        if (price === undefined) return;
        if (s.money < price) {
          toast(
            s,
            "Save a few more sales",
            `This upgrade is $${price}. Your current stock stays yours.`,
          );
          set(s);
          return;
        }
        s.money = round(s.money - price);
        s.ops.levels[id]++;
        s.ops.upgradeSpend += price;
        s.ops.transactions = transaction(
          s,
          "upgrade",
          `${def.name} · level ${level + 2}`,
          -price,
        );
        audio.play("upgrade");
        toast(
          s,
          `${def.name} upgraded`,
          `${def.values[level + 1]} ${def.unit}. Capacity changed; no ingredients were added.`,
          "upgrade",
        );
        set(s);
      },
      buy: (id) => {
        const s = clone(get());
        const def = upgrades.find((u) => u.id === id);
        if (!def || s.purchased.includes(id) || s.money < def.price) return;
        s.money -= def.price;
        s.purchased = [...s.purchased, id];
        s.ops.upgradeSpend += def.price;
        s.ops.transactions = transaction(s, "upgrade", def.name, -def.price);
        audio.play("upgrade");
        set(s);
      },
      buyCafe: () => {
        const s = clone(get());
        if (s.business.owned || s.money < 500) return;
        s.money -= 500;
        s.ops.upgradeSpend += 500;
        s.business = { ...s.business, owned: true };
        s.ops.transactions = transaction(
          s,
          "upgrade",
          "Own the café · nightly rent removed",
          -500,
        );
        set(s);
      },
      acceptOrder: (id) => {
        const s = clone(get());
        const order = s.ops.orders.find((o) => o.id === id);
        if (
          !order ||
          order.paid ||
          order.accepted ||
          (order.channel === "drive" && order.vehiclePhase !== "waiting")
        )
          return;
        s.ops.orders = s.ops.orders.map((o) =>
          o.id === id ? { ...o, accepted: true } : o,
        );
        s.visitors = s.visitors.map((v) =>
          v.uid === id ? { ...v, accepted: true, phase: "waiting", age: 0 } : v,
        );
        audio.play("paper");
        toast(
          s,
          "Order taken",
          order.lines
            .map((l) => `${products[l.product].name} ×${l.quantity}`)
            .join(" · "),
        );
        set(s);
      },
      serve: (id) => {
        const s = clone(get());
        const offered = itemsInHand(s.carry);
        const result = fulfill(s, id, offered);
        if (!result.consumed.length) {
          toast(
            s,
            "Keep this for the right order",
            "Only matching products are handed over. Take an order first.",
          );
          set(s);
          return;
        }
        const rest = offered.filter((i) => !result.consumed.includes(i.id));
        s.carry =
          s.carry?.kind === "tray"
            ? { kind: "tray", items: rest }
            : rest[0]
              ? { kind: "product", item: rest[0] }
              : null;
        audio.play("cup");
        if (!result.paid)
          toast(
            s,
            "One part delivered",
            "Finish the remaining items for a single payment.",
          );
        set(s);
      },
      loadRobot: () => {
        const s = clone(get());
        if (!caps(s.ops.levels, "robot") || s.ops.robot.stage !== "idle")
          return;
        const offered = itemsInHand(s.carry).length
          ? itemsInHand(s.carry)
          : s.ops.handoff;
        const order = s.ops.orders.find(
          (o) =>
            o.channel === "indoor" &&
            o.accepted &&
            !o.paid &&
            offered.some((item) =>
              o.lines.some(
                (l) => l.product === item.product && l.delivered < l.quantity,
              ),
            ),
        );
        if (!order) {
          toast(
            s,
            "Bomi needs a matching indoor order",
            "Carry a finished drink or cookie, or place one on the handoff counter.",
          );
          set(s);
          return;
        }
        const selected: ProductItem[] = [];
        for (const item of offered) {
          const line = order.lines.find((l) => l.product === item.product);
          if (
            line &&
            selected.length < caps(s.ops.levels, "robot") &&
            selected.filter((i) => i.product === item.product).length <
              line.quantity - line.delivered
          )
            selected.push(item);
        }
        const ids = new Set(selected.map((i) => i.id));
        const rest = offered.filter((i) => !ids.has(i.id));
        if (itemsInHand(s.carry).length)
          s.carry =
            s.carry?.kind === "tray"
              ? { kind: "tray", items: rest }
              : rest[0]
                ? { kind: "product", item: rest[0] }
                : null;
        else s.ops.handoff = rest;
        const visitor = s.visitors.find((v) => v.uid === order.visitorUid);
        const seat = seats[visitor?.seat ?? 0];
        const target: [number, number] = order.paid
          ? [seat[0], seat[1] + 0.85]
          : [1.7 + (order.id % 3) * 0.38, -1.45 + (order.id % 3) * 0.3];
        s.ops.robot = {
          stage: "outbound",
          elapsed: 0,
          orderId: order.id,
          items: selected,
          route: [[0.55, -0.9], [1.7, -0.9], target],
        };
        audio.play("robot");
        toast(
          s,
          "Bomi has the tray",
          `Delivering ${selected.length} item${selected.length === 1 ? "" : "s"} to ${customerById(order.customer).name}.`,
        );
        set(s);
      },
      cleanSpill: (id) => {
        const s = clone(get());
        if (s.carry) return;
        s.ops.spills = s.ops.spills.filter((spill) => spill.id !== id);
        audio.play("cloth");
        set(s);
      },
      setMenuPrice: (id, price) => {
        if (!Number.isFinite(price) || price < 1 || price > 12) return;
        const s = clone(get());
        s.ops.menuPrices = { ...s.ops.menuPrices, [id]: round(price) };
        set(s);
      },
      interactStation: (id) => {
        const getFresh = () => clone(get());
        let s = getFresh();
        if (
          id === "hopper" ||
          id === "milk" ||
          id === "syrup" ||
          id === "dough" ||
          (id === "cups" && s.carry?.kind === "box")
        ) {
          get().refill(
            id === "hopper"
              ? "beans"
              : id === "cups"
                ? "cups"
                : id === "milk"
                  ? "milk"
                  : id === "syrup"
                    ? "syrup"
                    : "dough",
          );
          return;
        }
        if (id === "cups") {
          if (s.carry) {
            toast(
              s,
              "Free a hand first",
              "G puts your current object down safely.",
            );
          } else if (s.ops.containers.cups <= 0)
            toast(
              s,
              "The cup stack is empty",
              "Carry a paper-cup box here to refill.",
            );
          else {
            s.ops.containers.cups--;
            s.ops.ingredientCost = round(
              s.ops.ingredientCost + unitCost("cups"),
            );
            s.carry = { kind: "cup" };
            audio.play("paper");
          }
        } else if (id === "machine") {
          if (s.carry?.kind === "cup" && s.ops.machine.stage === "empty") {
            s.carry = null;
            s.ops.machine.stage = "cup";
            s.workstation = true;
            audio.play("cup");
          } else if (
            s.ops.machine.stage === "ready" &&
            s.ops.machine.item &&
            handAvailable(s)
          ) {
            placeItem(s, s.ops.machine.item);
            s.ops.machine = emptyMachine();
            audio.play("cup");
          } else if (s.ops.machine.stage === "cup") s.workstation = true;
          else
            toast(
              s,
              s.ops.machine.stage === "brewing"
                ? "The machine is working"
                : "Start with a paper cup",
              s.ops.machine.stage === "brewing"
                ? "You can do another task while it brews."
                : "Take a cup from the stack on the left.",
            );
        } else if (id === "oven") {
          if (s.business.lifetimeServed < 2)
            toast(
              s,
              "The bakery opens after two orders",
              "Get comfortable with coffee first.",
            );
          else if (
            s.carry?.kind === "bakingTray" &&
            !s.carry.baked &&
            s.ops.oven.stage === "empty"
          ) {
            s.ops.oven = {
              ...emptyOven(),
              stage: "loaded",
              quantity: s.carry.quantity,
              doorOpen: true,
            };
            s.carry = null;
            audio.play("latch");
          } else if (s.ops.oven.stage === "loaded") {
            s.ops.oven.stage = "baking";
            s.ops.oven.doorOpen = false;
            s.ops.oven.duration = 20 - s.ops.levels.oven * 3;
            audio.play("latch");
          } else if (s.ops.oven.stage === "ready" && !s.carry) {
            s.carry = {
              kind: "bakingTray",
              quantity: s.ops.oven.quantity,
              baked: true,
              quality: s.ops.oven.quality,
            };
            s.ops.oven = { ...emptyOven(), doorOpen: true };
            audio.play("cup");
          } else
            toast(
              s,
              "Bring a cookie tray",
              "Prepare dough in the stockroom. Load it here, then start the oven.",
            );
        } else if (id === "tray") {
          if (s.carry)
            toast(
              s,
              "One carried object at a time",
              "G puts your object down.",
            );
          else {
            s.carry = { kind: "tray", items: [] };
            audio.play("cup");
          }
        } else if (id === "display") {
          if (s.carry?.kind === "bakingTray" && s.carry.baked) {
            const add = Math.min(
              s.carry.quantity,
              caps(s.ops.levels, "display") - s.ops.display.quantity,
            );
            s.ops.display.quality = s.ops.display.quantity
              ? Math.min(s.carry.quality, s.ops.display.quality)
              : s.carry.quality;
            s.ops.display.quantity += add;
            s.carry =
              s.carry.quantity > add
                ? { ...s.carry, quantity: s.carry.quantity - add }
                : null;
            toast(
              s,
              `${add} warm cookies displayed`,
              "Pick up cookies as customers order them.",
            );
            audio.play("cup");
          } else if (s.ops.display.quantity && handAvailable(s)) {
            s.ops.display.quantity--;
            placeItem(s, {
              id: ++s.ops.serial,
              product: "cookie",
              quality: s.ops.display.quality,
            });
            audio.play("paper");
          } else
            toast(
              s,
              "A small batch, freshly baked",
              "Transfer a finished baking tray here.",
            );
        } else if (id === "storage") {
          if (s.carry?.kind === "box") {
            const box = s.ops.boxes.find(
              (b) => b.id === (s.carry as { boxId: number }).boxId,
            );
            const used = new Set(
              s.ops.boxes
                .filter((b) => b.location === "storage")
                .map((b) => b.slot),
            );
            let slot = 0;
            while (used.has(slot)) slot++;
            if (slot >= caps(s.ops.levels, "storage"))
              toast(
                s,
                "The shelf is full",
                "Put the box down safely or upgrade your shelving.",
              );
            else if (box) {
              box.location = "storage";
              box.slot = slot;
              box.x = -8.15;
              box.z = -0.75 + (slot % 4) * 0.9;
              s.carry = null;
              audio.play("cup");
            }
          } else
            toast(
              s,
              "Your stockroom",
              "Pick up a labeled box, refill matching equipment, and store the rest.",
            );
        } else if (id === "handoff") {
          const items = itemsInHand(s.carry);
          if (items.length && s.ops.handoff.length + items.length <= 6) {
            s.ops.handoff = [...s.ops.handoff, ...items];
            s.carry = null;
            audio.play("cup");
          } else if (s.ops.handoff.length && handAvailable(s)) {
            placeItem(s, s.ops.handoff[0]);
            s.ops.handoff = s.ops.handoff.slice(1);
            audio.play("cup");
          } else
            toast(
              s,
              "Handoff counter",
              "Place finished products here for Bomi, or collect them yourself.",
            );
        } else if (id === "trash") {
          if (s.carry?.kind === "box") {
            const box = s.ops.boxes.find(
              (b) => b.id === (s.carry as { boxId: number }).boxId,
            );
            if (box && box.quantity > 0)
              toast(
                s,
                "There is still good stock in this box",
                "Use it or store it; only empty packaging belongs in the bin.",
              );
            else {
              s.ops.boxes = s.ops.boxes.filter(
                (b) => b.id !== (s.carry as { boxId: number }).boxId,
              );
              s.carry = null;
              audio.play("paper");
            }
          } else if (s.carry) {
            s.carry = null;
            audio.play("paper");
          }
        } else if (id === "grounds") {
          if (
            !s.carry &&
            s.ops.grounds > 0 &&
            s.ops.machine.stage !== "brewing"
          ) {
            s.carry = { kind: "trash", label: "Used coffee grounds" };
            s.ops.grounds = 0;
            audio.play("latch");
          } else
            toast(
              s,
              "Grounds drawer",
              `${s.ops.grounds}/8 used portions. Empty it into the bin when full.`,
            );
        } else if (id === "robot") {
          get().loadRobot();
          return;
        } else if (id === "door") {
          if (s.ops.open) get().closeCafe();
          else get().openCafe();
          return;
        } else if (id === "window") {
          const order = s.ops.orders.find(
            (o) =>
              o.channel === "drive" && o.vehiclePhase === "waiting" && !o.paid,
          );
          if (order) {
            if (!order.accepted) get().acceptOrder(order.id);
            else get().serve(order.id);
          }
          return;
        } else if (id === "cat") {
          toast(s, "Milo approves.", "A slow blink. You have been accepted.");
          audio.play("robot");
        }
        set(s);
      },
      debug: (action) => {
        if (!import.meta.env.DEV) return;
        const s = clone(get());
        if (action === "money") s.money += 100;
        if (action === "refill")
          for (const id of Object.keys(s.ops.containers) as SupplyId[])
            s.ops.containers[id] = containerCapacity(s, id);
        if (action === "indoor" || action === "drive") {
          const made = makeOrder(s, action);
          s.ops.orders = [...s.ops.orders, made.order];
          if (made.visitor) s.visitors = [...s.visitors, made.visitor];
        }
        if (action === "delivery")
          s.ops.shipments = s.ops.shipments.map((sh) => ({ ...sh, age: 12 }));
        if (action === "oven" && s.ops.oven.stage === "baking")
          s.ops.oven.elapsed = s.ops.oven.duration;
        if (action === "bakery")
          s.business = {
            ...s.business,
            lifetimeServed: Math.max(2, s.business.lifetimeServed),
          };
        if (action === "rain") s.event = s.event === "rain" ? "none" : "rain";
        if (action === "upgrade") {
          s.ops.levels = {
            hopper: 1,
            milkTank: 1,
            cupDispenser: 1,
            oven: 1,
            machine: 1,
            display: 1,
            robot: 1,
            storage: 1,
            tray: 1,
          };
        }
        if (action === "camera")
          s.cameraMode = s.cameraMode === "first" ? "isometric" : "first";
        if (action === "close") {
          s.phase = "closing";
          s.ops.open = false;
        }
        set(s);
      },
    }),
    {
      name: "after-hours-cafe-v1",
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        money: s.money,
        reputation: s.reputation,
        followers: s.followers,
        shift: s.shift,
        lifetimeEarned: s.lifetimeEarned,
        business: s.business,
        unlocked: s.unlocked,
        purchased: s.purchased,
        familiarity: s.familiarity,
        posts: s.posts,
        ops: s.ops,
        carry: s.carry,
        player: s.player,
        cameraMode: s.cameraMode,
        elapsed: s.elapsed,
        revenue: s.revenue,
        served: s.served,
        newRegulars: s.newRegulars,
        followerStart: s.followerStart,
        visitors: s.visitors,
        settings: s.settings,
        eventsDone: s.eventsDone,
        event: s.event,
        inProgress: s.inProgress,
      }),
      migrate: (saved) => saved,
      merge: (saved, current) => mergeBusinessSave(saved, current),
    },
  ),
);

// The dough station shares the refill target; a separate prep interaction keeps
// supply transfer and production explicit, never creating dough from a button.
export function prepareCookieTray() {
  const s = clone(useGame.getState());
  if (s.business.lifetimeServed < 2) {
    toast(
      s,
      "The bakery opens after two orders",
      "Start with coffee, then add warm cookies.",
    );
  } else if (s.carry)
    toast(
      s,
      "Free your hands for a baking tray",
      "Refill the dough station first, then put the box down.",
    );
  else {
    const amount = Math.min(caps(s.ops.levels, "oven"), s.ops.containers.dough);
    if (!amount)
      toast(
        s,
        "The dough station is empty",
        "Refill it with a dough supply box.",
      );
    else {
      s.ops.containers.dough -= amount;
      s.ops.ingredientCost = round(
        s.ops.ingredientCost + amount * unitCost("dough"),
      );
      s.carry = {
        kind: "bakingTray",
        quantity: amount,
        baked: false,
        quality: 1,
      };
      audio.play("paper");
    }
  }
  useGame.setState(s);
}
