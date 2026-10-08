import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { ThreeElements } from "@react-three/fiber";
const boxGeometry = new RoundedBoxGeometry(1, 1, 1, 1, 0.025);
const sphereGeometry = new THREE.SphereGeometry(1, 12, 10);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 20);
const coneGeometry = new THREE.ConeGeometry(1, 1, 12);
const materials = new Map<string, THREE.MeshStandardMaterial>();
export function material(color: string, metalness = 0, roughness = 0.8) {
  const key = `${color}:${metalness}:${roughness}`;
  if (!materials.has(key))
    materials.set(
      key,
      new THREE.MeshStandardMaterial({ color, roughness, metalness }),
    );
  return materials.get(key)!;
}
type Props = {
  color?: string;
  metal?: number;
  rough?: number;
  shadow?: boolean;
} & Omit<ThreeElements["mesh"], "color" | "material" | "geometry">;
export function Box({
  color = "#af8060",
  metal = 0,
  rough = 0.8,
  shadow = true,
  ...props
}: Props) {
  return (
    <mesh
      geometry={boxGeometry}
      material={material(color, metal, rough)}
      castShadow={shadow}
      receiveShadow
      {...props}
    />
  );
}
export function Ball({
  color = "#af8060",
  metal = 0,
  rough = 0.8,
  shadow = true,
  ...props
}: Props) {
  return (
    <mesh
      geometry={sphereGeometry}
      material={material(color, metal, rough)}
      castShadow={shadow}
      receiveShadow
      {...props}
    />
  );
}
export function Cylinder({
  color = "#af8060",
  metal = 0,
  rough = 0.8,
  shadow = true,
  ...props
}: Props) {
  return (
    <mesh
      geometry={cylinderGeometry}
      material={material(color, metal, rough)}
      castShadow={shadow}
      receiveShadow
      {...props}
    />
  );
}
export function Cone({
  color = "#af8060",
  metal = 0,
  rough = 0.8,
  shadow = true,
  ...props
}: Props) {
  return (
    <mesh
      geometry={coneGeometry}
      material={material(color, metal, rough)}
      castShadow={shadow}
      receiveShadow
      {...props}
    />
  );
}
export function Label({
  text,
  position,
  size = [2, 0.6],
  color = "#e8dcc0",
  background = "#2d4239",
  font = 48,
  rotation = [0, 0, 0],
}: {
  text: string;
  position: [number, number, number];
  size?: [number, number];
  color?: string;
  background?: string;
  font?: number;
  rotation?: [number, number, number];
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = color;
    ctx.font = `${font}px Georgia, 'Malgun Gothic', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = text.split("\n");
    lines.forEach((line, i) =>
      ctx.fillText(line, 512, 128 + (i - (lines.length - 1) / 2) * 70),
    );
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [text, color, background, font]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
const shadowTexture = (() => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 60);
  gradient.addColorStop(0, "rgba(30,20,15,.42)");
  gradient.addColorStop(1, "rgba(30,20,15,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
})();
export function GroundShadow({
  position,
  size = 1.5,
}: {
  position: [number, number, number];
  size?: number;
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
    </mesh>
  );
}
export function Cup({
  position = [0, 0, 0],
  fill = 0,
  color = "#f3e5ca",
  coffee = "#b38250",
  scale = 1,
  foam = false,
  art = "none",
}: {
  position?: [number, number, number];
  fill?: number;
  color?: string;
  coffee?: string;
  scale?: number;
  foam?: boolean;
  art?: "heart" | "rosetta" | "none";
}) {
  return (
    <group position={position} scale={scale}>
      <Cylinder
        position={[0, 0.017, 0]}
        scale={[0.21, 0.035, 0.21]}
        color={color}
      />
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.145, 0.11, 0.28, 24, 1, true]} />
        <meshStandardMaterial
          color={color}
          side={THREE.DoubleSide}
          roughness={0.3}
        />
      </mesh>
      <Cylinder
        position={[0, 0.034, 0]}
        scale={[0.109, 0.025, 0.109]}
        color={color}
      />
      <mesh position={[0.16, 0.18, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.075, 0.023, 8, 20]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      {fill > 0 && (
        <Cylinder
          position={[0, 0.06 + fill * 0.225, 0]}
          scale={[0.112 + fill * 0.026, 0.014, 0.112 + fill * 0.026]}
          color={foam && art === "none" ? "#f1dfbb" : coffee}
          rough={0.45}
        />
      )}
      {foam && fill > 0.8 && art === "none" && (
        <mesh position={[0, 0.298, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.008, 5, 20, Math.PI * 1.8]} />
          <meshStandardMaterial color="#ac784b" />
        </mesh>
      )}
      {foam && fill > 0.8 && art === "heart" && (
        <group position={[0, 0.302, 0]}>
          <Ball
            position={[-0.026, 0, -0.01]}
            scale={[0.044, 0.003, 0.046]}
            color="#f5e4c7"
          />
          <Ball
            position={[0.026, 0, -0.01]}
            scale={[0.044, 0.003, 0.046]}
            color="#f5e4c7"
          />
          <Ball
            position={[0, 0, 0.027]}
            scale={[0.047, 0.003, 0.038]}
            color="#f5e4c7"
          />
        </group>
      )}
      {foam && fill > 0.8 && art === "rosetta" && (
        <group position={[0, 0.303, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <group key={i} position={[0, 0, -0.055 + i * 0.025]}>
              {[-1, 1].map((side) => (
                <Ball
                  key={side}
                  position={[side * (0.04 - i * 0.006), 0, 0]}
                  scale={[0.037 - i * 0.005, 0.003, 0.016]}
                  color="#f5e4c7"
                />
              ))}
            </group>
          ))}
          <Box
            position={[0, 0, -0.005]}
            scale={[0.008, 0.003, 0.13]}
            color="#f5e4c7"
          />
        </group>
      )}
    </group>
  );
}
