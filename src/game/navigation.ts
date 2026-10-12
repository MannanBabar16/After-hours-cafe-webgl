import { seats } from "../data/content";
export function walkable(x: number, z: number, purchased: string[] = []) {
  const main = x >= -5.65 && x <= 5.62 && z >= -2.15 && z <= 4.55;
  const backroom = x >= -8.7 && x < -5.65 && z >= -2.45 && z <= 4.4;
  const entry = x >= -5.5 && x <= 5.6 && z > 4.55 && z <= 6.7;
  if (!main && !backroom && !entry) return false;
  if (Math.abs(x + 5.95) < 0.32 && z < 1.7) return false;
  if (backroom && (x < -8.4 || z < -1.95)) return false;
  if (
    purchased.includes("sofa") &&
    Math.abs(x + 2.25) < 1.25 &&
    Math.abs(z - 3.58) < 0.71
  )
    return false;
  if (
    purchased.includes("bookshelf") &&
    Math.abs(x + 5.65) < 0.49 &&
    Math.abs(z - 1.05) < 1.1
  )
    return false;
  const obstacles = [
    { x: -1.8, z: -3.1, w: 7.1, d: 1.2 },
    ...seats.map(([x, z]) => ({ x, z, w: 1.1, d: 1.1 })),
    { x: -5.25, z: -0.65, w: 0.65, d: 1.3 },
  ];
  return !obstacles.some(
    (o) =>
      Math.abs(x - o.x) < o.w / 2 + 0.24 && Math.abs(z - o.z) < o.d / 2 + 0.24,
  );
}
