import { orderFocusBias } from "../game/focus";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../game/audio", () => ({
  audio: {
    play: vi.fn(),
    machine: vi.fn(),
    stopMachines: vi.fn(),
    setClosing: vi.fn(),
    setRain: vi.fn(),
    update: vi.fn(),
  },
}));
import { useGame, prepareCookieTray } from "./game";
import { makeOrder, totalOrder } from "./operationsLogic";
import { products, caps } from "../data/operations";
import type { ProductId, SupplyId } from "../data/operations";
import { mergeBusinessSave } from "./persistence";
import type { GameState } from "./game";
import type { Order } from "./operationTypes";

const state = () => useGame.getState();
function advance(seconds: number) {
  for (let i = 0; i < Math.ceil(seconds * 10); i++) state().tick(0.1);
}
function order(channel: Order["channel"], requested: [ProductId, number][]) {
  const s = state();
  const made = makeOrder(s, channel);
  made.order.lines = requested.map(([product, quantity]) => ({
    product,
    quantity,
    delivered: 0,
    price: products[product].price,
  }));
  made.order.vehiclePhase = "waiting";
  made.order.vehicleZ = 0;
  useGame.setState({
    ops: { ...s.ops, orders: [...s.ops.orders, made.order] },
    visitors: made.visitor
      ? [...s.visitors, { ...made.visitor, phase: "ordering" }]
      : s.visitors,
  });
  state().acceptOrder(made.order.id);
  return made.order.id;
}
function brew(
  recipe: "espresso" | "latte" | "cappuccino" | "americano" = "latte",
) {
  state().interactStation("cups");
  state().interactStation("machine");
  state().startBrew(recipe);
  advance(6);
  state().interactStation("machine");
}
beforeEach(() => {
  state().newGame();
  useGame.setState({
    paused: false,
    settingsOpen: false,
    help: false,
    phone: false,
    debugOpen: false,
  });
});

describe("one connected café business", () => {
  it("requires a dispenser cup and consumes latte ingredients exactly once", () => {
    const before = { ...state().ops.containers };
    state().startBrew("latte");
    expect(state().ops.machine.stage).toBe("empty");
    expect(state().ops.containers).toEqual(before);
    state().interactStation("cups");
    expect(state().ops.containers.cups).toBe(before.cups - 1);
    state().interactStation("machine");
    state().startBrew("latte");
    expect(state().ops.containers.beans).toBe(before.beans - 1);
    expect(state().ops.containers.milk).toBe(before.milk - 2);
    state().startBrew("latte");
    expect(state().ops.containers.milk).toBe(before.milk - 2);
    advance(6);
    expect(state().ops.machine.stage).toBe("ready");
    state().interactStation("machine");
    expect(state().carry?.kind).toBe("product");
    expect(state().ops.machine.stage).toBe("empty");
  });
  it("fulfills a latte order and rejects duplicate payment", () => {
    const id = order("indoor", [["latte", 1]]);
    const cash = state().money;
    brew();
    state().serve(id);
    expect(state().money).toBeGreaterThan(cash + 6);
    expect(state().served).toBe(1);
    const paid = state().money;
    state().serve(id);
    expect(state().money).toBe(paid);
  });
  it("keeps wrong products in the player’s hand", () => {
    const id = order("indoor", [["latte", 1]]);
    brew("espresso");
    const carry = state().carry;
    state().serve(id);
    expect(state().carry).toEqual(carry);
    expect(state().served).toBe(0);
  });
  it("leaves a multi-item order unpaid after partial fulfillment", () => {
    const id = order("indoor", [
      ["latte", 1],
      ["cookie", 1],
    ]);
    const cash = state().money;
    brew();
    state().serve(id);
    const o = state().ops.orders.find((o) => o.id === id)!;
    expect(o.lines[0].delivered).toBe(1);
    expect(o.paid).toBe(false);
    expect(state().money).toBe(cash);
  });
  it("cannot brew with insufficient milk and keeps the placed cup", () => {
    useGame.setState({
      ops: {
        ...state().ops,
        containers: { ...state().ops.containers, milk: 1 },
      },
    });
    state().interactStation("cups");
    state().interactStation("machine");
    const beans = state().ops.containers.beans;
    state().startBrew("latte");
    expect(state().ops.machine.stage).toBe("cup");
    expect(state().ops.containers.beans).toBe(beans);
  });
  it("keeps machines working while the player uses the phone", () => {
    state().interactStation("cups");
    state().interactStation("machine");
    state().startBrew("latte");
    state().togglePhone("Supply");
    advance(6);
    expect(state().ops.machine.stage).toBe("ready");
    expect(state().phone).toBe(true);
  });
  it("pauses brewing, oven, and delivery timers together", () => {
    state().orderSupplies({ milk: 1 });
    state().interactStation("cups");
    state().interactStation("machine");
    state().startBrew("latte");
    useGame.setState({ paused: true });
    const before = state().ops.machine.elapsed;
    advance(10);
    expect(state().ops.machine.elapsed).toBe(before);
    expect(state().ops.shipments[0].age).toBe(0);
  });
  it("orders real boxes without magically refilling a container", () => {
    const milk = state().ops.containers.milk;
    const boxes = state().ops.boxes.length;
    const cash = state().money;
    state().orderSupplies({ milk: 1, cups: 1 });
    expect(state().money).toBe(cash - 8);
    expect(state().ops.containers.milk).toBe(milk);
    expect(state().ops.boxes).toHaveLength(boxes);
    advance(17);
    expect(state().ops.boxes).toHaveLength(boxes + 2);
    expect(
      state()
        .ops.boxes.filter((b) => b.location === "delivery")
        .map((b) => b.supply),
    ).toEqual(["milk", "cups"]);
  });
  it("delivered milk can be carried and transferred without duplication", () => {
    useGame.setState({
      ops: {
        ...state().ops,
        containers: { ...state().ops.containers, milk: 2 },
      },
    });
    state().orderSupplies({ milk: 1 });
    advance(17);
    const box = state().ops.boxes.find(
      (b) => b.location === "delivery" && b.supply === "milk",
    )!;
    state().takeBox(box.id);
    state().refill("milk");
    expect(state().ops.containers.milk).toBe(8);
    expect(state().ops.boxes.find((b) => b.id === box.id)?.quantity).toBe(6);
    state().refill("milk");
    expect(state().ops.boxes.find((b) => b.id === box.id)?.quantity).toBe(6);
  });
  it("rejects incompatible refills and preserves both quantities", () => {
    const box = state().ops.boxes.find((b) => b.supply === "beans")!;
    state().takeBox(box.id);
    state().refill("milk");
    expect(state().ops.containers.milk).toBe(8);
    expect(state().ops.boxes.find((b) => b.id === box.id)?.quantity).toBe(20);
  });
  it("only disposes empty packaging, never a full supply box", () => {
    const box = state().ops.boxes[0];
    state().takeBox(box.id);
    state().interactStation("trash");
    expect(state().ops.boxes.some((b) => b.id === box.id)).toBe(true);
    expect(state().carry?.kind).toBe("box");
  });
  it("consumes dough, bakes a real batch, and moves it to display", () => {
    useGame.setState({ business: { ...state().business, lifetimeServed: 2 } });
    const dough = state().ops.containers.dough;
    prepareCookieTray();
    expect(state().ops.containers.dough).toBe(dough - 4);
    state().interactStation("oven");
    expect(state().ops.oven.stage).toBe("loaded");
    state().interactStation("oven");
    advance(21);
    state().interactStation("oven");
    state().interactStation("display");
    expect(state().ops.display.quantity).toBe(4);
    expect(state().carry).toBeNull();
    expect(state().ops.oven.stage).toBe("empty");
  });
  it("leaves plenty of grace time and marks neglected cookies less fresh", () => {
    useGame.setState({ business: { ...state().business, lifetimeServed: 2 } });
    prepareCookieTray();
    state().interactStation("oven");
    state().interactStation("oven");
    advance(50);
    expect(state().ops.oven.quality).toBe(1);
    advance(100);
    expect(state().ops.oven.quality).toBeLessThan(1);
  });
  it("display overflow stays on the carried tray instead of vanishing", () => {
    useGame.setState({
      carry: { kind: "bakingTray", quantity: 4, baked: true, quality: 1 },
      ops: { ...state().ops, display: { quantity: 11, quality: 1 } },
    });
    state().interactStation("display");
    expect(state().ops.display.quantity).toBe(12);
    expect(state().carry).toEqual({
      kind: "bakingTray",
      quantity: 3,
      baked: true,
      quality: 1,
    });
  });
  it("serves a drive-through espresso and two cookies for one payment", () => {
    const id = order("drive", [
      ["espresso", 1],
      ["cookie", 2],
    ]);
    brew("espresso");
    state().serve(id);
    expect(state().served).toBe(0);
    useGame.setState({
      ops: { ...state().ops, display: { quantity: 2, quality: 1 } },
    });
    state().interactStation("display");
    state().serve(id);
    expect(state().served).toBe(0);
    state().interactStation("display");
    state().serve(id);
    const paid = state().ops.orders.find((o) => o.id === id)!;
    expect(paid.paid).toBe(true);
    expect(paid.vehiclePhase).toBe("leaving");
    expect(state().served).toBe(1);
    advance(7);
    expect(state().ops.orders.some((o) => o.id === id)).toBe(false);
  });
  it("a drive-through queue maintains a safe vehicle gap", () => {
    state().debug("drive");
    state().debug("drive");
    advance(12);
    const cars = state().ops.orders.filter((o) => o.channel === "drive");
    expect(cars[0].vehicleZ).toBe(0);
    expect(cars[1].vehicleZ).toBeGreaterThanOrEqual(3.5);
  });
  it("Bomi transports a real product and receives no duplicate payment", () => {
    const id = order("indoor", [["latte", 1]]);
    useGame.setState({ money: 150 });
    state().buyEquipment("robot");
    brew();
    state().loadRobot();
    expect(state().carry).toBeNull();
    expect(state().ops.robot.items).toHaveLength(1);
    expect(state().served).toBe(0);
    advance(20);
    expect(state().ops.orders.find((o) => o.id === id)?.paid).toBe(true);
    expect(state().served).toBe(1);
    const cash = state().money;
    advance(20);
    expect(state().money).toBe(cash);
    expect(state().ops.robot.stage).toBe("idle");
  });
  it("does not dispatch Bomi to drive-through orders", () => {
    order("drive", [["latte", 1]]);
    useGame.setState({ money: 150 });
    state().buyEquipment("robot");
    brew();
    const carry = state().carry;
    state().loadRobot();
    expect(state().ops.robot.stage).toBe("idle");
    expect(state().carry).toEqual(carry);
  });
  it("capacity upgrades never add stock and charge the shared till", () => {
    const before = { ...state().ops.containers };
    const cash = state().money;
    state().buyEquipment("milkTank");
    expect(caps(state().ops.levels, "milkTank")).toBe(16);
    expect(state().ops.containers).toEqual(before);
    expect(state().money).toBe(cash - 28);
  });
  it("camera changes preserve carry, money, position and production", () => {
    state().takeBox(2);
    const before = {
      carry: state().carry,
      money: state().money,
      player: state().player,
      machine: state().ops.machine,
    };
    state().toggleCamera();
    expect(state().cameraMode).toBe("first");
    state().toggleCamera();
    expect(state().cameraMode).toBe("isometric");
    expect({
      carry: state().carry,
      money: state().money,
      player: state().player,
      machine: state().ops.machine,
    }).toEqual(before);
  });
  it("putting down and retrieving a box preserves its identity", () => {
    const id = state().ops.boxes[0].id;
    state().takeBox(id);
    state().drop();
    expect(state().carry).toBeNull();
    expect(state().ops.boxes.find((b) => b.id === id)?.location).toBe("floor");
    state().takeBox(id);
    expect(state().carry).toEqual({ kind: "box", boxId: id });
    expect(state().ops.boxes.filter((b) => b.id === id)).toHaveLength(1);
  });
  it("Mochi removes real spills after unlocking", () => {
    useGame.setState({
      purchased: ["mochi"],
      ops: { ...state().ops, spills: [{ id: 900, x: 2, z: 1, age: 0 }] },
    });
    advance(13);
    expect(state().ops.spills).toHaveLength(0);
  });
  it("price changes preserve already-quoted orders", () => {
    const id = order("indoor", [["latte", 1]]);
    state().setMenuPrice("latte", 10);
    expect(totalOrder(state().ops.orders.find((o) => o.id === id)!)).toBe(6);
  });
  it("supplier credit is small and cannot become unlimited shopping", () => {
    useGame.setState({
      money: 0,
      ops: {
        ...state().ops,
        containers: { ...state().ops.containers, beans: 0 },
      },
    });
    state().orderSupplies({ beans: 1 });
    expect(state().money).toBe(-7);
    state().orderSupplies({ beans: 5 });
    expect(state().money).toBe(-7);
  });
  it("counts pending deliveries against the physical box limit", () => {
    useGame.setState({ money: 1000 });
    state().orderSupplies({ beans: 5, milk: 5, cups: 5, dough: 5, syrup: 5 });
    const cash = state().money;
    state().orderSupplies({ beans: 5, milk: 5, cups: 5, dough: 5, syrup: 5 });
    expect(state().money).toBe(cash);
    expect(state().ops.shipments).toHaveLength(1);
  });
  it("large paid deliveries unload within the walkable frontage", () => {
    useGame.setState({ money: 1000 });
    state().orderSupplies({ beans: 5, milk: 5, cups: 5, dough: 5, syrup: 5 });
    advance(17);
    const boxes = state().ops.boxes.filter((b) => b.location === "delivery");
    expect(boxes).toHaveLength(25);
    expect(
      boxes.every(
        (b) => b.x >= -5.5 && b.x <= 5.6 && b.z >= 4.55 && b.z <= 6.7,
      ),
    ).toBe(true);
  });
  it("does not consume a product already reserved for Bomi", () => {
    const id = order("indoor", [["latte", 1]]);
    useGame.setState({ money: 200 });
    state().buyEquipment("robot");
    brew();
    state().interactStation("handoff");
    brew();
    state().loadRobot();
    state().interactStation("handoff");
    const carry = state().carry;
    state().serve(id);
    expect(state().carry).toEqual(carry);
    expect(state().served).toBe(0);
    advance(20);
    expect(state().served).toBe(1);
  });
  it("robot partial service can be finished manually for one payment", () => {
    const id = order("indoor", [
      ["latte", 1],
      ["cookie", 1],
    ]);
    useGame.setState({ money: 200 });
    state().buyEquipment("robot");
    brew();
    state().loadRobot();
    advance(20);
    expect(state().served).toBe(0);
    useGame.setState({
      ops: { ...state().ops, display: { quantity: 1, quality: 1 } },
    });
    state().interactStation("display");
    state().serve(id);
    expect(state().served).toBe(1);
    const cash = state().money;
    advance(20);
    expect(state().money).toBe(cash);
  });
  it("ownership is included in investment spending", () => {
    useGame.setState({ money: 600 });
    state().buyCafe();
    expect(state().money).toBe(100);
    expect(state().ops.upgradeSpend).toBe(500);
  });
});

describe("save migration and hostile/malformed saves", () => {
  it("preserves physical stock and partially used boxes across a save merge", () => {
    useGame.setState({
      ops: {
        ...state().ops,
        containers: { ...state().ops.containers, milk: 3 },
      },
    });
    state().takeBox(2);
    state().refill("milk");
    state().buyEquipment("milkTank");
    const saved = JSON.parse(JSON.stringify(state()));
    const merged = mergeBusinessSave(saved, state());
    expect(merged.ops.containers.milk).toBe(8);
    expect(merged.ops.levels.milkTank).toBe(1);
    expect(merged.ops.boxes.find((b) => b.id === 2)?.quantity).toBe(7);
    expect(merged.carry).toEqual({ kind: "box", boxId: 2 });
  });
  it("migrates old stock portions once, preserving money, ownership, regulars and décor", () => {
    const old = {
      money: 137,
      elapsed: 50,
      shift: 2,
      business: {
        beans: 30,
        milk: 20,
        pastries: 3,
        name: "Moon Bean",
        owned: true,
        xp: 120,
        lifetimeServed: 8,
      },
      purchased: ["sofa", "mochi"],
      familiarity: { yuna: 3 },
      unlocked: ["espresso"],
    };
    const merged = mergeBusinessSave(old, state());
    expect(merged.money).toBe(137);
    expect(merged.business.name).toBe("Moon Bean");
    expect(merged.business.owned).toBe(true);
    expect(merged.familiarity.yuna).toBe(3);
    expect(merged.purchased).toEqual(["sofa", "mochi"]);
    for (const [supply, expected] of [
      ["beans", 30],
      ["milk", 20],
    ] as [SupplyId, number][])
      expect(
        merged.ops.containers[supply] +
          merged.ops.boxes
            .filter((b) => b.supply === supply)
            .reduce((sum, b) => sum + b.quantity, 0),
      ).toBe(expected);
    expect(merged.ops.display.quantity).toBe(3);
    expect(merged.unlocked).toContain("latte");
  });
  it("invalid fields cannot replace store actions or make negative stock", () => {
    const saved = JSON.parse(JSON.stringify(state()));
    saved.tick = "broken";
    saved.ops.containers = {
      beans: -100,
      milk: Infinity,
      cups: "lots",
      dough: 999,
      syrup: 5,
    };
    saved.ops.levels = { hopper: 999, milkTank: -1 };
    const merged = mergeBusinessSave(saved, state());
    expect(typeof merged.tick).toBe("function");
    expect(merged.ops.containers.beans).toBe(0);
    expect(merged.ops.containers.dough).toBe(24);
    expect(merged.ops.levels.hopper).toBe(2);
    expect(merged.ops.containers.cups).toBe(0);
  });
  it("does not accept a completely unusable save", () => {
    expect(mergeBusinessSave({ money: "infinite" }, state())).toBe(state());
  });
  it("resets menus but preserves the chosen camera when reloading", () => {
    const saved = {
      ...state(),
      cameraMode: "first",
      phone: true,
      paused: true,
    };
    const merged = mergeBusinessSave(saved, state());
    expect(merged.cameraMode).toBe("first");
    expect(merged.phone).toBe(false);
    expect(merged.paused).toBe(false);
    expect(merged.phase).toBe("title");
  });
  it("keeps pending deliveries and an active bake on reload", () => {
    useGame.setState({ business: { ...state().business, lifetimeServed: 2 } });
    state().orderSupplies({ milk: 1 });
    prepareCookieTray();
    state().interactStation("oven");
    state().interactStation("oven");
    advance(4);
    const merged = mergeBusinessSave(
      JSON.parse(JSON.stringify(state())),
      state(),
    );
    expect(merged.ops.shipments).toHaveLength(1);
    expect(merged.ops.oven.stage).toBe("baking");
    expect(merged.ops.oven.elapsed).toBeCloseTo(4);
  });
  it("does not keep an orphaned carried box", () => {
    const merged = mergeBusinessSave(
      { ...state(), carry: { kind: "box", boxId: 999999 } },
      state(),
    );
    expect(merged.carry).toBeNull();
  });
  it("keeps paid orders paid after reload", () => {
    const id = order("indoor", [["espresso", 1]]);
    brew("espresso");
    state().serve(id);
    const cash = state().money;
    const merged = mergeBusinessSave(
      JSON.parse(JSON.stringify(state())),
      state(),
    );
    useGame.setState(merged as GameState);
    state().continueGame();
    state().serve(id);
    expect(state().money).toBe(cash);
    expect(state().ops.orders.find((o) => o.id === id)?.paid).toBe(true);
  });
  it("early closing survives reload and never charges overhead twice", () => {
    state().closeCafe();
    advance(1);
    expect(state().phase).toBe("summary");
    expect(state().inProgress).toBe(false);
    const cash = state().money;
    const merged = mergeBusinessSave(
      JSON.parse(JSON.stringify(state())),
      state(),
    );
    useGame.setState(merged);
    state().continueGame();
    expect(state().phase).toBe("summary");
    advance(3);
    expect(state().money).toBe(cash);
    expect(state().ops.overhead).toBe(8);
    state().nextShift();
    expect(state().phase).toBe("playing");
    expect(state().inProgress).toBe(true);
    expect(state().shift).toBe(2);
    expect(state().ops.overhead).toBe(0);
  });
  it("pending last orders remain fulfillable after a closing reload", () => {
    const id = order("indoor", [["espresso", 1]]);
    state().closeCafe();
    const merged = mergeBusinessSave(
      JSON.parse(JSON.stringify(state())),
      state(),
    );
    useGame.setState(merged);
    state().continueGame();
    expect(state().phase).toBe("closing");
    brew("espresso");
    state().serve(id);
    advance(1);
    expect(state().phase).toBe("summary");
    expect(state().ops.overhead).toBe(8);
  });
});

describe("quality and preference persistence", () => {
  it("discounts overbaked cookies even when coffee finishes the order later", () => {
    const id = order("indoor", [
      ["espresso", 1],
      ["cookie", 1],
    ]);
    const cash = state().money;
    useGame.setState({
      ops: { ...state().ops, display: { quantity: 1, quality: 0.65 } },
    });
    state().interactStation("display");
    state().serve(id);
    const merged = mergeBusinessSave(
      JSON.parse(JSON.stringify(state())),
      state(),
    );
    useGame.setState(merged);
    state().continueGame();
    brew("espresso");
    state().serve(id);
    expect(state().money - cash).toBeCloseTo(4 + 2.5 - 0.88 + 0.2);
  });
  it("saving title preferences does not create a completed evening", () => {
    const saved = {
      ...state(),
      inProgress: false,
      elapsed: 0,
      served: 0,
      settings: { ...state().settings, master: 0.4 },
    };
    const merged = mergeBusinessSave(saved, state());
    expect(merged.hasSave).toBe(false);
    expect(merged.settings.master).toBe(0.4);
  });
});

it("carried coffee prioritizes its accepted receipt over a nearby new guest", () => {
  const first = order("indoor", [["espresso", 1]]);
  const accepted = state().ops.orders.find((o) => o.id === first)!;
  const newcomer = { ...accepted, id: first + 1, accepted: false };
  const wrong = {
    ...accepted,
    id: first + 2,
    lines: [{ product: "latte" as const, quantity: 1, delivered: 0, price: 6 }],
  };
  const carry = {
    kind: "product" as const,
    item: { id: 900, product: "espresso" as const, quality: 1 },
  };
  expect(1.4 + orderFocusBias(accepted, carry)).toBeLessThan(
    0.6 + orderFocusBias(newcomer, carry),
  );
  expect(orderFocusBias(accepted, carry)).toBeLessThan(
    orderFocusBias(wrong, carry),
  );
});

it("a seated guest stays at their table after receiving the completed order", () => {
  const id = order("indoor", [["espresso", 1]]);
  brew("espresso");
  state().serve(id);
  expect(state().visitors.find((v) => v.uid === id)?.phase).toBe("receiving");
  advance(2.5);
  expect(state().visitors.find((v) => v.uid === id)?.phase).toBe("activity");
});
