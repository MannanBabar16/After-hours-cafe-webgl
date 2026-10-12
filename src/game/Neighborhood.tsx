import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store/game";

// Screen-space dusk: one tiny local texture, no skybox download or postprocessing.
export const eveningSky = (() => {
  const canvas = document.createElement("canvas");
  canvas.width = 8; canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#7e8daf");
  gradient.addColorStop(0.48, "#b5a2ba");
  gradient.addColorStop(1, "#f0c6a4");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 8, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
})();

type Kind = "box" | "round" | "trunk" | "roof" | "window";
type Shape = { kind: Kind; p: [number, number, number]; s: [number, number, number]; color: string; yaw?: number; sway?: boolean };
const geometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  round: new THREE.IcosahedronGeometry(1, 1),
  trunk: new THREE.CylinderGeometry(0.8, 1, 1, 7),
  roof: new THREE.ConeGeometry(1, 1, 4),
  window: new THREE.BoxGeometry(1, 1, 1),
};
// Baked face shading gives the distant town depth without additional scene lights.
for (const kind of ["box", "round", "trunk", "roof"] as const) {
  const geometry = geometries[kind], normal = geometry.getAttribute("normal");
  const colors = new Float32Array(normal.count * 3);
  for (let i = 0; i < normal.count; i++) {
    const shade = Math.min(1, .83 + normal.getY(i) * .15 + normal.getZ(i) * .08 - normal.getX(i) * .05);
    colors.set([shade, shade, shade], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}
const backdropMaterial = new THREE.MeshBasicMaterial({ color: "white", vertexColors: true });
const windowMaterial = new THREE.MeshBasicMaterial({ color: "white", toneMapped: false });
const glowTexture = (() => {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!, gradient = ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,"rgba(255,237,180,.85)"); gradient.addColorStop(.25,"rgba(255,218,141,.3)"); gradient.addColorStop(1,"rgba(255,218,141,0)");
  ctx.fillStyle = gradient; ctx.fillRect(0,0,64,64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
})();
const glowMaterial = new THREE.MeshBasicMaterial({ map: glowTexture, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function scenery(light: boolean) {
  const shapes: Shape[] = [];
  const add = (kind: Kind, p: Shape["p"], s: Shape["s"], color: string, yaw = 0, sway = false) => shapes.push({ kind, p, s, color, yaw, sway });
  add("box", [0, -0.6, 0], [64, 0.12, 64], "#90a29c");
  add("box", [0, -0.505, 9.05], [48, 0.08, 0.9], "#dcc3a7");
  add("box", [0, -0.53, 10.95], [52, 0.04, 2.8], "#748394");
  add("box", [-8.9, -0.51, -0.5], [2.1, 0.05, 22], "#cbbca9");
  add("box", [0, -0.51, -8.2], [40, 0.05, 1.8], "#cbbca9");
  for (let i = -12; i <= 12; i++) add("box", [i * 2, -0.5, 10.95], [0.65, 0.012, 0.06], "#e8d5b5");
  const homes = [
    [-11, -6, 3.8, "#da9d8c"], [-11, 0, 2.8, "#b0bfb0"],
    [-8, -12, 4.7, "#b8c8ba"], [-3.4, -12.8, 3.5, "#e0b898"],
    [1.2, -12.7, 5.1, "#a9b3cd"], [6.1, -12.5, 3.9, "#e1b1a5"],
    [11, -12, 4.9, "#adc5c4"], [15.5, -11.4, 3.2, "#d4b9a1"],
  ] as const;
  for (const [x, z, height, color] of homes) {
    add("box", [x, height / 2 - 0.54, z], [3.3, height, 3.2], color);
    add("roof", [x, height - 0.05, z], [2.6, 1.0, 2.5], "#758b89", Math.PI / 4);
    add("box", [x, 0.23, z + 1.66], [3.5, 0.22, 0.55], "#6e9286");
    const floors = Math.floor(height / 1.1);
    for (let row = 0; row < floors; row++) for (const dx of [-0.82, 0.82]) {
      add("box", [x + dx, 0.35 + row * 1.05, z + 1.62], [0.62, 0.77, 0.06], "#657b7e");
      add("window", [x + dx, 0.35 + row * 1.05, z + 1.66], [0.49, 0.64, 0.025], row % 2 ? "#f6d49e" : "#ffe6b5");
      add("box", [x + 1.67, 0.35 + row * 1.05, z + dx], [0.05, 0.72, 0.59], "#6f8589");
      add("window", [x + 1.7, 0.35 + row * 1.05, z + dx], [0.02, 0.6, 0.46], "#f3ce95");
    }
  }
  const trees = [[-7.7,-5],[-7.8,-1],[-7.7,3.2],[-7.5,6.9],[-6.2,-8.5],[-1.6,-8.7],[3.8,-8.8],[8.8,-8.9],[12.6,-6.1],[13.2,-1.5],[13.5,3.5],[13.9,7.8],[-12.6,7.8],[-15.5,3.1]];
  for (const [i, [x, z]] of trees.entries()) {
    if (light && i > 9) continue;
    const height = 1.9 + (i % 3) * 0.32;
    add("trunk", [x, height / 2 - 0.54, z], [0.12, height, 0.12], "#926e56");
    for (let n = 0; n < 3; n++) add("round", [x + Math.sin(n * 2.1) * 0.35, height - 0.15 + (n % 2) * 0.46, z + Math.cos(n * 2.1) * 0.32], [0.77, 0.88, 0.75], i % 4 === 0 ? ["#e3a1ac", "#f0b7b1", "#dc8f9d"][n] : ["#70987b", "#8dae7a", "#60917f"][n], 0, true);
    add("round", [x, -0.48, z], [0.8, 0.025, 0.7], "#7c978b");
  }
  for (const x of [-7, 0.4, 7.8, 14.8]) {
    add("trunk", [x, 0.5, 9.3], [0.035, 2.0, 0.035], "#506f70");
    add("box", [x, 1.64, 9.3], [0.29, 0.13, 0.29], "#557e75");
    add("window", [x, 1.43, 9.3], [0.18, 0.3, 0.18], "#ffdc93");
  }
  return shapes;
}

function Batch({ shapes, kind, reduced }: { shapes: Shape[]; kind: Kind; reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => shapes.filter(s => s.kind === kind), [shapes, kind]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timer = useRef(0);
  const place = (time: number) => {
    if (!mesh.current) return;
    for (const [i, s] of items.entries()) {
      dummy.position.set(...s.p); dummy.scale.set(...s.s);
      dummy.rotation.set(0, s.yaw || 0, !reduced && s.sway ? Math.sin(time * .65 + i) * .04 : 0);
      dummy.updateMatrix(); mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(() => {
    place(0);
    items.forEach((s, i) => mesh.current!.setColorAt(i, new THREE.Color(s.color)));
    mesh.current!.instanceColor!.needsUpdate = true;
    mesh.current!.computeBoundingSphere();
  }, [items, reduced]);
  useFrame(({ clock }, dt) => {
    if (kind !== "round" || reduced) return;
    timer.current += dt;
    if (timer.current < .12) return;
    timer.current = 0; place(clock.elapsedTime);
  });
  return <instancedMesh ref={mesh} args={[geometries[kind], kind === "window" ? windowMaterial : backdropMaterial, items.length]} />;
}

function PassingCar({ offset, color, reduced }: { offset: number; color: string; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.x = reduced ? -14 + offset : ((clock.elapsedTime * 1.05 + offset) % 40) - 20;
  });
  return <group ref={ref} position={[-14 + offset, -.49, 10.0]} rotation={[0, Math.PI / 2, 0]}>
    <mesh geometry={geometries.box} material={backdropMaterial} scale={[.77,.35,1.55]} position={[0,.25,0]}><meshBasicMaterial color={color} /></mesh>
    <mesh geometry={geometries.box} scale={[.69,.34,.82]} position={[0,.53,-.08]}><meshBasicMaterial color="#879ca7" /></mesh>
    <mesh geometry={geometries.box} scale={[.73,.09,.87]} position={[0,.74,-.08]}><meshBasicMaterial color={color} /></mesh>
    {[-.39,.39].flatMap(x => [-.49,.49].map(z => <mesh key={x+":"+z} position={[x,.14,z]} rotation={[0,0,Math.PI/2]} scale={[.14,.09,.14]} geometry={geometries.trunk}><meshBasicMaterial color="#4d626c" /></mesh>))}
    <mesh position={[0,.31,.78]} scale={[.52,.06,.025]} geometry={geometries.box}><meshBasicMaterial color="#ffe7a5" toneMapped={false} /></mesh>
  </group>;
}

function EveningWalker({ index, reduced }: { index: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null), legs = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = reduced ? index * 4 : clock.elapsedTime * .38 + index * 6.5;
    const x = -14 + ((t % 56) < 28 ? t % 28 : 28 - t % 28);
    if (group.current) { group.current.position.x = x; group.current.rotation.y = t % 56 < 28 ? Math.PI/2 : -Math.PI/2; }
    if (legs.current) legs.current.children.forEach((leg, i) => leg.rotation.x = reduced ? 0 : Math.sin(clock.elapsedTime * 3.1 + i * Math.PI) * .28);
  });
  return <group ref={group} position={[-14 + index * 5, -.46, 8.9 + (index % 2)*.35]} scale={.75}>
    <mesh geometry={geometries.round} position={[0,.56,0]} scale={[.19,.27,.15]}><meshBasicMaterial color={["#e6ad8b", "#819d99", "#bf91ac"][index%3]} /></mesh>
    <mesh geometry={geometries.round} position={[0,.88,0]} scale={.15}><meshBasicMaterial color="#d9b698" /></mesh>
    <group ref={legs} position={[0,.32,0]}>{[-.09,.09].map(x => <group key={x} position={[x,0,0]}><mesh position={[0,-.13,0]} geometry={geometries.trunk} scale={[.055,.3,.055]}><meshBasicMaterial color="#627478" /></mesh></group>)}</group>
    <mesh position={[0,1.05,0]} geometry={geometries.trunk} scale={[.013,.65,.013]}><meshBasicMaterial color="#a68970" /></mesh>
    <mesh position={[0,1.35,0]} geometry={geometries.roof} rotation={[0,Math.PI/4,0]} scale={[.58,.2,.58]}><meshBasicMaterial color={index%2 ? "#daa0a3" : "#e4bf89"} side={THREE.DoubleSide} /></mesh>
  </group>;
}

export function Neighborhood() {
  const graphics = useGame(s => s.settings.graphics);
  const reduced = useReducedMotion();
  const shapes = useMemo(() => scenery(graphics === "low"), [graphics]);
  const lights = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ camera, clock }) => {
    if (!lights.current) return;
    [-7, .4, 7.8, 14.8].forEach((x, i) => {
      dummy.position.set(x, 1.45, 9.3); dummy.quaternion.copy(camera.quaternion);
      const radius = reduced ? .8 : .8 + Math.sin(clock.elapsedTime * 1.1 + i) * .025;
      dummy.scale.set(radius, radius, 1); dummy.updateMatrix(); lights.current!.setMatrixAt(i, dummy.matrix);
    });
    lights.current.instanceMatrix.needsUpdate = true;
  });
  return <group name="living-neighborhood">
    {(["box", "round", "trunk", "roof", "window"] as Kind[]).map(kind => <Batch key={kind} kind={kind} shapes={shapes} reduced={reduced} />)}
    <PassingCar offset={0} color="#b8c7a6" reduced={reduced} />
    {graphics === "high" && <PassingCar offset={20} color="#dea895" reduced={reduced} />}
    {Array.from({length: graphics === "high" ? 3 : 1}, (_, index) => <EveningWalker key={index} index={index} reduced={reduced} />)}
    <instancedMesh ref={lights} args={[undefined, glowMaterial, 4]} frustumCulled={false}><circleGeometry args={[.5, 16]} /></instancedMesh>
  </group>;
}
