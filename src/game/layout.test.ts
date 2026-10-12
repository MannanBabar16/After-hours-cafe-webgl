import { targetFacing } from "./focus";
import { stationVisuals } from "../data/layout";
import { describe, it, expect } from "vitest";
import { walkable } from "./navigation";
import {
  layout,
  interactionPoints,
  shelfSpot,
  robotRoute,
} from "../data/layout";
import { mergeBusinessSave } from "../store/persistence";
import { useGame } from "../store/game";

function reachableCells() {
  const key = (x: number, z: number) => `${x}:${z}`;
  const start = [
    Math.round(layout.spawn.x * 10),
    Math.round(layout.spawn.z * 10),
  ];
  const visited = new Set([key(...(start as [number, number]))]),
    queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [a, b] of [
      [x - 1, z],
      [x + 1, z],
      [x, z - 1],
      [x, z + 1],
    ]) {
      const k = key(a, b);
      if (!visited.has(k) && walkable(a / 10, b / 10)) {
        visited.add(k);
        queue.push([a, b]);
      }
    }
  }
  return queue.map(([x, z]) => [x / 10, z / 10]);
}
describe("connected miniature restaurant layout", () => {
  it("allows the player to reach every working station, stock shelves, and delivered boxes", () => {
    const cells = reachableCells();
    for (const [name, point] of Object.entries(interactionPoints)) {
      if (name === "cat") continue;
      expect(
        cells.some(([x, z]) => Math.hypot(x - point[0], z - point[2]) < 1.25),
        name,
      ).toBe(true);
    }
    for (let slot = 0; slot < 22; slot++) {
      const p = shelfSpot(slot);
      expect(
        cells.some(([x, z]) => Math.hypot(x - p[0], z - p[1]) < 1.4),
        "shelf " + slot,
      ).toBe(true);
    }
    for (let slot = 0; slot < 40; slot++) {
      const x = -4.45 + (slot % 10) * 0.9,
        z = 5.25 + Math.floor(slot / 10) * 0.43;
      expect(
        cells.some((p) => Math.hypot(p[0] - x, p[1] - z) < 0.45),
        "delivery " + slot,
      ).toBe(true);
    }
  });
  it("routes Bomi around the public counter and into the seating area", () => {
    for (let seat = 0; seat < 6; seat++) {
      const route = robotRoute(seat);
      for (let i = 1; i < route.length; i++)
        for (let j = 0; j <= 10; j++) {
          const f = j / 10,
            x = route[i - 1][0] * (1 - f) + route[i][0] * f,
            z = route[i - 1][1] * (1 - f) + route[i][1] * f;
          expect(walkable(x, z), "robot route seat " + seat).toBe(true);
        }
    }
  });
  it("places the car lane outside the building and the handoff directly at the kitchen wall", () => {
    expect(layout.laneX - 0.61).toBeGreaterThan(layout.wallX);
    expect(interactionPoints.window[0]).toBeLessThan(layout.wallX);
    expect(interactionPoints.window[2]).toBe(layout.windowZ);
    expect(walkable(interactionPoints.window[0] - 0.25, layout.windowZ)).toBe(
      true,
    );
  });
  it("relocates old room positions without losing paid stock, carried items, or equipment", () => {
    useGame.getState().newGame();
    const state = useGame.getState();
    const saved = JSON.parse(JSON.stringify(state));
    delete saved.ops.layoutVersion;
    saved.player = { x: -7.3, z: 0, angle: Math.PI };
    saved.ops.boxes[1] = {
      ...saved.ops.boxes[1],
      x: -8.15,
      z: 0.15,
      quantity: 7,
    };
    saved.carry = { kind: "box", boxId: 2 };
    saved.ops.boxes[1].location = "carried";
    saved.ops.levels.milkTank = 1;
    saved.money = 137;
    const restored = mergeBusinessSave(saved, state);
    expect(restored.money).toBe(137);
    expect(restored.ops.boxes.map((b) => b.quantity)).toEqual(
      saved.ops.boxes.map((b: { quantity: number }) => b.quantity),
    );
    expect(restored.carry).toEqual({ kind: "box", boxId: 2 });
    expect(restored.ops.levels.milkTank).toBe(1);
    expect(walkable(restored.player.x, restored.player.z)).toBe(true);
    expect(restored.ops.layoutVersion).toBe(layout.version);
  });
});

it("first-person focus follows the visible cup stack rather than a nearby foot point", () => {
  expect(
    targetFacing(0.88, -1.85, Math.PI, stationVisuals.cups),
  ).toBeGreaterThan(0.95);
  expect(
    targetFacing(0.88, -1.85, Math.PI, interactionPoints.cups),
  ).toBeLessThan(0.68);
});
