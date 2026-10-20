import { describe, it, expect, vi } from "vitest";
vi.mock("../game/audio", () => ({
  audio: { play: vi.fn(), stopMachines: vi.fn(), setClosing: vi.fn() },
}));
import { useGame } from "../store/game";
import { gameplayEvents, isPlaying } from "./model";
describe("passive gameplay observation", () => {
  it("does not replay a continued save as fresh sales, coffees or upgrades", () => {
    const initial = useGame.getState();
    const previous = { ...initial, phase: "title" as const, served: 12 };
    const next = { ...previous, phase: "playing" as const };
    expect(gameplayEvents(next, previous)).toEqual([{ type: "game_start" }]);
    expect(gameplayEvents(next, next)).toEqual([]);
  });
  it("emits coffee only on completion, never while brewing, and never mutates its input", () => {
    const s = useGame.getState();
    const previous = {
      ...s,
      phase: "playing" as const,
      ops: {
        ...s.ops,
        machine: {
          ...s.ops.machine,
          stage: "brewing" as const,
          recipe: "latte" as const,
        },
      },
    };
    const next = {
      ...previous,
      ops: {
        ...previous.ops,
        machine: { ...previous.ops.machine, stage: "ready" as const },
      },
    };
    const before = JSON.stringify(next);
    expect(gameplayEvents(previous, previous)).toEqual([]);
    expect(gameplayEvents(next, previous)).toEqual([
      { type: "coffee_brewed", label: "latte" },
    ]);
    expect(JSON.stringify(next)).toBe(before);
  });
  it("excludes paused/help/settings/title/summary time and includes normal business phone use", () => {
    const s = { ...useGame.getState(), phase: "playing" as const };
    expect(isPlaying({ ...s, phone: true })).toBe(true);
    for (const patch of [
      { paused: true },
      { help: true },
      { settingsOpen: true },
      { phase: "title" as const },
      { phase: "summary" as const },
    ])
      expect(isPlaying({ ...s, ...patch })).toBe(false);
  });
});
