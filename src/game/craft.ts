import { recipeById } from "../data/content";
import type { RecipeId } from "../data/content";

export const roasts = {
  house: {
    name: "House blend",
    notes: "Chocolate · almond · caramel",
    grind: 5,
    seconds: 28,
  },
  bright: {
    name: "Bright single origin",
    notes: "Citrus · honey · stone fruit",
    grind: 4,
    seconds: 32,
  },
  dark: {
    name: "Midnight roast",
    notes: "Cocoa · walnut · low acidity",
    grind: 6,
    seconds: 25,
  },
};
export type BrewStage =
  | "empty"
  | "grinding"
  | "dosed"
  | "distributed"
  | "tamping"
  | "locked"
  | "placed"
  | "extracting"
  | "purge"
  | "milk"
  | "steaming"
  | "pour"
  | "foam"
  | "water"
  | "ready"
  | "cleaning";
export interface Brew {
  recipe: RecipeId;
  stage: BrewStage;
  progress: number;
  milk: number;
  quality: "perfect" | "lovely";
  roast: keyof typeof roasts;
  grind: number;
  dose: number;
  ground: number;
  tamp: number;
  tampTime: number;
  shotTime: number;
  yield: number;
  score: number;
  art: "heart" | "rosetta" | "none";
  pour: number;
  feedback: string;
  practice: boolean;
}
export const freshBrew = (
  recipe: RecipeId = "espresso",
  practice = false,
): Brew => ({
  recipe,
  practice,
  stage: "empty",
  progress: 0,
  milk: 0,
  quality: "perfect",
  roast: "house",
  grind: 5,
  dose: 18,
  ground: 0,
  tamp: 100,
  tampTime: 0,
  shotTime: 0,
  yield: 0,
  score: 100,
  art: "heart",
  pour: 55,
  feedback: "",
});
export const tampNeedle = (seconds: number) =>
  50 + Math.sin(seconds * 2.7 - Math.PI / 2) * 50;
// Coffee time is compressed 5:1. Grind, puck preparation and roast alter flow.
export const flowRate = (b: Brew) =>
  (36 / roasts[b.roast].seconds) *
  Math.exp((b.grind - roasts[b.roast].grind) * 0.19) *
  (18 / b.dose) *
  (1 + (100 - b.tamp) / 260);
export function finishShot(b: Brew): Brew {
  const ratio = b.yield / b.dose;
  const timeLoss =
    Math.max(0, Math.abs(b.shotTime - roasts[b.roast].seconds) - 4) * 2;
  const ratioLoss = Math.max(0, Math.abs(ratio - 2) - 0.12) * 42;
  const score = Math.round(
    Math.max(
      25,
      Math.min(100, b.score - timeLoss - ratioLoss - (100 - b.tamp) * 0.25),
    ),
  );
  let feedback =
    "Balanced shot: sweetness, body and a gentle finish. Your dose, yield and flow work together.";
  if (ratio < 1.7)
    feedback =
      "A short, concentrated shot. For this lesson, let the yield reach about twice the dry dose.";
  else if (ratio > 2.4)
    feedback =
      "A long, diluted shot. Stop closer to a 1:2 ratio to preserve body.";
  else if (b.shotTime < roasts[b.roast].seconds - 5)
    feedback =
      "Fast flow can taste sharp or sour. Try a finer grind next time, keeping dose and yield the same.";
  else if (b.shotTime > roasts[b.roast].seconds + 5)
    feedback =
      "Slow flow can taste dry or bitter. Try a coarser grind next time, keeping dose and yield the same.";
  else if (b.tamp < 70)
    feedback =
      "An uneven puck can channel. Distribute evenly, then tamp level with steady pressure.";
  const recipe = recipeById(b.recipe);
  return {
    ...b,
    score,
    feedback,
    quality: score >= 85 ? "perfect" : "lovely",
    stage: recipe.milk ? "purge" : b.recipe === "americano" ? "water" : "ready",
  };
}
export const milkTemperature = (milk: number) => Math.round(20 + milk * 55);
export function finishMilk(b: Brew): Brew {
  const temperature = milkTemperature(b.milk);
  const penalty =
    temperature < 55
      ? (55 - temperature) * 2
      : temperature > 65
        ? (temperature - 65) * 3
        : 0;
  const score = Math.max(25, b.score - penalty);
  const message =
    temperature < 55
      ? "Milk is a little cool. Spend longer swirling to warm it through."
      : temperature > 65
        ? "Milk is too hot for this lesson. Stop earlier to preserve sweetness and soft microfoam."
        : "Silky microfoam: brief aeration, then a whirlpool. Warm and sweet, with no big bubbles.";
  return {
    ...b,
    score,
    quality: score >= 85 ? "perfect" : "lovely",
    stage: b.recipe === "cappuccino" ? "foam" : "pour",
    feedback: b.feedback + " " + message,
  };
}
