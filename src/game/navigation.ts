import { tableCenters } from "../data/layout";
export const obstacles = [
  { x: 2.3, z: -2.7, w: 4.5, d: 1.03 },
  { x: 0.52, z: 0.25, w: 1.03, d: 3.3 },
  { x: 5.05, z: -0.25, w: 1.03, d: 1.8 },
  { x: 2.4, z: -4.05, w: 1.8, d: 1.03 },
  ...tableCenters.map(([x, z]) => ({ x, z, w: 1.15, d: 1.15 })),
  { x: -5.15, z: 1.65, w: 0.95, d: 2.1 },
  { x: -5.47, z: -2.45, w: 0.5, d: 1.05 },
  { x: 3.2, z: -5.98, w: 4.36, d: 0.65 },
];
export function walkable(x: number, z: number, _purchased: string[] = []) {
  const main = x >= -5.53 && x <= 5.51 && z >= -3.25 && z <= 4.38;
  const stock = x >= 1.44 && x <= 5.51 && z >= -6.16 && z < -3.25;
  const outside = x >= -5.5 && x <= 5.6 && z >= 4.8 && z <= 6.7;
  const door = x >= -5.42 && x <= -4.29 && z >= 4.35 && z <= 5.1;
  if (!main && !stock && !outside && !door) return false;
  if (z < -3.28 && z > -3.78 && x < 4.5) return false;
  return !obstacles.some(
    (o) =>
      Math.abs(x - o.x) < o.w / 2 + 0.22 && Math.abs(z - o.z) < o.d / 2 + 0.22,
  );
}
