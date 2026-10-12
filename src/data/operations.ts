import { interactionPoints } from './layout';
import type { RecipeId } from "./content";
export type SupplyId = "beans" | "milk" | "cups" | "dough" | "syrup";
export type ProductId = RecipeId | "cookie";
export const supplyIds: SupplyId[] = [
  "beans",
  "milk",
  "cups",
  "dough",
  "syrup",
];
export const supplyCatalog: Record<
  SupplyId,
  {
    name: string;
    pack: number;
    price: number;
    color: string;
    icon: string;
    unit: string;
  }
> = {
  beans: {
    name: "Coffee beans",
    pack: 20,
    price: 7,
    color: "#9c7557",
    icon: "coffee",
    unit: "portions",
  },
  milk: {
    name: "Fresh milk",
    pack: 12,
    price: 5,
    color: "#94b5b9",
    icon: "milk",
    unit: "portions",
  },
  cups: {
    name: "Paper cups",
    pack: 25,
    price: 3,
    color: "#bdae88",
    icon: "cup",
    unit: "cups",
  },
  dough: {
    name: "Cookie dough",
    pack: 16,
    price: 6,
    color: "#c49a6d",
    icon: "cookie",
    unit: "portions",
  },
  syrup: {
    name: "Vanilla syrup",
    pack: 10,
    price: 5,
    color: "#b6a3c5",
    icon: "syrup",
    unit: "portions",
  },
};
export const products: Record<
  ProductId,
  {
    name: string;
    price: number;
    beans: number;
    milk: number;
    syrup: number;
    seconds: number;
    color: string;
    note: string;
  }
> = {
  espresso: {
    name: "Espresso",
    price: 4,
    beans: 1,
    milk: 0,
    syrup: 0,
    seconds: 3.5,
    color: "#985f36",
    note: "A short, rich coffee. Beans + water.",
  },
  americano: {
    name: "Americano",
    price: 5,
    beans: 1,
    milk: 0,
    syrup: 0,
    seconds: 4,
    color: "#87522f",
    note: "Espresso opened up with extra hot water.",
  },
  latte: {
    name: "Latte",
    price: 6,
    beans: 1,
    milk: 2,
    syrup: 0,
    seconds: 5,
    color: "#cfa777",
    note: "Coffee with plenty of steamed milk.",
  },
  cappuccino: {
    name: "Cappuccino",
    price: 6,
    beans: 1,
    milk: 1,
    syrup: 0,
    seconds: 5.5,
    color: "#e1c9a3",
    note: "Coffee, milk, and a soft layer of foam.",
  },
  flatwhite: {
    name: "Flat white",
    price: 6.5,
    beans: 1,
    milk: 1,
    syrup: 0,
    seconds: 4.5,
    color: "#bc9568",
    note: "A smaller milk coffee, for returning regulars.",
  },
  vanilla: {
    name: "Vanilla latte",
    price: 7.5,
    beans: 1,
    milk: 2,
    syrup: 1,
    seconds: 5.5,
    color: "#ddbc8f",
    note: "A latte with one portion of vanilla syrup.",
  },
  cookie: {
    name: "Chocolate cookie",
    price: 2.5,
    beans: 0,
    milk: 0,
    syrup: 0,
    seconds: 20,
    color: "#bf8a4e",
    note: "Pre-portioned dough, baked in small batches.",
  },
};
export type EquipmentId =
  | "hopper"
  | "milkTank"
  | "cupDispenser"
  | "machine"
  | "oven"
  | "display"
  | "tray"
  | "robot"
  | "storage";
export const equipmentIds: EquipmentId[] = [
  "hopper",
  "milkTank",
  "cupDispenser",
  "machine",
  "oven",
  "display",
  "tray",
  "robot",
  "storage",
];
export const equipment: Record<
  EquipmentId,
  {
    name: string;
    values: number[];
    prices: number[];
    unit: string;
    icon: string;
    detail: string;
  }
> = {
  hopper: {
    name: "Bean hopper",
    values: [10, 20, 35],
    prices: [24, 38],
    unit: "portions",
    icon: "coffee",
    detail: "More coffee between refills. Stock is still purchased.",
  },
  milkTank: {
    name: "Milk container",
    values: [8, 16, 30],
    prices: [28, 40],
    unit: "portions",
    icon: "milk",
    detail: "A larger visible tank, fewer trips to storage.",
  },
  cupDispenser: {
    name: "Cup dispenser",
    values: [10, 20, 40],
    prices: [20, 32],
    unit: "cups",
    icon: "cup",
    detail: "A taller stack for your next busy evening.",
  },
  machine: {
    name: "Coffee machine",
    values: [1, 1.35, 1.7],
    prices: [42, 65],
    unit: "× speed",
    icon: "coffee",
    detail: "A faster brew cycle with a premium finish.",
  },
  oven: {
    name: "Cookie oven",
    values: [4, 6, 8],
    prices: [34, 48],
    unit: "per batch",
    icon: "cookie",
    detail: "A larger tray and a slightly quicker bake.",
  },
  display: {
    name: "Cookie display",
    values: [12, 24, 40],
    prices: [20, 32],
    unit: "cookies",
    icon: "cookie",
    detail: "More space for the cookies you actually bake.",
  },
  tray: {
    name: "Serving tray",
    values: [1, 2, 3],
    prices: [22, 35],
    unit: "items",
    icon: "tray",
    detail: "Collect coffee and cookies on one carried tray.",
  },
  robot: {
    name: "Bomi serving robot",
    values: [0, 1, 2, 3],
    prices: [55, 32, 45],
    unit: "items",
    icon: "robot",
    detail: "Load real products. Bomi serves indoors and returns.",
  },
  storage: {
    name: "Stockroom shelving",
    values: [8, 14, 22],
    prices: [24, 38],
    unit: "boxes",
    icon: "box",
    detail: "Extra shelf slots. Overflow deliveries stay outside.",
  },
};
export const stationPositions = interactionPoints;
export type StationId = keyof typeof stationPositions;
export const caps = (levels: Record<EquipmentId, number>, id: EquipmentId) =>
  equipment[id].values[levels[id]];
export const unitCost = (id: SupplyId) =>
  supplyCatalog[id].price / supplyCatalog[id].pack;
export const moneyText = (n: number) => `$${n.toFixed(2)}`;
export const SHIFT_DURATION = 720;
export const DELIVERY_DELAY = 12;
export const COOKIE_GRACE = 120;
