import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  customers,
  customerById,
  recipeById,
  upgrades,
  SHIFT_SECONDS,
} from "../data/content";
import type { RecipeId, Style } from "../data/content";
import { audio } from "../game/audio";
import { createBarActions } from "./barActions";
import { safeStorage, mergeSave } from "./persistence";
import { freshBrew, finishShot, finishMilk, flowRate } from "../game/craft";
import type { Brew } from "../game/craft";
export type { Brew, BrewStage } from "../game/craft";
import {
  freshBusiness,
  nextBusiness,
  supplies,
  sellingPrice,
  dailyGoals,
  overhead,
  level,
} from "../game/business";
import type { Business } from "../game/business";

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
  quotedPrice?: number;
  art?: Brew["art"];
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
export interface Drink {
  recipe: RecipeId;
  quality: "perfect" | "lovely";
  score?: number;
  art?: Brew["art"];
}
export interface Settings {
  master: number;
  music: number;
  sfx: number;
  smoothing: number;
  graphics: "high" | "low";
}
export interface GameState {
  business: Business;
  managementOpen: boolean;
  managementTab: "today" | "supplies" | "menu" | "studio" | "journal";
  setBusiness: (
    patch: Partial<
      Pick<
        Business,
        "name" | "apron" | "cup" | "theme" | "pricing" | "pastryMenu" | "guided"
      >
    >,
  ) => void;
  restock: (kind: keyof typeof supplies) => void;
  configureBrew: (
    patch: Partial<Pick<Brew, "roast" | "grind" | "dose" | "art" | "pour">>,
  ) => void;
  craftStep: () => void;
  restartBrew: () => void;
  startPractice: () => void;
  cleanBar: () => void;
  busTables: () => void;
  buyCafe: () => void;
  phase: Phase;
  phone: boolean;
  phoneApp: "CafeGram" | "Bank" | "Café" | "Shop";
  settingsOpen: boolean;
  help: boolean;
  workstation: boolean;
  paused: boolean;
  hasSave: boolean;
  inProgress: boolean;
  money: number;
  reputation: number;
  followers: number;
  shift: number;
  lifetimeEarned: number;
  unlocked: RecipeId[];
  purchased: string[];
  familiarity: Record<string, number>;
  posts: Post[];
  elapsed: number;
  arrivalTimer: number;
  visitorSerial: number;
  visitors: Visitor[];
  revenue: number;
  served: number;
  perfect: number;
  newRegulars: number;
  followerStart: number;
  drinkCounts: Record<RecipeId, number>;
  tray: Drink | null;
  brew: Brew;
  toasts: Toast[];
  event: "none" | "rain" | "flicker" | "viral";
  eventAge: number;
  eventsDone: number[];
  closingAge: number;
  settings: Settings;
  newGame: () => void;
  continueGame: () => void;
  nextShift: () => void;
  resetSave: () => void;
  tick: (dt: number) => void;
  togglePhone: (app?: GameState["phoneApp"]) => void;
  openWorkstation: () => void;
  back: () => void;
  selectRecipe: (recipe: RecipeId) => void;
  placeCup: () => void;
  extract: () => void;
  steam: (held: boolean) => void;
  addFoam: () => void;
  takeDrink: () => void;
  acceptOrder: (uid: number) => void;
  serve: (uid: number) => void;
  buy: (id: string) => void;
  notify: (title: string, detail: string, type?: Toast["type"]) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}
const freshShift = () => ({
  elapsed: 0,
  arrivalTimer: 5,
  visitorSerial: 0,
  visitors: [] as Visitor[],
  revenue: 0,
  served: 0,
  perfect: 0,
  newRegulars: 0,
  drinkCounts: {
    espresso: 0,
    latte: 0,
    cappuccino: 0,
    americano: 0,
    flatwhite: 0,
  },
  tray: null,
  brew: freshBrew(),
  event: "none" as const,
  eventAge: 0,
  eventsDone: [],
  closingAge: 0,
});
const freshSave = () => ({
  business: freshBusiness(),
  money: 50,
  reputation: 12,
  followers: 24,
  shift: 1,
  lifetimeEarned: 0,
  unlocked: ["espresso"] as RecipeId[],
  purchased: [] as string[],
  familiarity: {} as Record<string, number>,
  posts: [] as Post[],
  followerStart: 24,
});
const toast = (
  title: string,
  detail: string,
  type: Toast["type"] = "info",
): Toast => ({ id: Date.now() + Math.random(), title, detail, type, age: 0 });
export const styleScores = (purchased: string[]): Record<Style, number> => {
  const styles = { Cozy: 25, Nature: 8, Study: 12, Modern: 10 };
  for (const id of purchased) {
    const upgrade = upgrades.find((u) => u.id === id);
    if (upgrade) styles[upgrade.style] += upgrade.points;
  }
  return styles;
};
export const familiarityLabel = (visits: number) =>
  visits >= 3 ? "Regular" : visits >= 1 ? "Familiar" : "New face";
export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...freshSave(),
      ...freshShift(),
      phase: "title",
      managementOpen: false,
      managementTab: "today",
      phone: false,
      phoneApp: "CafeGram",
      settingsOpen: false,
      help: false,
      workstation: false,
      paused: false,
      hasSave: false,
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
        set({
          ...freshSave(),
          ...freshShift(),
          managementOpen: false,
          phase: "playing",
          hasSave: true,
          inProgress: true,
          workstation: false,
          phone: false,
          settingsOpen: false,
          paused: false,
          toasts: [
            toast(
              "The lights are on.",
              "Make your first espresso. Someone will be in soon.",
            ),
          ],
        });
        audio.setClosing(false);
      },
      continueGame: () => {
        const s = get();
        if (!s.hasSave) return;
        audio.stopMachines();
        if (s.brew.stage === "extracting") audio.machine("pump");
        if (s.brew.stage === "grinding") audio.machine("grinder");
        if (s.inProgress)
          set({
            phase: s.elapsed >= SHIFT_SECONDS ? "closing" : "playing",
            phone: false,
            paused: false,
            workstation: false,
            settingsOpen: false,
            toasts: [
              toast(
                "Welcome back.",
                "Your little corner of the night is waiting.",
              ),
            ],
          });
        else get().nextShift();
        audio.setClosing(false);
      },
      nextShift: () => {
        const s = get();
        set({
          ...freshShift(),
          business: nextBusiness(s.business),
          managementOpen: false,
          phase: "playing",
          shift: s.shift + 1,
          followerStart: s.followers,
          inProgress: true,
          phone: false,
          paused: false,
          workstation: false,
          toasts: [
            toast(
              `Evening ${s.shift + 1}`,
              "Another night. A few more familiar faces.",
            ),
          ],
        });
        audio.setClosing(false);
      },
      resetSave: () => {
        audio.stopMachines();
        set({
          ...freshSave(),
          ...freshShift(),
          managementOpen: false,
          hasSave: false,
          inProgress: false,
          phase: "title",
          phone: false,
          settingsOpen: false,
          workstation: false,
          toasts: [],
        });
        useGame.persist.clearStorage();
      },
      notify: (title, detail, type = "info") =>
        set((s) => ({
          toasts: [...s.toasts.slice(-3), toast(title, detail, type)],
        })),
      togglePhone: (app) => {
        const s = get();
        if (s.phase === "title" || s.phase === "summary" || s.workstation)
          return;
        set({ phone: app ? true : !s.phone, phoneApp: app ?? s.phoneApp });
        audio.play("click");
      },
      openWorkstation: () => {
        const s = get();
        if (s.phase !== "playing" || s.phone || s.tray) {
          if (s.tray)
            s.notify("Tray in hand", "Serve this drink before making another.");
          return;
        }
        set({ workstation: true });
        audio.play("click");
      },
      back: () => {
        const s = get();
        if (s.managementOpen) set({ managementOpen: false });
        else if (s.settingsOpen) set({ settingsOpen: false });
        else if (s.help) set({ help: false });
        else if (s.phone) set({ phone: false });
        else if (s.workstation) {
          if (s.brew.stage === "steaming") get().steam(false);
          if (s.brew.practice) {
            audio.stopMachines();
            set({ brew: freshBrew() });
          }
          set({ workstation: false });
        } else if (s.phase === "playing" || s.phase === "closing")
          set({ paused: !s.paused });
        audio.play("click");
      },
      ...createBarActions(set, get),
      acceptOrder: (uid) => {
        set((s) => ({
          visitors: s.visitors.map((v) =>
            v.uid === uid ? { ...v, accepted: true } : v,
          ),
        }));
        audio.play("click");
      },
      serve: (uid) => {
        const s = get();
        const v = s.visitors.find((v) => v.uid === uid);
        if (!v || v.phase !== "waiting" || !s.tray) return;
        if (v.recipe !== s.tray.recipe) {
          s.notify(
            "A little mix-up",
            `${customerById(v.id).name} is waiting for ${recipeById(v.recipe).name.toLowerCase()}.`,
          );
          return;
        }
        const customer = customerById(v.id);
        const perfect = s.tray.quality === "perfect";
        const tip =
          (perfect ? 1 : s.business.pricing === "premium" ? 0.25 : 0.5) +
          ((s.familiarity[v.id] ?? 0) >= 3 ? 0.5 : 0);
        const pastry = !!v.pastry && s.business.pastries >= 1;
        const price =
          v.quotedPrice ?? sellingPrice(v.recipe, s.business.pricing);
        const amount =
          Math.round((price + tip + (pastry ? 2.5 : 0)) * 100) / 100;
        const visits = (s.familiarity[v.id] ?? 0) + 1;
        const unlocked = [...s.unlocked];
        const notifications = [
          toast(
            `+$${amount.toFixed(2)}`,
            `${customer.name} · Coffee $${price.toFixed(2)}${pastry ? " + pastry $2.50" : ""} + tip $${tip.toFixed(2)}`,
            "money",
          ),
        ];
        if (s.served === 0 && !unlocked.includes("latte")) {
          unlocked.push("latte");
          notifications.push(
            toast(
              "A softer kind of coffee",
              "Latte unlocked. Try the steam wand.",
              "upgrade",
            ),
          );
        }
        if (s.served === 2 && !unlocked.includes("cappuccino")) {
          unlocked.push("cappuccino");
          notifications.push(
            toast("A little cloud in a cup", "Cappuccino unlocked.", "upgrade"),
          );
        }
        if (s.lifetimeEarned < 30 && s.lifetimeEarned + amount >= 30)
          notifications.push(
            toast(
              "A tiny helping hand",
              "Mochi is now available in the shop.",
              "upgrade",
            ),
          );
        if (visits === 3)
          notifications.push(
            toast("A familiar face", `${customer.name} is now a regular.`),
          );
        const business = {
          ...s.business,
          lifetimeServed: s.business.lifetimeServed + 1,
          xp: s.business.xp + (perfect ? 35 : 20),
          tips: s.business.tips + tip,
          pastries: s.business.pastries - (pastry ? 1 : 0),
          pastrySales: s.business.pastrySales + (pastry ? 2.5 : 0),
          ingredientCost: s.business.ingredientCost + (pastry ? 1 : 0),
          claimed: [...s.business.claimed],
        };
        let reward = 0;
        for (const goal of dailyGoals(
          s.served + 1,
          s.perfect + (perfect ? 1 : 0),
          s.revenue + amount,
        )) {
          if (
            goal.value >= goal.target &&
            !business.claimed.includes(goal.id)
          ) {
            business.claimed.push(goal.id);
            reward += goal.reward;
            notifications.push(
              toast(
                "Evening goal complete",
                `${goal.title} · +$${goal.reward}`,
                "upgrade",
              ),
            );
          }
        }
        business.rewards += reward;
        if (level(business.xp) > level(s.business.xp))
          notifications.push(
            toast(
              "Barista level up",
              `Level ${level(business.xp)} · More confidence, one cup at a time.`,
              "upgrade",
            ),
          );
        for (const [id, target] of [
          ["americano", 8],
          ["flatwhite", 14],
        ] as const)
          if (business.lifetimeServed >= target && !unlocked.includes(id)) {
            unlocked.push(id);
            notifications.push(
              toast(
                "Recipe discovered",
                `${recipeById(id).name} joins your menu.`,
                "upgrade",
              ),
            );
          }
        set({
          business,
          money: Math.round((s.money + amount + reward) * 100) / 100,
          revenue: s.revenue + amount,
          lifetimeEarned: s.lifetimeEarned + amount,
          served: s.served + 1,
          perfect: s.perfect + (perfect ? 1 : 0),
          reputation: Math.min(100, s.reputation + 1),
          newRegulars: s.newRegulars + (visits === 3 ? 1 : 0),
          familiarity: { ...s.familiarity, [v.id]: visits },
          unlocked,
          drinkCounts: {
            ...s.drinkCounts,
            [v.recipe]: s.drinkCounts[v.recipe] + 1,
          },
          tray: null,
          visitors: s.visitors.map((c) =>
            c.uid === uid
              ? {
                  ...c,
                  phase: "receiving",
                  age: 0,
                  paid: true,
                  pastry,
                  art: s.tray?.art,
                  payment: amount,
                }
              : c,
          ),
          toasts: [...s.toasts.slice(-2), ...notifications],
        });
        audio.play("cup");
        audio.play("payment");
      },
      buy: (id) => {
        const s = get();
        const u = upgrades.find((u) => u.id === id);
        if (!u || s.purchased.includes(id)) return;
        if (u.earnings && s.lifetimeEarned < u.earnings) {
          s.notify(
            "A little further to go",
            `Earn $${u.earnings} from coffee to unlock this.`,
          );
          return;
        }
        if (s.money < u.price) {
          s.notify(
            "Keep the coffee flowing",
            `You need $${(u.price - s.money).toFixed(2)} more.`,
          );
          return;
        }
        set({
          money: s.money - u.price,
          purchased: [...s.purchased, id],
          reputation: Math.min(100, s.reputation + 2),
          toasts: [
            ...s.toasts.slice(-2),
            toast(
              id === "mochi" ? "Hello, Mochi!" : "Feels more like home",
              u.name,
              "upgrade",
            ),
          ],
        });
        audio.play("upgrade");
      },
      updateSettings: (settings) => {
        set((s) => ({ settings: { ...s.settings, ...settings } }));
        audio.update(get().settings);
      },
      tick: (dt) => {
        const s = get();
        if (
          (s.phase !== "playing" && s.phase !== "closing") ||
          s.paused ||
          s.settingsOpen ||
          s.help ||
          s.managementOpen ||
          document.hidden
        )
          return;
        let brew = { ...s.brew };
        let business = {
          ...s.business,
          dirtySeats: [...s.business.dirtySeats],
        };
        if (brew.stage === "grinding") {
          brew.ground = Math.min(brew.dose, brew.ground + dt * 6);
          brew.progress = brew.ground / brew.dose;
          if (brew.ground >= brew.dose) {
            brew.stage = "dosed";
            audio.stopMachines();
            audio.play("ready");
          }
        }
        if (brew.stage === "tamping") brew.tampTime += dt;
        if (brew.stage === "cleaning") {
          brew.progress += dt / 2;
          if (brew.progress >= 1) {
            business.cleanliness = 100;
            brew = freshBrew(brew.recipe, brew.practice);
            audio.play("ready");
          }
        }
        if (brew.stage === "extracting") {
          brew.shotTime += dt * 5;
          brew.yield += flowRate(brew) * dt * 5;
          brew.progress = Math.min(1, brew.yield / (brew.dose * 2));
          if (
            (business.guided && brew.yield >= brew.dose * 2) ||
            brew.shotTime >= 55 ||
            brew.yield >= brew.dose * 3
          ) {
            if (business.guided && brew.yield >= brew.dose * 2) {
              brew.yield = brew.dose * 2;
              brew.shotTime = brew.yield / flowRate(brew);
            }
            brew = finishShot(brew);
            audio.stopMachines();
            audio.play("ready");
          }
        }
        if (brew.stage === "steaming") {
          brew.milk = Math.min(1, brew.milk + dt / 4);
          if (brew.milk >= 1) {
            brew = finishMilk(brew);
            audio.stopMachines();
            audio.play("ready");
          }
        }
        const notices = s.toasts
          .map((t) => ({ ...t, age: t.age + dt }))
          .filter((t) => t.age < 6.5);
        if (brew.practice) {
          set({ brew, business, toasts: notices });
          return;
        }
        const elapsed = Math.min(SHIFT_SECONDS, s.elapsed + dt);
        for (const visitor of s.visitors)
          if (
            visitor.paid &&
            visitor.phase === "leaving" &&
            visitor.age + dt > 12 &&
            !business.dirtySeats.includes(visitor.seat)
          )
            business.dirtySeats.push(visitor.seat);
        if (
          s.purchased.includes("mochi") &&
          business.dirtySeats.length &&
          Math.floor(elapsed / 12) !== Math.floor(s.elapsed / 12)
        )
          business.dirtySeats.shift();
        let followers = s.followers;
        let reputation = s.reputation;
        let posts = [...s.posts];
        let visitors = s.visitors
          .map((v) => {
            let next = { ...v, age: v.age + dt };
            if (next.phase === "entering" && next.age > 4)
              next = { ...next, phase: "queueing", age: 0 };
            else if (next.phase === "queueing" && next.age > 2.5)
              next = { ...next, phase: "ordering", age: 0 };
            else if (next.phase === "ordering" && next.age > 5 && next.accepted)
              next = { ...next, phase: "waiting", age: 0 };
            else if (next.phase === "receiving" && next.age > 1.8)
              next = { ...next, phase: "findingSeat", age: 0 };
            else if (next.phase === "findingSeat" && next.age > 2)
              next = { ...next, phase: "sitting", age: 0 };
            else if (next.phase === "sitting" && next.age > 3)
              next = { ...next, phase: "activity", age: 0 };
            else if (next.phase === "activity" && next.age > 65)
              next = { ...next, phase: "leaving", age: 0 };
            if (next.phase === "activity" && next.age > 6 && !next.posted) {
              next.posted = true;
              const def = customerById(next.id);
              const style = styleScores(s.purchased)[def.style];
              const shouldPost =
                Math.random() < Math.min(1, def.postChance + style / 200) ||
                s.posts.length === 0;
              if (shouldPost) {
                const themes: Post["theme"][] = ["coffee", "rain"];
                if (s.purchased.length) themes.push("decor");
                if (s.purchased.includes("sofa")) themes.push("cat");
                const theme = themes[(next.uid - 1) % themes.length];
                const templates = {
                  rain:
                    def.id === "yuna"
                      ? "Found the nicest place to study tonight. Rain on the windows, coffee in my hands. ☕"
                      : "Rain on the windows, something warm in my hands. Exactly where I needed to be tonight. ☕",
                  coffee:
                    "A little cup of comfort after a very long day. This place gets it.",
                  cat: "Came for the coffee. Staying for Milo. He has absolutely claimed the sofa. 🐾",
                  decor:
                    "The warm lights. The little plants. Someone really cares about this place.",
                };
                const likes = 24 + Math.floor(Math.random() * 70) + style;
                const gained = 3 + Math.floor(likes / 20);
                posts.unshift({
                  id: Date.now() + next.uid,
                  customer: next.id,
                  text:
                    (s.familiarity[next.id] ?? 0) >= 3
                      ? "My usual spot. My usual coffee. It feels good to be known. ☕"
                      : templates[theme],
                  likes,
                  theme,
                  time: "just now",
                });
                followers += gained;
                reputation = Math.min(100, reputation + 1);
                notices.push(
                  toast(
                    "A little love on CafeGram",
                    `@${def.handle} shared your café. +${gained} followers`,
                    "social",
                  ),
                );
              }
            }
            return next;
          })
          .filter((v) => !(v.phase === "leaving" && v.age > 12));
        let arrivalTimer = s.arrivalTimer - dt;
        let serial = s.visitorSerial;
        if (
          s.phase === "playing" &&
          elapsed < SHIFT_SECONDS - 40 &&
          arrivalTimer <= 0 &&
          visitors.length < 6
        ) {
          const rotated = [
            ...customers.slice(serial % customers.length),
            ...customers.slice(0, serial % customers.length),
          ];
          const def = rotated.find((c) => !visitors.some((v) => v.id === c.id));
          if (def) {
            const freeSeats = customers
              .map((c) => c.seat)
              .filter((seat) => !visitors.some((v) => v.seat === seat));
            const seat = freeSeats.includes(def.seat) ? def.seat : freeSeats[0];
            const extra =
              s.shift >= 2 && serial % 4 === 2
                ? s.unlocked.includes("flatwhite")
                  ? "flatwhite"
                  : "americano"
                : def.drink;
            const drink = s.unlocked.includes(extra) ? extra : "espresso";
            serial++;
            visitors.push({
              uid: serial,
              id: def.id,
              seat,
              recipe: drink,
              pastry:
                business.pastryMenu &&
                serial % 2 === 0 &&
                business.pastries > 0,
              quotedPrice: sellingPrice(drink, business.pricing),
              phase: "entering",
              age: 0,
              accepted: (s.familiarity[def.id] ?? 0) < 3,
              paid: false,
              posted: false,
            });
            audio.play("door");
            arrivalTimer =
              s.event === "rain"
                ? 19
                : Math.max(
                    24,
                    37 -
                      reputation / 8 -
                      styleScores(s.purchased)[def.style] / 12 +
                      (business.pricing === "premium"
                        ? 6
                        : business.pricing === "friendly"
                          ? -4
                          : 0) +
                      business.dirtySeats.length * 2,
                  );
          }
        }
        let event = s.event;
        let eventAge = s.eventAge + dt;
        const eventsDone = [...s.eventsDone];
        const schedule = [150, 330, 510];
        const index = schedule.findIndex(
          (at, i) => elapsed >= at && !eventsDone.includes(i),
        );
        if (index >= 0) {
          eventsDone.push(index);
          event = (["rain", "flicker", "viral"] as const)[index];
          eventAge = 0;
          if (event === "rain") {
            audio.setRain(true);
            notices.push(
              toast(
                "The rain is coming down",
                "A few more people are looking for somewhere warm.",
              ),
            );
            arrivalTimer = 3;
          }
          if (event === "flicker")
            notices.push(
              toast(
                "A little flicker",
                "The city blinks. The coffee keeps flowing.",
              ),
            );
          if (event === "viral") {
            if (posts.length) {
              posts[0] = { ...posts[0], likes: posts[0].likes + 600 };
              followers += 60;
              notices.push(
                toast(
                  "Your café is trending!",
                  "A little corner of the internet found you. +60 followers",
                  "social",
                ),
              );
            } else
              notices.push(
                toast(
                  "A rainy night worth sharing",
                  "Serve a drink to inspire your first CafeGram post.",
                  "social",
                ),
              );
          }
        }
        if (
          (event === "rain" && eventAge > 65) ||
          (event === "flicker" && eventAge > 5) ||
          (event === "viral" && eventAge > 7)
        ) {
          event = "none";
          audio.setRain(false);
        }
        let money = s.money;
        let phase: Phase = s.phase;
        let closingAge = s.closingAge;
        if (elapsed >= SHIFT_SECONDS && s.phase === "playing") {
          phase = "closing";
          audio.setClosing(true);
          notices.push(
            toast(
              "One last goodnight",
              "The door is closed to new arrivals. Thank you for tonight.",
            ),
          );
        }
        if (phase === "closing") {
          closingAge += dt;
          visitors = visitors.map((v) =>
            v.phase !== "leaving"
              ? { ...v, phase: "leaving" as const, age: 0 }
              : v,
          );
          if (visitors.length === 0 && closingAge > 8) {
            phase = "summary";
            if (!business.overheadPaid) {
              money = Math.round((money - overhead(business)) * 100) / 100;
              business.overheadPaid = true;
            }
            audio.stopMachines();
            audio.play("bell");
          }
        }
        set({
          business,
          money,
          elapsed,
          arrivalTimer,
          visitorSerial: serial,
          visitors,
          brew,
          toasts: notices.slice(-5),
          posts: posts.slice(0, 24),
          followers,
          reputation,
          event,
          eventAge,
          eventsDone,
          phase,
          closingAge,
          inProgress: phase !== "summary",
          workstation: phase === "playing" ? s.workstation : false,
          phone: phase === "summary" ? false : s.phone,
        });
      },
    }),
    {
      name: "after-hours-cafe-v1",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        business: s.business,
        hasSave: s.hasSave,
        inProgress: s.inProgress,
        money: s.money,
        reputation: s.reputation,
        followers: s.followers,
        shift: s.shift,
        lifetimeEarned: s.lifetimeEarned,
        unlocked: s.unlocked,
        purchased: s.purchased,
        familiarity: s.familiarity,
        posts: s.posts,
        elapsed: s.elapsed,
        arrivalTimer: s.arrivalTimer,
        visitorSerial: s.visitorSerial,
        visitors: s.visitors,
        revenue: s.revenue,
        served: s.served,
        perfect: s.perfect,
        newRegulars: s.newRegulars,
        followerStart: s.followerStart,
        drinkCounts: s.drinkCounts,
        tray: s.tray,
        brew: s.brew.practice ? freshBrew() : s.brew,
        eventsDone: s.eventsDone,
        settings: s.settings,
      }),
      merge: mergeSave,
    },
  ),
);
