import { customerById, customers, seats } from "../data/content";
import type { RecipeId } from "../data/content";
import {
  caps,
  products,
  equipment,
  supplyCatalog,
  unitCost,
  DELIVERY_DELAY,
  COOKIE_GRACE,
  SHIFT_DURATION,
} from "../data/operations";
import type { SupplyId, EquipmentId, ProductId } from "../data/operations";
import type { GameState, Visitor } from "./game";
import type {
  Operations,
  Order,
  OrderLine,
  ProductItem,
  Carry,
  Transaction,
} from "./operationTypes";
import { audio } from "../game/audio";

export const round = (n: number) => Math.round(n * 100) / 100;
export const itemsInHand = (carry: Carry | null): ProductItem[] =>
  carry?.kind === "product"
    ? [carry.item]
    : carry?.kind === "tray"
      ? carry.items
      : [];
export const totalOrder = (order: Order) =>
  round(order.lines.reduce((n, l) => n + l.price * l.quantity, 0));
export const remaining = (order: Order) =>
  order.lines.reduce((n, l) => n + l.quantity - l.delivered, 0);
export function transaction(
  s: GameState,
  kind: Transaction["kind"],
  label: string,
  amount: number,
): Operations["transactions"] {
  return [
    {
      id: ++s.ops.serial,
      kind,
      label,
      amount: round(amount),
      time: `${Math.floor(s.elapsed / 60)}:${String(Math.floor(s.elapsed % 60)).padStart(2, "0")}`,
    },
    ...s.ops.transactions,
  ].slice(0, 60);
}
export function makeOrder(
  s: GameState,
  channel: Order["channel"],
): { order: Order; visitor?: Visitor } {
  const id = ++s.ops.serial;
  const occupied = new Set(s.visitors.map((v) => v.seat));
  const seat = seats.findIndex((_, i) => !occupied.has(i));
  const def =
    customers[
      (s.business.lifetimeServed +
        s.ops.orders.filter((o) => o.channel === "indoor" && !o.paid).length +
        (channel === "drive" ? 2 : 0)) %
        customers.length
    ];
  const recipe: RecipeId =
    s.business.lifetimeServed === 0
      ? "espresso"
      : s.unlocked.includes(def.drink)
        ? def.drink
        : "americano";
  const orderRecipe =
    s.unlocked.includes("vanilla") && id % 7 === 0 ? "vanilla" : recipe;
  const quote = (product: ProductId) =>
    round(
      (s.ops.menuPrices[product] ?? products[product].price) *
        (s.business.pricing === "premium"
          ? 1.12
          : s.business.pricing === "friendly"
            ? 0.9
            : 1),
    );
  const lines: OrderLine[] = [
    {
      product: orderRecipe,
      quantity: 1,
      delivered: 0,
      price: quote(orderRecipe),
    },
  ];
  if (s.business.lifetimeServed >= 2 && (channel === "drive" || id % 3 === 0))
    lines.push({
      product: "cookie",
      quantity: channel === "drive" ? 2 : 1,
      delivered: 0,
      price: quote("cookie"),
    });
  const names = ["Jae", "Sora", "Jun", "Eun"];
  const order: Order = {
    id,
    channel,
    customer: channel === "indoor" ? def.id : names[id % 4],
    visitorUid: id,
    lines,
    accepted: false,
    paid: false,
    age: 0,
    payment: 0,
    reaction: "",
    vehicle: (["compact", "sedan", "suv", "van"] as const)[id % 4],
    color: ["#c79877", "#8ea89c", "#d5b978", "#879daf"][id % 4],
    vehiclePhase: "arriving",
    vehicleAge: 0,
    vehicleZ: 12,
  };
  return {
    order,
    visitor:
      channel === "indoor"
        ? {
            uid: id,
            id: def.id,
            seat: Math.max(0, seat),
            recipe: orderRecipe,
            phase: "entering",
            age: 0,
            accepted: false,
            paid: false,
            posted: false,
          }
        : undefined,
  };
}

export function fulfill(
  s: GameState,
  orderId: number,
  offered: ProductItem[],
  fromRobot = false,
): { consumed: number[]; paid: boolean } {
  const order = s.ops.orders.find((o) => o.id === orderId);
  if (!order || !order.accepted || order.paid || !offered.length)
    return { consumed: [], paid: false };
  const lines = order.lines.map((l) => ({ ...l }));
  const consumed: number[] = [];
  for (const item of offered) {
    const line = lines.find((l) => l.product === item.product);
    const reserved =
      !fromRobot && s.ops.robot.orderId === orderId
        ? s.ops.robot.items.filter((i) => i.product === item.product).length
        : 0;
    if (
      line &&
      line.delivered + reserved < line.quantity &&
      !consumed.includes(item.id)
    ) {
      line.delivered++;
      line.discount = round(
        (line.discount ?? 0) + line.price * (1 - item.quality),
      );
      consumed.push(item.id);
    }
  }
  if (!consumed.length) return { consumed, paid: false };
  const paid = lines.every((l) => l.delivered === l.quantity);
  const next = {
    ...order,
    lines,
    paid,
    age: paid ? 0 : order.age,
    vehiclePhase: paid ? ("leaving" as const) : order.vehiclePhase,
    vehicleAge: paid ? 0 : order.vehicleAge,
  };
  if (paid && !s.ops.paidOrderIds.includes(orderId)) {
    const quality =
      offered
        .filter((i) => consumed.includes(i.id))
        .reduce((n, i) => n + i.quality, 0) / consumed.length;
    const discount = lines.reduce((sum, line) => sum + (line.discount ?? 0), 0);
    const subtotal = Math.max(0, totalOrder(next) - discount);
    const tip =
      quality >= 0.9 && discount === 0
        ? round(0.5 + Math.min(1, s.reputation / 100))
        : 0.2;
    const amount = round(subtotal + tip);
    next.payment = amount;
    next.reaction =
      order.channel === "indoor"
        ? customerById(order.customer).words
        : "Lovely. See you next evening!";
    s.money = round(s.money + amount);
    s.revenue = round(s.revenue + amount);
    s.lifetimeEarned = round(s.lifetimeEarned + amount);
    s.served++;
    s.ops.tips = round(s.ops.tips + tip);
    s.ops.paidOrderIds = [...s.ops.paidOrderIds.slice(-80), orderId];
    s.ops.transactions = transaction(
      s,
      "sale",
      `${order.channel === "drive" ? "Drive-through" : customerById(order.customer).name} · order #${orderId}`,
      amount,
    );
    s.business = {
      ...s.business,
      xp: s.business.xp + 15,
      lifetimeServed: s.business.lifetimeServed + 1,
    };
    s.reputation = Math.min(100, s.reputation + 0.7);
    if (order.channel === "indoor") {
      const visits = (s.familiarity[order.customer] ?? 0) + 1;
      s.familiarity = { ...s.familiarity, [order.customer]: visits };
      if (visits === 3) s.newRegulars++;
      s.visitors = s.visitors.map((v) =>
        v.uid === order.visitorUid
          ? {
              ...v,
              phase: "receiving",
              age: 0,
              paid: true,
              accepted: true,
              pastry: lines.some((l) => l.product === "cookie"),
              payment: amount,
            }
          : v,
      );
    }
    if (s.business.lifetimeServed >= 6 && !s.unlocked.includes("vanilla"))
      s.unlocked = [...s.unlocked, "vanilla", "flatwhite"];
    if (s.served === 2 || s.served === 6) {
      const reward = s.served === 2 ? 10 : 15;
      s.money += reward;
      s.ops.transactions = transaction(
        s,
        "reward",
        s.served === 2
          ? "First regulars · bakery opens"
          : "A good little evening",
        reward,
      );
    }
    if (order.id % 2 === 0 && order.channel === "indoor") {
      s.followers += 3;
      s.posts = [
        {
          id: order.id,
          customer: order.customer,
          text: `${lines.some((l) => l.product === "cookie") ? "Warm cookies and " : ""}${products[lines[0].product].name.toLowerCase()}, rain at the window. ${customerById(order.customer).words}`,
          likes: 5 + Math.floor(s.reputation / 5),
          theme: "coffee" as const,
          time: "Just now",
        },
        ...s.posts,
      ].slice(0, 24);
    }
    if (s.business.lifetimeServed % 4 === 0)
      s.ops.spills = [
        ...s.ops.spills,
        { id: ++s.ops.serial, x: 2, z: 1, age: 0 },
      ].slice(-4);
    audio.play("payment");
    s.toasts = [
      ...s.toasts.slice(-2),
      {
        id: ++s.ops.serial,
        title: `+ $${amount.toFixed(2)} · thank you`,
        detail: next.reaction,
        type: "money",
        age: 0,
      },
    ];
  }
  s.ops.orders = s.ops.orders.map((o) => (o.id === orderId ? next : o));
  return { consumed, paid };
}

export function tickOperations(s: GameState, dt: number): Partial<GameState> {
  if (!(dt > 0) || !Number.isFinite(dt)) return {};
  dt = Math.min(1, dt);
  const next: GameState = {
    ...s,
    ops: {
      ...s.ops,
      machine: { ...s.ops.machine },
      oven: { ...s.ops.oven },
      robot: { ...s.ops.robot },
      truck: { ...s.ops.truck },
    },
    visitors: s.visitors,
    toasts: s.toasts
      .map((t) => ({ ...t, age: t.age + dt }))
      .filter((t) => t.age < 5),
  };
  const o = next.ops;
  if (
    (s.phase !== "playing" && s.phase !== "closing") ||
    s.paused ||
    s.settingsOpen ||
    s.help ||
    (typeof document !== "undefined" && document.hidden)
  )
    return { toasts: next.toasts };
  if (o.open) next.elapsed = Math.min(SHIFT_DURATION, s.elapsed + dt);
  if (o.machine.stage === "brewing") {
    if (o.machine.elapsed < 1.05 && o.machine.elapsed + dt >= 1.05)
      audio.machine("pump");
    if (
      products[o.machine.recipe].milk &&
      o.machine.elapsed < o.machine.duration * 0.75 &&
      o.machine.elapsed + dt >= o.machine.duration * 0.75
    )
      audio.machine("steam");
    o.machine.elapsed += dt;
    if (o.machine.elapsed >= o.machine.duration) {
      o.machine.stage = "ready";
      o.machine.item = {
        id: ++o.serial,
        product: o.machine.recipe,
        quality: 1,
      };
      audio.stopMachines();
      audio.play("ready");
      next.toasts = [
        ...next.toasts.slice(-2),
        {
          id: ++o.serial,
          title: `${products[o.machine.recipe].name} is ready`,
          detail: "Collect it whenever you have a free hand.",
          type: "info",
          age: 0,
        },
      ];
    }
  }
  if (o.oven.stage === "baking" || o.oven.stage === "ready") {
    o.oven.elapsed += dt;
    if (o.oven.stage === "baking" && o.oven.elapsed >= o.oven.duration) {
      o.oven.stage = "ready";
      audio.play("bell");
      next.toasts = [
        ...next.toasts.slice(-2),
        {
          id: ++o.serial,
          title: "The cookies are ready",
          detail: "Plenty of time to collect the warm tray.",
          type: "info",
          age: 0,
        },
      ];
    }
    if (o.oven.elapsed > o.oven.duration + COOKIE_GRACE) o.oven.quality = 0.65;
  }
  o.shipments = s.ops.shipments.map((shipment) => ({
    ...shipment,
    age: shipment.age + dt,
  }));
  if (o.truck.stage === "gone") {
    const arriving = o.shipments.find(
      (sh) => sh.stage === "ordered" && sh.age >= DELIVERY_DELAY,
    );
    if (arriving) {
      arriving.stage = "arriving";
      arriving.age = 0;
      o.truck = { stage: "arriving", elapsed: 0 };
      audio.play("engine");
    }
  } else {
    o.truck.elapsed += dt;
    const shipment = o.shipments.find((sh) => sh.stage !== "ordered");
    if (o.truck.stage === "arriving" && o.truck.elapsed >= 4 && shipment) {
      o.truck = { stage: "parked", elapsed: 0 };
      shipment.stage = "unloading";
      shipment.age = 0;
      o.boxes = [...o.boxes];
      const used = new Set(
        o.boxes
          .filter((b) => b.location === "delivery")
          .map((b) => `${b.x.toFixed(2)},${b.z.toFixed(2)}`),
      );
      for (const line of shipment.items)
        for (let pack = 0; pack < line.packs; pack++) {
          let x = 0,
            z = 0;
          for (let slot = 0; slot < 40; slot++) {
            x = -4.45 + (slot % 10) * 0.9;
            z = 5.25 + Math.floor(slot / 10) * 0.43;
            if (!used.has(`${x.toFixed(2)},${z.toFixed(2)}`)) break;
          }
          used.add(`${x.toFixed(2)},${z.toFixed(2)}`);
          o.boxes.push({
            id: ++o.serial,
            supply: line.supply,
            quantity: supplyCatalog[line.supply].pack,
            x,
            z,
            location: "delivery",
            slot: -1,
          });
        }
      next.toasts = [
        ...next.toasts.slice(-2),
        {
          id: ++o.serial,
          title: "Your delivery is outside",
          detail: "Labeled boxes are ready by the front entrance.",
          type: "info",
          age: 0,
        },
      ];
      audio.play("latch");
    } else if (o.truck.stage === "parked" && o.truck.elapsed >= 8) {
      o.truck = { stage: "leaving", elapsed: 0 };
      if (shipment) {
        shipment.stage = "leaving";
        shipment.age = 0;
      }
      audio.play("engine");
    } else if (o.truck.stage === "leaving" && o.truck.elapsed >= 4) {
      o.truck = { stage: "gone", elapsed: 0 };
      o.shipments = o.shipments.filter((sh) => sh.stage === "ordered");
    }
  }
  const activeIndoor = o.orders.filter(
    (order) => order.channel === "indoor" && !order.paid,
  ).length;
  if (o.open && s.phase === "playing") {
    o.indoorTimer -= dt;
    if (o.indoorTimer <= 0 && activeIndoor < 3 && next.visitors.length < 6) {
      const made = makeOrder(next, "indoor");
      o.orders = [...o.orders, made.order];
      next.visitors = [...next.visitors, made.visitor!];
      audio.play("door");
      o.indoorTimer = Math.max(
        28,
        43 - next.shift * 2 - Math.floor(s.followers / 60),
      );
    }
    if (next.business.lifetimeServed >= 1) {
      o.driveTimer -= dt;
      const cars = o.orders.filter((order) => order.channel === "drive");
      if (
        o.driveTimer <= 0 &&
        cars.length < (next.business.lifetimeServed >= 8 ? 2 : 1)
      ) {
        o.orders = [...o.orders, makeOrder(next, "drive").order];
        o.driveTimer = next.shift > 1 ? 42 : 65;
        audio.play("engine");
      }
    }
  }
  let carIndex = 0;
  o.orders = o.orders
    .map((order) => {
      const nextOrder = { ...order, age: order.age + dt };
      if (order.channel === "drive") {
        nextOrder.vehicleAge = order.vehicleAge + dt;
        if (order.vehiclePhase === "leaving")
          nextOrder.vehicleZ = order.vehicleZ - dt * 3;
        else {
          const target = carIndex++ * 3.5;
          nextOrder.vehicleZ = Math.max(target, order.vehicleZ - dt * 2.2);
          if (target === 0 && nextOrder.vehicleZ <= 0.02) {
            nextOrder.vehiclePhase = "waiting";
          }
        }
      }
      return nextOrder;
    })
    .filter((order) =>
      order.channel === "indoor"
        ? !order.paid || order.age < 85
        : order.vehiclePhase !== "leaving" || order.vehicleAge < 6,
    );
  next.visitors = next.visitors
    .map((v) => {
      let phase = v.phase;
      const age = v.age + dt;
      let reset = false;
      if (phase === "entering" && age > 6) {
        phase = "ordering";
        reset = true;
      }
      if (phase === "receiving" && age > 2) {
        phase = "activity";
        reset = true;
      }
      if (phase === "findingSeat" && age > 7) {
        phase = "activity";
        reset = true;
      }
      if (phase === "activity" && age > 50) {
        phase = "leaving";
        reset = true;
      }
      return { ...v, phase, age: reset ? 0 : age };
    })
    .filter((v) => v.phase !== "leaving" || v.age < 10);
  if (o.robot.stage !== "idle") {
    o.robot.elapsed += dt;
    const duration = Math.max(
      3,
      o.robot.route.reduce(
        (sum, point, i, arr) =>
          i
            ? sum +
              Math.hypot(point[0] - arr[i - 1][0], point[1] - arr[i - 1][1]) /
                1.5
            : 0,
        0,
      ),
    );
    if (o.robot.elapsed >= duration && o.robot.stage === "outbound") {
      if (o.robot.orderId !== null)
        fulfill(next, o.robot.orderId, o.robot.items, true);
      o.robot = {
        ...o.robot,
        stage: "returning",
        elapsed: 0,
        items: [],
        route: [...o.robot.route].reverse(),
      };
      audio.play("robot");
    } else if (o.robot.elapsed >= duration && o.robot.stage === "returning")
      o.robot = {
        stage: "idle",
        elapsed: 0,
        orderId: null,
        items: [],
        route: [],
      };
  }
  if (s.purchased.includes("mochi") && o.spills.length) {
    o.cleaningTimer += dt;
    if (o.cleaningTimer > 12) {
      o.spills = o.spills.slice(1);
      o.cleaningTimer = 0;
      audio.play("cloth");
    }
  }
  if (next.elapsed >= 120 && !s.eventsDone.includes(0)) {
    next.event = "rain";
    next.eventsDone = [...s.eventsDone, 0];
    o.indoorTimer = Math.min(o.indoorTimer, 10);
  }
  if (next.elapsed >= 390 && !s.eventsDone.includes(1)) {
    next.event = "viral";
    next.eventsDone = [...s.eventsDone, 1];
    next.followers += 8;
    o.driveTimer = Math.min(o.driveTimer, 8);
  }
  if (next.elapsed >= SHIFT_DURATION && o.open) {
    o.open = false;
    o.closing = true;
    next.phase = "closing";
    o.orders = o.orders.filter((order) => order.accepted || order.paid);
    next.visitors = next.visitors.filter((v) => v.accepted || v.paid);
  }
  if (
    next.phase === "closing" &&
    !o.orders.some((order) => order.accepted && !order.paid) &&
    o.robot.stage === "idle"
  ) {
    next.phase = "summary";
    next.inProgress = false;
    o.closing = false;
    if (o.overhead === 0) {
      const cost = next.business.owned ? 3 : 8;
      next.money = round(next.money - cost);
      o.overhead += cost;
      o.transactions = transaction(
        next,
        "operating",
        next.business.owned ? "Utilities" : "Rent & utilities",
        -cost,
      );
    }
    audio.setClosing(true);
  }
  return next;
}

export function containerCapacity(s: GameState, supply: SupplyId) {
  return supply === "beans"
    ? caps(s.ops.levels, "hopper")
    : supply === "milk"
      ? caps(s.ops.levels, "milkTank")
      : supply === "cups"
        ? caps(s.ops.levels, "cupDispenser")
        : supply === "dough"
          ? 24
          : 10;
}
export const ingredientCost = (product: ProductId) =>
  products[product].beans * unitCost("beans") +
  products[product].milk * unitCost("milk") +
  products[product].syrup * unitCost("syrup");
export const nextUpgrade = (s: GameState, id: EquipmentId) =>
  equipment[id].prices[s.ops.levels[id]];
