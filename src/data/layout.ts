export const layout = {
  version: 2,
  wallX: 5.8,
  backZ: -3.55,
  frontZ: 4.55,
  machine: [2.4, 1.16, -2.65] as [number, number, number],
  oven: [5.04, 1.16, -0.15] as [number, number, number],
  display: [0.55, 1.16, 1.05] as [number, number, number],
  dough: [2.4, 1.16, -4.05] as [number, number, number],
  dock: [1.35, 2.7] as [number, number],
  windowZ: 2.45,
  laneX: 6.9,
  spawn: { x: 2.4, z: -1.45, angle: Math.PI },
  cat: [-4.7, 0, 1.65] as [number, number, number],
};
export const tableCenters: [number, number][] = [
  [-3.45, -1.45],
  [-3.45, 1.4],
  [-1.55, 2.8],
];
export const seatSpot = (seat: number): [number, number] => {
  const p = tableCenters[Math.floor(seat / 2)] ?? tableCenters[0];
  return [p[0], p[1] + (seat % 2 ? -1 : 1) * 0.88];
};
export const counterSpot = (uid: number): [number, number] => [
  -0.63,
  -0.75 + (uid % 3) * 0.67,
];
export const shelfSpot = (slot: number): [number, number] => [
  1.65 + (slot % 5) * 0.77,
  -5.88,
];
export const guestPath = (
  fromCounter: boolean,
  seat: number,
): [number, number][] => {
  const p = seatSpot(seat);
  const path: [number, number][] =
    seat < 4 ? [[-0.65, 0], [-2.55, 0], [-2.55, p[1]], p] : [[-0.65, p[1]], p];
  return fromCounter
    ? path
    : [
        ...path.slice(0, -1).reverse(),
        [-0.65, 4.22],
        [-4.85, 4.22],
        [-4.85, 4.55],
      ];
};
export const robotRoute = (seat: number): [number, number][] => {
  const p = seatSpot(seat);
  const approach: [number, number][] =
    seat < 4
      ? [
          [-0.6, 0],
          [-2.55, 0],
          [-2.55, p[1]],
        ]
      : [[-0.6, p[1]]];
  return [
    layout.dock,
    [1.35, 2.5],
    [-0.6, 2.5],
    ...approach,
    [p[0] + 0.55, p[1]],
  ];
};
export const interactionPoints = {
  cups: [0.75, 1.65, -1.91],
  machine: [2.4, 2.0, -1.91],
  milk: [3.33, 1.65, -1.91],
  hopper: [2.14, 2.45, -1.91],
  syrup: [4.34, 1.65, -1.91],
  grounds: [2.83, 1.4, -1.91],
  oven: [5.04, 1.6, 0.7],
  display: [-0.05, 1.65, 1.05],
  dough: [2.4, 1.65, -4.75],
  storage: [3.2, 2.4, -5.12],
  robot: [1.35, 0.95, 2.7],
  handoff: [0.55, 1.65, -0.65],
  tray: [1.1, 1.4, -0.65],
  trash: [4.7, 0.9, 3.25],
  door: [-4.85, 1.55, 4.45],
  window: [5.05, 1.7, 2.45],
  cat: [-4.7, 0.7, 1.65],
} as const;

// Reach points keep the player out of cabinetry; look targets stay on the actual objects.
export const stationVisuals: Record<
  keyof typeof interactionPoints,
  readonly [number, number, number]
> = {
  cups: [0.75, 1.75, -2.65],
  machine: [2.4, 2.0, -2.28],
  milk: [3.33, 1.75, -2.65],
  hopper: [2.14, 2.65, -2.79],
  syrup: [4.34, 1.65, -2.65],
  grounds: [2.83, 1.4, -2.05],
  oven: [5.04, 1.65, 0.22],
  display: [0.55, 1.65, 1.05],
  dough: [2.4, 1.35, -4.05],
  storage: [3.2, 2.7, -5.8],
  robot: [1.35, 0.95, 2.7],
  handoff: [0.55, 1.4, -0.65],
  tray: [1.1, 1.4, -0.65],
  trash: [4.85, 0.85, 3.58],
  door: [-4.85, 2.25, 4.55],
  window: [5.83, 1.9, 2.45],
  cat: [-4.7, 0.7, 1.65],
};
