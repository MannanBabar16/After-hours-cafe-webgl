import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGame } from "./game";
import type { Visitor } from "./game";
import { SHIFT_SECONDS, clockText } from "../data/content";
const stored = new Map<string, string>();
vi.stubGlobal("document", { hidden: false });
vi.stubGlobal("localStorage", {
  getItem: (k: string) => stored.get(k) ?? null,
  setItem: (k: string, v: string) => stored.set(k, v),
  removeItem: (k: string) => stored.delete(k),
});
const advance = (seconds: number) => {
  for (let i = 0; i < seconds * 10; i++) useGame.getState().tick(0.1);
};
const prepare = () => {
  const s = useGame.getState();
  s.craftStep();
  advance(3.2); // Grind the measured dose.
  s.craftStep();
  s.craftStep();
  s.craftStep(); // Distribute, tamp, lock and place.
  s.extract();
};
const guest = (recipe: Visitor["recipe"] = "espresso", visits = 0): Visitor => {
  useGame.setState({ familiarity: { minho: visits } });
  return {
    uid: 1,
    id: "minho",
    seat: 2,
    recipe,
    phase: "waiting",
    age: 0,
    accepted: true,
    paid: false,
    posted: false,
  };
};
beforeEach(() => {
  stored.clear();
  vi.spyOn(Math, "random").mockReturnValue(0);
  useGame.getState().newGame();
  useGame.setState({ paused: false, settingsOpen: false, help: false });
});
describe("An evening at After Hours", () => {
  it("makes espresso and prevents replacing a drink already on the tray", () => {
    const s = useGame.getState();
    s.openWorkstation();
    prepare();
    advance(6);
    expect(useGame.getState().brew.stage).toBe("ready");
    s.takeDrink();
    expect(useGame.getState().tray?.recipe).toBe("espresso");
    s.openWorkstation();
    expect(useGame.getState().workstation).toBe(false);
  });
  it("pays exactly once and unlocks recipes from completed service", () => {
    useGame.setState({
      visitors: [guest()],
      tray: { recipe: "espresso", quality: "perfect" },
    });
    useGame.getState().serve(1);
    useGame.getState().serve(1);
    expect(useGame.getState().money).toBe(55);
    expect(useGame.getState().served).toBe(1);
    expect(useGame.getState().unlocked).toContain("latte");
    for (let i = 0; i < 2; i++) {
      useGame.setState({
        visitors: [guest()],
        tray: { recipe: "espresso", quality: "perfect" },
      });
      useGame.getState().serve(1);
    }
    expect(useGame.getState().unlocked).toContain("cappuccino");
  });
  it("keeps the tray and bank unchanged when the wrong drink is offered", () => {
    useGame.setState({
      visitors: [guest("latte")],
      tray: { recipe: "espresso", quality: "perfect" },
    });
    useGame.getState().serve(1);
    expect(useGame.getState().money).toBe(50);
    expect(useGame.getState().tray?.recipe).toBe("espresso");
    expect(useGame.getState().served).toBe(0);
  });
  it("rewards the milk timing window and requires cappuccino foam", () => {
    useGame.setState({ unlocked: ["espresso", "latte", "cappuccino"] });
    useGame.getState().openWorkstation();
    useGame.getState().selectRecipe("cappuccino");
    prepare();
    advance(6);
    expect(useGame.getState().brew.stage).toBe("purge");
    useGame.getState().craftStep();
    expect(useGame.getState().brew.stage).toBe("milk");
    useGame.getState().steam(true);
    advance(3);
    useGame.getState().steam(false);
    expect(useGame.getState().brew.stage).toBe("foam");
    expect(useGame.getState().brew.quality).toBe("perfect");
    useGame.getState().addFoam();
    expect(useGame.getState().brew.stage).toBe("ready");
  });
  it("prevents duplicate, unaffordable, and locked purchases", () => {
    useGame.getState().buy("mochi");
    expect(useGame.getState().money).toBe(50);
    useGame.getState().buy("plant");
    useGame.getState().buy("plant");
    expect(useGame.getState().money).toBe(38);
    expect(useGame.getState().purchased).toEqual(["plant"]);
    useGame.getState().buy("sofa");
    expect(useGame.getState().money).toBe(38);
    useGame.setState({ lifetimeEarned: 30, money: 45 });
    useGame.getState().buy("mochi");
    expect(useGame.getState().money).toBe(0);
    expect(useGame.getState().purchased).toContain("mochi");
  });
  it("turns familiarity into regulars and generates social posts after service", () => {
    useGame.setState({
      visitors: [guest("espresso", 2)],
      tray: { recipe: "espresso", quality: "perfect" },
    });
    useGame.getState().serve(1);
    advance(14);
    expect(useGame.getState().newRegulars).toBe(1);
    expect(useGame.getState().familiarity.minho).toBe(3);
    expect(useGame.getState().posts[0]?.text).toContain("known");
    expect(useGame.getState().followers).toBeGreaterThan(24);
  });
  it("finishes the shift, drains the café, and keeps progress into another night", () => {
    useGame.getState().buy("plant");
    advance(SHIFT_SECONDS + 20);
    expect(useGame.getState().phase).toBe("summary");
    expect(useGame.getState().visitors).toHaveLength(0);
    expect(clockText(SHIFT_SECONDS)).toBe("2:00 AM");
    useGame.getState().nextShift();
    expect(useGame.getState().shift).toBe(2);
    expect(useGame.getState().money).toBe(30);
    expect(useGame.getState().purchased).toContain("plant");
    expect(useGame.getState().elapsed).toBe(0);
  });
  it("stops simulation during a pause and settings", () => {
    useGame.setState({ paused: true });
    advance(5);
    expect(useGame.getState().elapsed).toBe(0);
    useGame.setState({ paused: false, settingsOpen: true });
    advance(5);
    expect(useGame.getState().elapsed).toBe(0);
  });
  it("restores durable progress and opens at the title after rehydration", async () => {
    useGame.getState().buy("plant");
    advance(15);
    const saved = stored.get("after-hours-cafe-v1");
    expect(saved).toBeTruthy();
    useGame.setState({ money: 900, purchased: [] });
    stored.set("after-hours-cafe-v1", saved!);
    await useGame.persist.rehydrate();
    expect(useGame.getState().phase).toBe("title");
    expect(useGame.getState().money).toBe(38);
    expect(useGame.getState().purchased).toEqual(["plant"]);
    useGame.getState().continueGame();
    expect(useGame.getState().phase).toBe("playing");
  });
  it("recovers safely from a malformed save", async () => {
    stored.set(
      "after-hours-cafe-v1",
      JSON.stringify({
        version: 1,
        state: { money: "broken", elapsed: 0, unlocked: [], visitors: [] },
      }),
    );
    await useGame.persist.rehydrate();
    expect(useGame.getState().money).toBe(50);
  });
});
