import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGame } from "./game";
import { freshBrew, finishShot, finishMilk, flowRate } from "../game/craft";
import { freshBusiness, shiftProfit } from "../game/business";
const stored = new Map<string, string>();
vi.stubGlobal("document", { hidden: false });
vi.stubGlobal("localStorage", {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => stored.set(key, value),
  removeItem: (key: string) => stored.delete(key),
});
const advance = (seconds: number) => {
  for (let i = 0; i < Math.ceil(seconds * 10); i++)
    useGame.getState().tick(0.1);
};
const order = () => ({
  uid: 1,
  id: "minho",
  seat: 2,
  recipe: "espresso" as const,
  phase: "waiting" as const,
  age: 0,
  accepted: true,
  paid: false,
  posted: false,
});
beforeEach(() => {
  stored.clear();
  useGame.getState().newGame();
});
describe("Coffee that teaches", () => {
  it("connects grind direction to flow and meaningful taste feedback", () => {
    const normal = freshBrew();
    const coarse = { ...normal, grind: 9 };
    const fine = { ...normal, grind: 1 };
    expect(flowRate(coarse)).toBeGreaterThan(flowRate(normal));
    expect(flowRate(fine)).toBeLessThan(flowRate(normal));
    expect(finishShot({ ...normal, yield: 36, shotTime: 28 }).score).toBe(100);
    expect(
      finishShot({ ...coarse, yield: 36, shotTime: 36 / flowRate(coarse) })
        .feedback,
    ).toContain("finer");
    expect(
      finishShot({ ...fine, yield: 36, shotTime: 36 / flowRate(fine) })
        .feedback,
    ).toContain("coarser");
    expect(
      finishShot({ ...normal, yield: 15, shotTime: 12 }).feedback,
    ).toContain("short");
  });
  it("distinguishes sweet milk from overheated milk and requires a pour", () => {
    expect(finishMilk({ ...freshBrew("latte"), milk: 0.75 }).quality).toBe(
      "perfect",
    );
    expect(finishMilk({ ...freshBrew("latte"), milk: 1 }).quality).toBe(
      "lovely",
    );
    expect(finishMilk({ ...freshBrew("latte"), milk: 0.75 }).stage).toBe(
      "pour",
    );
  });
  it("charges inventory once, records waste, and keeps cash purchase accounting separate", () => {
    useGame.setState({
      workstation: true,
      brew: { ...freshBrew("latte"), stage: "locked" },
    });
    useGame.getState().placeCup();
    useGame.getState().placeCup();
    expect(useGame.getState().business.beans).toBe(11);
    expect(useGame.getState().business.milk).toBe(7);
    expect(useGame.getState().business.ingredientCost).toBe(1.4);
    expect(useGame.getState().money).toBe(50);
    useGame.getState().restartBrew();
    expect(useGame.getState().business.ingredientCost).toBe(1.4);
    useGame.getState().restock("milk");
    expect(useGame.getState().money).toBe(44);
    expect(useGame.getState().business.milk).toBe(17);
  });
  it("lets practice advance brewing while stopping café time, supplies, revenue and XP", () => {
    useGame.getState().startPractice();
    useGame.getState().craftStep();
    advance(3.2);
    expect(useGame.getState().brew.stage).toBe("dosed");
    expect(useGame.getState().elapsed).toBe(0);
    useGame.getState().craftStep();
    useGame.getState().craftStep();
    useGame.getState().craftStep();
    useGame.getState().extract();
    advance(6);
    useGame.getState().takeDrink();
    const s = useGame.getState();
    expect(s.business.practiceCount).toBe(1);
    expect(s.business.best.espresso).toBe(100);
    expect(s.business.beans).toBe(12);
    expect(s.business.ingredientCost).toBe(0);
    expect(s.tray).toBeNull();
    expect(s.business.xp).toBe(0);
    expect(s.money).toBe(50);
  });
  it("does not turn a saved practice cup into a free drink for sale", async () => {
    useGame.getState().startPractice();
    useGame.setState({
      brew: {
        ...freshBrew("espresso", true),
        stage: "ready",
        yield: 36,
        shotTime: 28,
      },
    });
    await useGame.persist.rehydrate();
    expect(useGame.getState().brew.stage).toBe("empty");
    expect(useGame.getState().brew.practice).toBe(false);
  });
});
describe("A restaurant with real decisions", () => {
  it("keeps quoted prices and earns pastry margin, tips and rewards exactly once", () => {
    useGame.setState({
      visitors: [{ ...order(), quotedPrice: 5, pastry: true }],
      tray: { recipe: "espresso", quality: "perfect" },
      business: { ...freshBusiness(), pricing: "friendly" },
    });
    useGame.getState().serve(1);
    useGame.getState().serve(1);
    const s = useGame.getState();
    expect(s.revenue).toBe(8.5);
    expect(s.money).toBe(58.5);
    expect(s.business.pastries).toBe(5);
    expect(s.business.ingredientCost).toBe(1);
    expect(s.business.tips).toBe(1);
    for (let i = 0; i < 2; i++) {
      useGame.setState({
        visitors: [order()],
        tray: { recipe: "espresso", quality: "perfect" },
      });
      useGame.getState().serve(1);
    }
    const complete = useGame.getState();
    expect(complete.business.claimed).toEqual(
      expect.arrayContaining(["welcome", "craft"]),
    );
    expect(complete.business.rewards).toBe(13);
    useGame.setState({
      visitors: [order()],
      tray: { recipe: "espresso", quality: "perfect" },
    });
    useGame.getState().serve(1);
    expect(useGame.getState().business.rewards).toBe(13);
  });
  it("prevents a stock-and-cash dead end and restores negative balances", async () => {
    useGame.setState({
      money: 0,
      business: { ...freshBusiness(), beans: 0, milk: 0 },
    });
    useGame.getState().restock("beans");
    expect(useGame.getState().money).toBe(-8);
    expect(useGame.getState().business.beans).toBe(10);
    await useGame.persist.rehydrate();
    expect(useGame.getState().money).toBe(-8);
    expect(useGame.getState().business.beans).toBe(10);
  });
  it("calculates profit independently of deliveries and goal cash", () => {
    expect(
      shiftProfit(30, {
        ...freshBusiness(),
        ingredientCost: 4,
        rewards: 13,
        supplySpend: 8,
      }),
    ).toBe(18);
  });
  it("pays closing costs once, buys ownership once, and removes future rent", () => {
    useGame.setState({ money: 600 });
    useGame.getState().buyCafe();
    useGame.getState().buyCafe();
    expect(useGame.getState().money).toBe(100);
    useGame.setState({
      phase: "closing",
      elapsed: 720,
      closingAge: 9,
      visitors: [],
    });
    advance(0.1);
    expect(useGame.getState().money).toBe(97);
    expect(useGame.getState().business.overheadPaid).toBe(true);
    advance(2);
    expect(useGame.getState().money).toBe(97);
    useGame.getState().nextShift();
    expect(useGame.getState().business.owned).toBe(true);
    expect(useGame.getState().business.overheadPaid).toBe(false);
  });
  it("clears real table dirt manually and through the purchased robot", () => {
    useGame.setState({
      purchased: ["mochi"],
      elapsed: 11.9,
      business: { ...freshBusiness(), dirtySeats: [0, 1] },
    });
    advance(0.2);
    expect(useGame.getState().business.dirtySeats).toEqual([1]);
    useGame.getState().busTables();
    expect(useGame.getState().business.dirtySeats).toEqual([]);
  });
});
