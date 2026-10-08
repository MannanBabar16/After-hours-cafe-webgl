import { recipeById } from "../data/content";
import type { RecipeId } from "../data/content";
export interface Business {
  owned: boolean;
  beans: number;
  milk: number;
  pastries: number;
  pastryMenu: boolean;
  pricing: "friendly" | "fair" | "premium";
  ingredientCost: number;
  supplySpend: number;
  tips: number;
  pastrySales: number;
  overheadPaid: boolean;
  rewards: number;
  xp: number;
  lifetimeServed: number;
  best: Partial<Record<RecipeId, number>>;
  claimed: string[];
  cleanliness: number;
  dirtySeats: number[];
  name: string;
  apron: string;
  cup: string;
  theme: "sage" | "rose" | "midnight";
  guided: boolean;
  practiceCount: number;
  lastCup: string;
  journal: string[];
}
export const OVERHEAD = 8;
export const priceMultiplier = { friendly: 0.9, fair: 1, premium: 1.25 };
export const sellingPrice = (recipe: RecipeId, pricing: Business["pricing"]) =>
  Math.round(recipeById(recipe).price * priceMultiplier[pricing] * 100) / 100;
export const ingredientCost = (recipe: RecipeId, dose = 18) =>
  Math.round(((0.8 * dose) / 18 + (recipeById(recipe).milk ? 0.6 : 0)) * 100) /
  100;
export const freshBusiness = (): Business => ({
  owned: false,
  beans: 12,
  milk: 8,
  pastries: 6,
  pastryMenu: false,
  pricing: "fair",
  ingredientCost: 0,
  supplySpend: 0,
  tips: 0,
  pastrySales: 0,
  overheadPaid: false,
  rewards: 0,
  xp: 0,
  lifetimeServed: 0,
  best: {},
  claimed: [],
  cleanliness: 100,
  dirtySeats: [],
  name: "After Hours Café",
  apron: "#5b7968",
  cup: "#ede5d1",
  theme: "sage",
  guided: true,
  practiceCount: 0,
  lastCup: "",
  journal: [],
});
export const nextBusiness = (b: Business): Business => ({
  ...b,
  ingredientCost: 0,
  supplySpend: 0,
  tips: 0,
  pastrySales: 0,
  overheadPaid: false,
  rewards: 0,
  claimed: [],
});
export const level = (xp: number) => 1 + Math.floor(xp / 150);
export const baristaTitle = (xp: number) =>
  [
    "Curious apprentice",
    "Neighborhood barista",
    "Coffee artisan",
    "Night-shift maestro",
    "Café legend",
  ][Math.min(4, level(xp) - 1)];
export const supplies = {
  beans: { name: "Fresh beans", amount: 10, price: 8, unit: "double shots" },
  milk: { name: "Cold milk", amount: 10, price: 6, unit: "pitchers" },
  pastries: {
    name: "Butter croissants",
    amount: 6,
    price: 6,
    unit: "pastries",
  },
};
export const dailyGoals = (
  served: number,
  perfect: number,
  revenue: number,
) => [
  {
    id: "welcome",
    title: "Welcome three guests",
    description: "Serve 3 coffees",
    value: served,
    target: 3,
    reward: 5,
  },
  {
    id: "craft",
    title: "Made with care",
    description: "Serve 2 perfect cups",
    value: perfect,
    target: 2,
    reward: 8,
  },
  {
    id: "trade",
    title: "A thriving little evening",
    description: "Take $40 in sales & tips",
    value: revenue,
    target: 40,
    reward: 12,
  },
];
export const overhead = (b: Business) => (b.owned ? 3 : OVERHEAD);
export const shiftProfit = (revenue: number, b: Business) =>
  revenue - b.ingredientCost - overhead(b);
export const needsCredit = (b: Business, kind: keyof typeof supplies) =>
  b[kind] < (kind === "beans" ? 22 / 18 : 1);
