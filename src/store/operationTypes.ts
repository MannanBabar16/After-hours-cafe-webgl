import type { RecipeId } from "../data/content";
import type { SupplyId, ProductId, EquipmentId } from "../data/operations";
export interface ProductItem {
  id: number;
  product: ProductId;
  quality: number;
}
export type Carry =
  | { kind: "box"; boxId: number }
  | { kind: "cup" }
  | { kind: "product"; item: ProductItem }
  | { kind: "tray"; items: ProductItem[] }
  | { kind: "bakingTray"; quantity: number; baked: boolean; quality: number }
  | { kind: "trash"; label: string };
export interface SupplyBox {
  id: number;
  supply: SupplyId;
  quantity: number;
  x: number;
  z: number;
  location: "delivery" | "floor" | "storage" | "carried";
  slot: number;
}
export interface LooseObject {
  id: number;
  carry: Exclude<Carry, { kind: "box" }>;
  x: number;
  z: number;
}
export interface OrderLine {
  product: ProductId;
  quantity: number;
  delivered: number;
  price: number;
  discount?: number;
}
export interface Order {
  id: number;
  channel: "indoor" | "drive";
  customer: string;
  visitorUid: number;
  lines: OrderLine[];
  accepted: boolean;
  paid: boolean;
  age: number;
  payment: number;
  reaction: string;
  vehicle: "compact" | "sedan" | "suv" | "van";
  color: string;
  vehiclePhase: "arriving" | "waiting" | "leaving";
  vehicleAge: number;
  vehicleZ: number;
}
export interface Shipment {
  id: number;
  items: { supply: SupplyId; packs: number }[];
  stage: "ordered" | "arriving" | "unloading" | "leaving";
  age: number;
}
export interface MachineState {
  stage: "empty" | "cup" | "brewing" | "ready";
  recipe: RecipeId;
  elapsed: number;
  duration: number;
  item: ProductItem | null;
}
export interface OvenState {
  stage: "empty" | "loaded" | "baking" | "ready";
  quantity: number;
  elapsed: number;
  duration: number;
  quality: number;
  doorOpen: boolean;
}
export interface RobotState {
  stage: "idle" | "outbound" | "returning";
  orderId: number | null;
  items: ProductItem[];
  elapsed: number;
  route: [number, number][];
}
export interface Transaction {
  id: number;
  kind: "sale" | "supplies" | "upgrade" | "operating" | "reward";
  label: string;
  amount: number;
  time: string;
}
export interface Operations {
  containers: Record<SupplyId, number>;
  boxes: SupplyBox[];
  loose: LooseObject[];
  levels: Record<EquipmentId, number>;
  machine: MachineState;
  oven: OvenState;
  display: { quantity: number; quality: number };
  orders: Order[];
  shipments: Shipment[];
  robot: RobotState;
  handoff: ProductItem[];
  spills: { id: number; x: number; z: number; age: number }[];
  grounds: number;
  transactions: Transaction[];
  supplySpend: number;
  upgradeSpend: number;
  ingredientCost: number;
  overhead: number;
  tips: number;
  paidOrderIds: number[];
  indoorTimer: number;
  driveTimer: number;
  cleaningTimer: number;
  open: boolean;
  closing: boolean;
  serial: number;
  menuPrices: Partial<Record<ProductId, number>>;
  truck: { stage: "gone" | "arriving" | "parked" | "leaving"; elapsed: number };
  onboarding: number;
}
export const emptyMachine = (): MachineState => ({
  stage: "empty",
  recipe: "espresso",
  elapsed: 0,
  duration: 4,
  item: null,
});
export const emptyOven = (): OvenState => ({
  stage: "empty",
  quantity: 0,
  elapsed: 0,
  duration: 20,
  quality: 1,
  doorOpen: false,
});
export function freshOperations(): Operations {
  return {
    containers: { beans: 10, milk: 8, cups: 10, dough: 8, syrup: 0 },
    boxes: [
      {
        id: 1,
        supply: "beans",
        quantity: 20,
        x: -8.15,
        z: -0.75,
        location: "storage",
        slot: 0,
      },
      {
        id: 2,
        supply: "milk",
        quantity: 12,
        x: -8.15,
        z: 0.15,
        location: "storage",
        slot: 1,
      },
      {
        id: 3,
        supply: "cups",
        quantity: 25,
        x: -8.15,
        z: 1.05,
        location: "storage",
        slot: 2,
      },
      {
        id: 4,
        supply: "dough",
        quantity: 16,
        x: -8.15,
        z: 1.95,
        location: "storage",
        slot: 3,
      },
    ],
    loose: [],
    levels: {
      hopper: 0,
      milkTank: 0,
      cupDispenser: 0,
      machine: 0,
      oven: 0,
      display: 0,
      tray: 0,
      robot: 0,
      storage: 0,
    },
    machine: emptyMachine(),
    oven: emptyOven(),
    display: { quantity: 0, quality: 1 },
    orders: [],
    shipments: [],
    robot: { stage: "idle", orderId: null, items: [], elapsed: 0, route: [] },
    handoff: [],
    spills: [],
    grounds: 0,
    transactions: [],
    supplySpend: 0,
    upgradeSpend: 0,
    ingredientCost: 0,
    overhead: 0,
    tips: 0,
    paidOrderIds: [],
    indoorTimer: 5,
    driveTimer: 30,
    cleaningTimer: 0,
    open: false,
    closing: false,
    serial: 100,
    menuPrices: {},
    truck: { stage: "gone", elapsed: 0 },
    onboarding: 0,
  };
}
