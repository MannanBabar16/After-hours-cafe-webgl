import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { ThreeElements } from "@react-three/fiber";
import { material } from "./primitives";
export const palette = {
  sage: "#78917b",
  forest: "#405846",
  cream: "#f4e8d6",
  oak: "#c99a70",
  terra: "#b97b67",
  coffee: "#624936",
  pink: "#e4b7ad",
  light: "#ffd8a1",
  outside: "#304958",
};
const shapes = new Map<string, THREE.BufferGeometry>();
export function SoftBox({
  size = [1, 1, 1],
  radius = 0.08,
  color = palette.cream,
  metal = 0,
  rough = 0.65,
  ...props
}: {
  size?: [number, number, number];
  radius?: number;
  color?: string;
  metal?: number;
  rough?: number;
} & Omit<ThreeElements["mesh"], "color" | "geometry" | "material">) {
  const geometry = useMemo(() => {
    const r = Math.min(radius, ...size.map((n) => n * 0.4));
    const key = size.join(":") + ":" + r;
    if (!shapes.has(key))
      shapes.set(key, new RoundedBoxGeometry(...size, 3, r));
    return shapes.get(key)!;
  }, [size[0], size[1], size[2], radius]);
  return (
    <mesh
      {...props}
      geometry={geometry}
      material={material(color, metal, rough)}
      castShadow
      receiveShadow
    />
  );
}
const wood = (() => {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 512;
  const x = c.getContext("2d")!;
  x.fillStyle = "#c1a386";
  x.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 100; i++) {
    x.strokeStyle = i % 3 ? "rgba(95,56,29,.065)" : "rgba(255,229,187,.14)";
    x.lineWidth = 1 + (i % 2);
    x.beginPath();
    x.moveTo((i * 31) % 128, 0);
    x.bezierCurveTo(
      ((i * 31) % 128) + 4,
      120,
      ((i * 31) % 128) - 5,
      360,
      ((i * 31) % 128) + 2,
      512,
    );
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
})();
export const oakMaterial = new THREE.MeshStandardMaterial({
  map: wood,
  color: "#fff0db",
  roughness: 0.76,
});
export function Oak({
  size = [1, 0.1, 1],
  ...props
}: { size?: [number, number, number] } & Omit<
  ThreeElements["mesh"],
  "material" | "geometry"
>) {
  const key = size.join(":") + ":oak";
  if (!shapes.has(key))
    shapes.set(
      key,
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(0.045, ...size.map((v) => v * 0.3)),
      ),
    );
  return (
    <mesh
      {...props}
      geometry={shapes.get(key)}
      material={oakMaterial}
      castShadow
      receiveShadow
    />
  );
}
export function Rod({
  from,
  to,
  r = 0.035,
  color = palette.oak,
}: {
  from: [number, number, number];
  to: [number, number, number];
  r?: number;
  color?: string;
}) {
  const { p, q, l } = useMemo(() => {
    const a = new THREE.Vector3(...from),
      b = new THREE.Vector3(...to),
      d = b.clone().sub(a);
    return {
      p: a.add(b).multiplyScalar(0.5),
      q: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.clone().normalize(),
      ),
      l: d.length(),
    };
  }, [...from, ...to]);
  return (
    <mesh
      position={p}
      quaternion={q}
      material={material(color, 0, 0.75)}
      castShadow
    >
      <cylinderGeometry args={[r, r * 0.85, l, 10]} />
    </mesh>
  );
}
export function Ring({
  r = 0.2,
  t = 0.02,
  color = palette.cream,
  ...props
}: { r?: number; t?: number; color?: string } & Omit<
  ThreeElements["mesh"],
  "color" | "material" | "geometry"
>) {
  return (
    <mesh {...props} material={material(color)}>
      <torusGeometry args={[r, t, 6, 24]} />
    </mesh>
  );
}

// A small procedural light studio provides gentle highlights without remote HDR files.
export const studioEnvironment = (() => {
  const faces = Array.from({ length: 6 }, (_, i) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "#9eaeb7");
    g.addColorStop(0.48, i % 2 ? "#71887d" : "#bdad91");
    g.addColorStop(1, "#3e5048");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    x.fillStyle = "rgba(255,235,195,.6)";
    x.shadowColor = "#fce6bd";
    x.shadowBlur = 19;
    x.fillRect(25 + (i % 3) * 8, 22, 45, 58);
    return c;
  });
  const t = new THREE.CubeTexture(faces);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
})();
