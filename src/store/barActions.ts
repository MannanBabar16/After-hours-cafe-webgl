import type { GameState } from "./game";
import { recipeById } from "../data/content";
import { audio } from "../game/audio";
import { freshBrew, finishShot, finishMilk, tampNeedle } from "../game/craft";
import { supplies, ingredientCost, needsCredit } from "../game/business";
type SetGame = (
  patch: Partial<GameState> | ((state: GameState) => Partial<GameState>),
) => void;
type BarActions = Pick<
  GameState,
  | "selectRecipe"
  | "setBusiness"
  | "restock"
  | "configureBrew"
  | "buyCafe"
  | "craftStep"
  | "restartBrew"
  | "startPractice"
  | "cleanBar"
  | "busTables"
  | "placeCup"
  | "extract"
  | "steam"
  | "addFoam"
  | "takeDrink"
>;
export function createBarActions(
  set: SetGame,
  get: () => GameState,
): BarActions {
  return {
    selectRecipe: (recipe) => {
      const s = get();
      if (
        (s.unlocked.includes(recipe) || s.brew.practice) &&
        s.brew.stage === "empty"
      ) {
        set({
          brew: {
            ...freshBrew(recipe, s.brew.practice),
            roast: s.brew.roast,
            grind: s.brew.grind,
            dose: s.brew.dose,
          },
        });
        audio.play("click");
      }
    },
    setBusiness: (patch) => {
      const s = get();
      const safe = { ...patch };
      if (safe.name !== undefined)
        safe.name = safe.name.trim().slice(0, 28) || "After Hours Café";
      set({ business: { ...s.business, ...safe } });
      audio.play("click");
    },
    restock: (kind) => {
      const s = get();
      const item = supplies[kind];
      if (s.phase !== "playing" || s.brew.practice || s.business[kind] > 90)
        return;
      if (s.money < item.price && !needsCredit(s.business, kind)) {
        s.notify(
          "Keep a little in reserve",
          "Emergency supplier credit is available only when this ingredient runs out.",
        );
        return;
      }
      set({
        money: Math.round((s.money - item.price) * 100) / 100,
        business: {
          ...s.business,
          [kind]: s.business[kind] + item.amount,
          supplySpend: s.business.supplySpend + item.price,
        },
      });
      audio.play("paper");
      s.notify(
        "Delivery at the door",
        `${item.amount} ${item.unit} · $${item.price}${s.money < item.price ? " on supplier credit. Sales repay your balance." : " paid."}`,
      );
    },
    configureBrew: (patch) => {
      const s = get();
      if (!["empty", "pour", "foam"].includes(s.brew.stage)) return;
      set({
        brew: {
          ...s.brew,
          ...patch,
          dose: Math.max(16, Math.min(22, patch.dose ?? s.brew.dose)),
          grind: Math.max(1, Math.min(9, patch.grind ?? s.brew.grind)),
          pour: Math.max(0, Math.min(100, patch.pour ?? s.brew.pour)),
        },
      });
    },
    buyCafe: () => {
      const s = get();
      if (s.business.owned || s.money < 500 || s.phase !== "playing") return;
      set({ money: s.money - 500, business: { ...s.business, owned: true } });
      audio.play("upgrade");
      s.notify(
        "The keys are yours",
        "You own your café. No more nightly rent — only $3 utilities.",
        "upgrade",
      );
    },
    craftStep: () => {
      const s = get();
      const b = s.brew;
      if (!s.workstation || s.paused || s.settingsOpen) return;
      if (b.stage === "empty") {
        if (
          !b.practice &&
          (s.business.beans < b.dose / 18 ||
            (recipeById(b.recipe).milk && s.business.milk < 1))
        ) {
          s.notify(
            "A fresh delivery?",
            "Open the café desk to restock beans or milk. Emergency supplier credit keeps you brewing.",
          );
          return;
        }
        set({ brew: { ...b, stage: "grinding", ground: 0, progress: 0 } });
        audio.machine("grinder");
      } else if (b.stage === "dosed") {
        set({ brew: { ...b, stage: "distributed" } });
        audio.play("distribute");
      } else if (b.stage === "distributed") {
        set({
          brew: {
            ...b,
            stage: s.business.guided ? "locked" : "tamping",
            tamp: 100,
            tampTime: 0,
          },
        });
        audio.play("tamp");
      } else if (b.stage === "tamping") {
        const tamp = tampNeedle(b.tampTime);
        set({ brew: { ...b, stage: "locked", tamp } });
        audio.play("tamp");
      } else if (b.stage === "locked") s.placeCup();
      else if (b.stage === "placed") s.extract();
      else if (b.stage === "extracting") {
        set({ brew: finishShot(b) });
        audio.stopMachines();
        audio.play("cup");
      } else if (b.stage === "purge") {
        set({ brew: { ...b, stage: "milk" } });
        audio.play("purge");
      } else if (b.stage === "water") {
        set({
          brew: {
            ...b,
            stage: "ready",
            feedback:
              b.feedback +
              " Hot water opens up an espresso into a longer, gentler Americano.",
          },
        });
        audio.play("pour");
      } else if (b.stage === "pour" || b.stage === "foam") s.addFoam();
      else if (b.stage === "ready") s.takeDrink();
    },
    restartBrew: () => {
      const s = get();
      audio.stopMachines();
      set({ brew: freshBrew(s.brew.recipe, s.brew.practice) });
      if (
        !s.brew.practice &&
        ![
          "empty",
          "grinding",
          "dosed",
          "distributed",
          "tamping",
          "locked",
        ].includes(s.brew.stage)
      )
        s.notify(
          "A fresh start",
          "Used ingredients remain in your costs. Try one small adjustment.",
        );
    },
    startPractice: () => {
      const s = get();
      if (s.tray) {
        s.notify(
          "Clear your tray first",
          "Serve or set aside your current drink before practicing.",
        );
        return;
      }
      if (s.brew.stage !== "empty") {
        s.notify(
          "Finish this cup first",
          "Take or restart the current drink before entering practice.",
        );
        return;
      }
      set({
        workstation: true,
        managementOpen: false,
        phone: false,
        brew: freshBrew("espresso", true),
      });
    },
    cleanBar: () => {
      const s = get();
      if (s.brew.stage !== "empty") return;
      set({ brew: { ...s.brew, stage: "cleaning", progress: 0 } });
      audio.play("purge");
      audio.play("cloth");
    },
    busTables: () => {
      const s = get();
      if (!s.business.dirtySeats.length) return;
      set({
        business: { ...s.business, dirtySeats: [] },
        reputation: Math.min(100, s.reputation + 1),
      });
      audio.play("cloth");
      s.notify(
        "Ready for the next guest",
        "Cups cleared. Tables wiped. A small care that people notice.",
      );
    },
    placeCup: () => {
      const s = get();
      const b = s.brew;
      if (!s.workstation || b.stage !== "locked") return;
      if (
        !b.practice &&
        (s.business.beans < b.dose / 18 ||
          (recipeById(b.recipe).milk && s.business.milk < 1))
      ) {
        s.notify("The shelf is empty", "Restock at your café desk.");
        return;
      }
      const cleanLoss = !b.practice && s.business.cleanliness < 40 ? 8 : 0;
      set({
        brew: { ...b, stage: "placed", score: 100 - cleanLoss },
        business: b.practice
          ? s.business
          : {
              ...s.business,
              beans: s.business.beans - b.dose / 18,
              milk: s.business.milk - (recipeById(b.recipe).milk ? 1 : 0),
              ingredientCost:
                s.business.ingredientCost + ingredientCost(b.recipe, b.dose),
              cleanliness: Math.max(0, s.business.cleanliness - 12),
            },
      });
      audio.play("latch");
      audio.play("cup");
    },
    extract: () => {
      const s = get();
      if (!s.workstation || s.brew.stage !== "placed") return;
      set({ brew: { ...s.brew, stage: "extracting", progress: 0 } });
      audio.machine("pump");
    },
    steam: (held) => {
      const s = get();
      if (!s.workstation) return;
      if (held && s.brew.stage === "milk") {
        set({ brew: { ...s.brew, stage: "steaming", milk: 0 } });
        audio.machine("steam");
      } else if (!held && s.brew.stage === "steaming") {
        set({ brew: finishMilk(s.brew) });
        audio.stopMachines();
        audio.play("ready");
      }
    },
    addFoam: () => {
      const s = get();
      const b = s.brew;
      if (!["foam", "pour"].includes(b.stage)) return;
      const score = Math.max(
        25,
        b.score - Math.max(0, Math.abs(b.pour - 55) - 15) * 0.4,
      );
      set({
        brew: {
          ...b,
          stage: "ready",
          score: Math.round(score),
          quality: score >= 85 ? "perfect" : "lovely",
          feedback:
            b.feedback +
            (b.pour < 35
              ? " Pour more steadily to integrate the foam."
              : b.pour > 80
                ? " A slower pour keeps the surface pattern clean."
                : " A steady, low pour lays soft foam on the surface."),
        },
      });
      audio.play("pour");
      audio.play("ready");
    },
    takeDrink: () => {
      const s = get();
      const b = s.brew;
      if (b.stage !== "ready" || s.tray) return;
      const entry = `${recipeById(b.recipe).name} · ${b.score}/100 · ${b.dose}g in / ${b.yield.toFixed(0)}g out / ${b.shotTime.toFixed(0)}s. ${b.feedback}`;
      const business = {
        ...s.business,
        best: {
          ...s.business.best,
          [b.recipe]: Math.max(s.business.best[b.recipe] ?? 0, b.score),
        },
        lastCup: entry,
        journal: [entry, ...s.business.journal].slice(0, 8),
        practiceCount: s.business.practiceCount + (b.practice ? 1 : 0),
      };
      if (b.practice) {
        set({ business, brew: freshBrew(b.recipe, true) });
        s.notify(
          "Practice cup logged",
          `${b.score}/100 · No ingredients used. Your café clock stayed paused.`,
        );
      } else {
        set({
          business,
          tray: {
            recipe: b.recipe,
            quality: b.quality,
            score: b.score,
            art: b.art,
          },
          brew: freshBrew(),
          workstation: false,
        });
        s.notify(
          "Made with care",
          `Take your ${recipeById(b.recipe).name.toLowerCase()} to its person.`,
        );
      }
      audio.play("cup");
    },
  };
}
