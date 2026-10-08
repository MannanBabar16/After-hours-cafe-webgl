export type RecipeId =
  "espresso" | "latte" | "cappuccino" | "americano" | "flatwhite";
export interface RecipeDefinition {
  id: RecipeId;
  name: string;
  price: number;
  note: string;
  milk: boolean;
  foam: boolean;
  color: string;
}
export const recipes: RecipeDefinition[] = [
  {
    id: "espresso",
    name: "Espresso",
    price: 4,
    note: "Small cup. A little courage.",
    milk: false,
    foam: false,
    color: "#89512e",
  },
  {
    id: "latte",
    name: "Latte",
    price: 6,
    note: "Espresso, silky milk, a quiet swirl.",
    milk: true,
    foam: false,
    color: "#d6ad79",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    price: 6,
    note: "A warm cloud over espresso.",
    milk: true,
    foam: true,
    color: "#ead6af",
  },
  {
    id: "americano",
    name: "Americano",
    price: 5,
    note: "Espresso opened up with hot water.",
    milk: false,
    foam: false,
    color: "#9a663e",
  },
  {
    id: "flatwhite",
    name: "Flat white",
    price: 6.5,
    note: "A small, strong cup with thin, glossy microfoam.",
    milk: true,
    foam: false,
    color: "#c39965",
  },
];
export const recipeById = (id: RecipeId) =>
  recipes.find((r) => r.id === id) ?? recipes[0];
export type Style = "Cozy" | "Nature" | "Study" | "Modern";
export interface CustomerDefinition {
  id: string;
  name: string;
  handle: string;
  tag: string;
  palette: string;
  hair: string;
  drink: RecipeId;
  seat: number;
  activity: "laptop" | "book" | "phone" | "window";
  postChance: number;
  style: Style;
  words: string;
}
export const customers: CustomerDefinition[] = [
  {
    id: "minho",
    name: "Minho",
    handle: "minho.afterwork",
    tag: "The quiet office worker",
    palette: "#657b8c",
    hair: "#252328",
    drink: "espresso",
    seat: 2,
    activity: "phone",
    postChance: 0.35,
    style: "Modern",
    words: "Just what I needed. Thank you.",
  },
  {
    id: "yuna",
    name: "Yuna",
    handle: "yuna.study",
    tag: "One more chapter",
    palette: "#c1a576",
    hair: "#392b29",
    drink: "latte",
    seat: 0,
    activity: "laptop",
    postChance: 0.8,
    style: "Study",
    words: "This is my new favorite study spot.",
  },
  {
    id: "hana",
    name: "Hana",
    handle: "hana.takes",
    tag: "Finding little beautiful things",
    palette: "#ca8e83",
    hair: "#29242b",
    drink: "cappuccino",
    seat: 1,
    activity: "phone",
    postChance: 1,
    style: "Cozy",
    words: "Wait, this deserves a photo.",
  },
  {
    id: "park",
    name: "Mr. Park",
    handle: "park.pages",
    tag: "A book and a black coffee",
    palette: "#768c6c",
    hair: "#b5b1a2",
    drink: "espresso",
    seat: 3,
    activity: "book",
    postChance: 0.45,
    style: "Study",
    words: "A good coffee makes a good evening.",
  },
  {
    id: "jisoo",
    name: "Jisoo",
    handle: "jisoo.draws",
    tag: "Ideas after midnight",
    palette: "#9683ac",
    hair: "#363131",
    drink: "latte",
    seat: 4,
    activity: "laptop",
    postChance: 0.75,
    style: "Nature",
    words: "The rain sounds like a new idea.",
  },
  {
    id: "daniel",
    name: "Daniel",
    handle: "daniel.nights",
    tag: "The night shift regular",
    palette: "#9d684e",
    hair: "#332422",
    drink: "cappuccino",
    seat: 5,
    activity: "window",
    postChance: 0.65,
    style: "Cozy",
    words: "Somewhere warm before work. Perfect.",
  },
];
export const customerById = (id: string) =>
  customers.find((c) => c.id === id) ?? customers[0];
export interface UpgradeDefinition {
  id: string;
  name: string;
  price: number;
  style: Style;
  points: number;
  description: string;
  icon: string;
  earnings?: number;
}
export const upgrades: UpgradeDefinition[] = [
  {
    id: "plant",
    name: "A little greenery",
    price: 12,
    style: "Nature",
    points: 18,
    description: "A leafy friend for the window corner.",
    icon: "plant",
  },
  {
    id: "lamp",
    name: "Amber floor lamp",
    price: 18,
    style: "Cozy",
    points: 20,
    description: "A softer light for longer evenings.",
    icon: "lamp",
  },
  {
    id: "bookshelf",
    name: "The reading shelf",
    price: 28,
    style: "Study",
    points: 22,
    description: "Stories to borrow. Reasons to stay.",
    icon: "book",
  },
  {
    id: "poster",
    name: "Night in Seoul",
    price: 10,
    style: "Modern",
    points: 15,
    description: "A little art on an empty wall.",
    icon: "art",
  },
  {
    id: "table",
    name: "Oak café tables",
    price: 35,
    style: "Modern",
    points: 18,
    description: "Beautiful oak, made for daily rituals.",
    icon: "table",
  },
  {
    id: "sofa",
    name: "The Sunday sofa",
    price: 50,
    style: "Cozy",
    points: 25,
    description: "A reading nook. Milo has first dibs.",
    icon: "sofa",
  },
  {
    id: "mochi",
    name: "Meet Mochi",
    price: 45,
    style: "Modern",
    points: 12,
    description: "A tiny cleaning robot with a big heart.",
    icon: "robot",
    earnings: 30,
  },
  {
    id: "machine",
    name: "Brass espresso kit",
    price: 65,
    style: "Modern",
    points: 20,
    description: "A gleaming new finish for your daily craft.",
    icon: "coffee",
    earnings: 55,
  },
];
export const seats: [number, number][] = [
  [3.7, -2.5],
  [3.7, 0.3],
  [3.7, 2.8],
  [-3.7, 1.1],
  [-3.7, 3.1],
  [0.1, 3.1],
];
export const MACHINE: [number, number, number] = [-1.6, 1.65, -3.05];
export const COUNTER: [number, number] = [-0.7, -1.8];
export const DOOR: [number, number] = [5.3, 4.43];
export const SHIFT_SECONDS = 720;
export const clockText = (elapsed: number) => {
  const minutes =
    20 * 60 + Math.min(360, Math.floor((elapsed / SHIFT_SECONDS) * 360));
  const hour = Math.floor(minutes / 60) % 24;
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};
