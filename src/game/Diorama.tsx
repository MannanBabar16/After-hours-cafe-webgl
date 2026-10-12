import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  Box,
  Ball,
  Cylinder,
  Label,
  GroundShadow,
  material,
} from "./primitives";
import { SoftBox, Oak, Rod, Ring, palette as p, oakMaterial } from "./art";
import { tableCenters, layout } from "../data/layout";
import { useGame } from "../store/game";
import { walkable } from "./navigation";
export const isWalkable = (x: number, z: number) =>
  walkable(x, z, useGame.getState().purchased);

const leafGeometry = new THREE.SphereGeometry(1, 10, 6);
const stemGeometry = new THREE.CylinderGeometry(1, 1, 1, 6);
function Foliage({ hanging }: { hanging: boolean }) {
  const leaves = useRef<THREE.InstancedMesh>(null), stems = useRef<THREE.InstancedMesh>(null);
  const count = hanging ? 18 : 9;
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) {
      const index = i % 9, tail = i >= 9;
      const yaw = new THREE.Quaternion().setFromAxisAngle(up, index * 2.4);
      const base = new THREE.Vector3(0, .37 + (index % 3) * .14, 0);
      const from = tail ? new THREE.Vector3(.1, .05, 0) : new THREE.Vector3();
      const to = tail ? new THREE.Vector3(.24, -.2 - (index % 3) * .12, 0) : new THREE.Vector3(.17, .16, 0);
      const direction = to.clone().sub(from);
      dummy.position.copy(from.clone().add(to).multiplyScalar(.5).applyQuaternion(yaw).add(base));
      dummy.quaternion.copy(yaw).multiply(new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize()));
      dummy.scale.set(.01, direction.length(), .01); dummy.updateMatrix(); stems.current!.setMatrixAt(i, dummy.matrix);
      dummy.position.set(tail ? .23 : .17, tail ? -.17 - (index % 3) * .12 : .14, 0).applyQuaternion(yaw).add(base);
      dummy.quaternion.copy(yaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), tail ? 0 : .45));
      dummy.scale.set(tail ? .105 : .19, .055, tail ? .095 : .11); dummy.updateMatrix(); leaves.current!.setMatrixAt(i, dummy.matrix);
      leaves.current!.setColorAt(i, new THREE.Color(index % 2 ? "#5aa86c" : "#9ac777"));
    }
    leaves.current!.instanceMatrix.needsUpdate = true;
    leaves.current!.instanceColor!.needsUpdate = true;
    stems.current!.instanceMatrix.needsUpdate = true;
    leaves.current!.computeBoundingSphere(); stems.current!.computeBoundingSphere();
  }, [count]);
  return <>
    <instancedMesh ref={leaves} args={[leafGeometry, material("#ffffff", 0, .85), count]} receiveShadow />
    <instancedMesh ref={stems} args={[stemGeometry, material("#508355"), count]} />
  </>;
}

export function Plant({
  position,
  scale = 1,
  hanging = false,
}: {
  position: [number, number, number];
  scale?: number;
  hanging?: boolean;
}) {
  const leaves = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (leaves.current)
      leaves.current.rotation.z =
        Math.sin(clock.elapsedTime * 0.65 + position[0]) * 0.007;
  });
  return (
    <group position={position} scale={scale}>
      <mesh
        position={[0, 0.18, 0]}
        material={material(p.terra, 0, 0.85)}
        castShadow
      >
        <cylinderGeometry args={[0.23, 0.17, 0.36, 14]} />
      </mesh>
      <Ring
        r={0.22}
        t={0.025}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.35, 0]}
        color="#c58f72"
      />
      <Cylinder
        position={[0, 0.355, 0]}
        scale={[0.205, 0.018, 0.205]}
        color="#5f4633"
      />
      <group ref={leaves}>
        <Foliage hanging={hanging} />
      </group>
      <GroundShadow position={[0, 0.008, 0]} size={0.75} />
    </group>
  );
}
export function Chair({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Cylinder
        position={[0, 0.43, 0]}
        scale={[0.31, 0.1, 0.29]}
        color={p.oak}
        rough={0.82}
      />
      <Cylinder
        position={[0, 0.485, 0]}
        scale={[0.265, 0.055, 0.255]}
        color={p.sage}
        rough={0.96}
      />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <Rod
            key={x + ":" + z}
            from={[x * 0.24, 0.41, z * 0.22]}
            to={[x * 0.31, 0.035, z * 0.29]}
            r={0.032}
          />
        )),
      )}
      {[-0.21, -0.105, 0, 0.105, 0.21].map((x) => (
        <Rod
          key={x}
          from={[x, 0.43, -0.235]}
          to={[x * 0.9, 1.05, -0.29]}
          r={0.02}
        />
      ))}
      <mesh
        position={[0, 0.94, -0.16]}
        rotation={[Math.PI / 2, 0, 0]}
        material={oakMaterial}
        castShadow
      >
        <torusGeometry args={[0.31, 0.037, 8, 20, Math.PI]} />
      </mesh>
      <GroundShadow position={[0, 0.008, 0]} size={0.9} />
    </group>
  );
}
export function Table({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Cylinder
        position={[0, 0.81, 0]}
        scale={[0.63, 0.115, 0.63]}
        color={p.oak}
        rough={0.76}
      />
      <Cylinder
        position={[0, 0.39, 0]}
        scale={[0.065, 0.76, 0.065]}
        color={p.forest}
        metal={0.25}
      />
      <Cylinder
        position={[0, 0.04, 0]}
        scale={[0.3, 0.07, 0.3]}
        color="#4d5245"
      />
      <Plant position={[0.15, 0.875, 0.05]} scale={0.28} />
      <SoftBox
        position={[-0.24, 0.881, -0.08]}
        size={[0.22, 0.008, 0.27]}
        radius={0.015}
        color={p.cream}
      />
      <Chair position={[0, 0, 0.88]} rotation={Math.PI} />
      <Chair position={[0, 0, -0.88]} />
      <GroundShadow position={[0, 0.01, 0]} size={1.8} />
    </group>
  );
}
export function Pendant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Rod from={[0, 0.35, 0]} to={[0, 1.05, 0]} r={0.012} color={p.coffee} />
      <mesh material={material(p.sage, 0.15, 0.5)} castShadow>
        <cylinderGeometry args={[0.095, 0.29, 0.23, 20, 1, true]} />
      </mesh>
      <Ring
        r={0.286}
        t={0.017}
        position={[0, -0.116, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        color="#b5b593"
      />
      <Ball
        position={[0, -0.1, 0]}
        scale={[0.11, 0.085, 0.11]}
        color={p.light}
      />
      <mesh position={[0, -0.123, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.265, 20]} />
        <meshBasicMaterial color="#ffdda7" />
      </mesh>
      <Cylinder
        position={[0, 0.18, 0]}
        scale={[0.04, 0.11, 0.04]}
        color="#b59a69"
        metal={0.6}
      />
    </group>
  );
}
function Floor() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(() => new THREE.BoxGeometry(0.27, 0.055, 1.98), []);
  const count = 42 * 4;
  const matrix = useMemo(() => new THREE.Object3D(), []);
  const initialized = useRef(false);
  useFrame(() => {
    if (!mesh.current || initialized.current) return;
    for (let i = 0; i < count; i++) {
      matrix.position.set(
        -5.55 + (i % 42) * 0.267,
        0,
        -2.52 + Math.floor(i / 42) * 1.98,
      );
      matrix.updateMatrix();
      mesh.current.setMatrixAt(i, matrix.matrix);
      mesh.current.setColorAt(
        i,
        new THREE.Color(i % 4 ? "#f3d7b4" : "#dcc0a3"),
      );
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    initialized.current = true;
  });
  return (
    <>
      <Oak position={[0, -0.19, 0.5]} size={[11.8, 0.38, 8.4]} />
      <instancedMesh
        ref={mesh}
        args={[geom, oakMaterial, count]}
        receiveShadow
      />
      <Oak position={[3.5, -0.19, -4.95]} size={[4.6, 0.38, 3.05]} />
      <SoftBox
        position={[3.5, 0.016, -4.95]}
        size={[4.42, 0.04, 2.94]}
        radius={0.02}
        color="#dfd6bf"
      />
      <SoftBox
        position={[3.28, 0.035, -0.65]}
        size={[4.84, 0.04, 5.3]}
        radius={0.04}
        color="#e4d6bf"
      />
      {Array.from({ length: 10 }, (_, i) => (
        <Box
          key={i}
          position={[3.26, 0.058, -3.03 + i * 0.53]}
          scale={[4.79, 0.006, 0.009]}
          color="#cfc3ae"
          shadow={false}
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <Box
          key={i}
          position={[0.96 + i * 0.54, 0.058, -0.62]}
          scale={[0.009, 0.006, 5.19]}
          color="#cfc3ae"
          shadow={false}
        />
      ))}
    </>
  );
}
function Tiles({ x, z, width }: { x: number; z: number; width: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const rows = 8,
    cols = Math.floor(width / 0.55);
  const m = useMemo(() => new THREE.Object3D(), []);
  const initialized = useRef(false);
  useFrame(() => {
    if (!ref.current || initialized.current) return;
    for (let i = 0; i < rows * cols; i++) {
      const row = Math.floor(i / cols);
      m.position.set(
        x - width / 2 + 0.27 + (i % cols) * 0.55 + (row % 2) * 0.1,
        0.35 + row * 0.34,
        z + 0.012,
      );
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
      ref.current.setColorAt(i, new THREE.Color(i % 7 ? "#f4e8d6" : "#eadcc8"));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    initialized.current = true;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, material(p.cream), rows * cols]}
      receiveShadow
    >
      <boxGeometry args={[0.535, 0.326, 0.024]} />
    </instancedMesh>
  );
}
function Arch({
  position,
  width = 1.65,
  height = 2.75,
  rotation = 0,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
  rotation?: number;
}) {
  const r = width / 2;
  const glass = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-r, 0);
    s.lineTo(r, 0);
    s.lineTo(r, height - r);
    s.absarc(0, height - r, r, 0, Math.PI, false);
    s.lineTo(-r, 0);
    return new THREE.ShapeGeometry(s);
  }, [r, height]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={glass}>
        <meshStandardMaterial
          color="#91afb2"
          transparent
          opacity={0.14}
          roughness={0.14}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Rod
        from={[-r, 0, 0.025]}
        to={[-r, height - r, 0.025]}
        r={0.06}
        color={p.forest}
      />
      <Rod
        from={[r, 0, 0.025]}
        to={[r, height - r, 0.025]}
        r={0.06}
        color={p.forest}
      />
      <mesh position={[0, height - r, 0.025]} material={material(p.forest)}>
        <torusGeometry args={[r, 0.06, 8, 40, Math.PI]} />
      </mesh>
      <Rod from={[-r, 0, 0.025]} to={[r, 0, 0.025]} r={0.06} color={p.forest} />
      <Rod
        from={[0, 0, 0.025]}
        to={[0, height, 0.025]}
        r={0.035}
        color={p.forest}
      />
      <Rod
        from={[-r, height * 0.47, 0.025]}
        to={[r, height * 0.47, 0.025]}
        r={0.035}
        color={p.forest}
      />
      <Oak position={[0, -0.08, 0.08]} size={[width + 0.22, 0.13, 0.3]} />
    </group>
  );
}
function Picture({
  position,
  rotation = 0,
  flower = false,
}: {
  position: [number, number, number];
  rotation?: number;
  flower?: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <SoftBox size={[0.68, 0.85, 0.075]} radius={0.025} color={p.oak} />
      <SoftBox
        position={[0, 0, 0.045]}
        size={[0.57, 0.74, 0.018]}
        radius={0.015}
        color="#f3e5cc"
      />
      <Rod
        from={[0, -0.2, 0.06]}
        to={[0, 0.14, 0.06]}
        r={0.009}
        color="#879567"
      />
      {[-1, 1].map((side) => (
        <Ball
          key={side}
          position={[side * 0.08, -0.02, 0.068]}
          rotation={[0, 0, -side * 0.45]}
          scale={[0.095, 0.035, 0.008]}
          color={flower ? p.terra : p.sage}
        />
      ))}
      <Ball
        position={[0, 0.2, 0.068]}
        scale={[0.09, 0.08, 0.012]}
        color={flower ? "#d6a17d" : "#8a9d70"}
      />
    </group>
  );
}
function Sofa() {
  return (
    <group position={[-4.85, 0, 1.65]} rotation={[0, Math.PI / 2, 0]}>
      <SoftBox
        position={[0, 0.33, 0]}
        size={[1.8, 0.54, 0.79]}
        radius={0.14}
        color={p.forest}
      />
      <SoftBox
        position={[0, 0.8, -0.33]}
        size={[1.78, 0.85, 0.25]}
        radius={0.13}
        color={p.sage}
      />
      {[-0.48, 0.48].map((x) => (
        <SoftBox
          key={x}
          position={[x, 0.54, 0.05]}
          size={[0.83, 0.23, 0.68]}
          radius={0.105}
          color="#8a9f7f"
          rough={0.96}
        />
      ))}
      {[-1, 1].map((x) => (
        <SoftBox
          key={x}
          position={[x * 0.87, 0.62, 0]}
          size={[0.22, 0.65, 0.9]}
          radius={0.11}
          color={p.sage}
        />
      ))}
      <SoftBox
        position={[-0.5, 0.8, -0.11]}
        rotation={[0, 0, -0.14]}
        size={[0.43, 0.45, 0.16]}
        radius={0.08}
        color={p.pink}
      />
      <SoftBox
        position={[0.48, 0.82, -0.11]}
        rotation={[0, 0, 0.14]}
        size={[0.42, 0.4, 0.15]}
        radius={0.08}
        color="#ded2b1"
      />
      <GroundShadow position={[0, 0.006, 0]} size={2.5} />
    </group>
  );
}
function Bookcase() {
  return (
    <group position={[-5.47, 0, -2.45]} rotation={[0, Math.PI / 2, 0]}>
      <Oak position={[-0.46, 1.05, 0]} size={[0.1, 2.1, 0.48]} />
      <Oak position={[0.46, 1.05, 0]} size={[0.1, 2.1, 0.48]} />
      {[0.18, 0.78, 1.4, 2.02].map((y) => (
        <Oak key={y} position={[0, y, 0]} size={[1.02, 0.07, 0.5]} />
      ))}
      {Array.from({ length: 15 }, (_, i) => (
        <SoftBox
          key={i}
          position={[
            -0.36 + (i % 5) * 0.17,
            0.44 + Math.floor(i / 5) * 0.6,
            0.04,
          ]}
          size={[0.115, 0.39 + (i % 3) * 0.035, 0.28]}
          radius={0.008}
          color={[p.sage, p.terra, "#d7ba83", "#79949b", "#aa8b6d"][i % 5]}
          rotation={[0, 0, ((i % 3) - 1) * 0.03]}
        />
      ))}
      <Plant position={[0, 2.07, 0]} scale={0.5} />
    </group>
  );
}
function Counter({
  position,
  length = 3.05,
  rotation = 0,
}: {
  position: [number, number, number];
  length?: number;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <SoftBox
        position={[0, 0.55, 0]}
        size={[length, 1.05, 0.86]}
        radius={0.07}
        color={p.forest}
      />
      <Oak position={[0, 1.105, 0]} size={[length + 0.15, 0.16, 1.03]} />
      <SoftBox
        position={[0, 0.08, 0.02]}
        size={[length - 0.08, 0.1, 0.89]}
        radius={0.025}
        color="#56654a"
      />
      {Array.from({ length: Math.floor(length / 0.19) }, (_, i) => (
        <SoftBox
          key={i}
          position={[-length / 2 + 0.13 + i * 0.19, 0.59, 0.444]}
          size={[0.17, 0.85, 0.026]}
          radius={0.015}
          color={i % 3 ? p.sage : "#829783"}
        />
      ))}
      {[-1, 1].map((x) => (
        <Rod
          key={x}
          from={[x * length * 0.28, 0.84, 0.48]}
          to={[x * length * 0.28 + 0.13, 0.84, 0.48]}
          r={0.016}
          color="#b8a176"
        />
      ))}
      <GroundShadow position={[0, 0.014, 0]} size={length + 1} />
    </group>
  );
}
function Architecture() {
  const first = useGame(
    (s) =>
      s.cameraMode === "first" && s.phase !== "title" && s.phase !== "summary",
  );
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-5.85, 0);
    s.lineTo(0.8, 0);
    s.lineTo(0.8, 3.3);
    s.lineTo(-5.85, 3.3);
    s.closePath();
    const h = new THREE.Path();
    h.moveTo(-4.48, 0.45);
    h.lineTo(-4.48, 2.25);
    h.absarc(-3.65, 2.25, 0.83, Math.PI, 0, true);
    h.lineTo(-2.82, 0.45);
    h.closePath();
    s.holes.push(h);
    return new THREE.ExtrudeGeometry(s, { depth: 0.17, bevelEnabled: false });
  }, []);
  return (
    <>
      <mesh
        geometry={shape}
        position={[0, 0, -3.68]}
        material={material(p.cream)}
        castShadow
        receiveShadow
      />
      <Tiles x={-0.72} z={-3.5} width={2.7} />
      <Tiles x={-5.23} z={-3.5} width={1.05} />
      <Arch position={[-3.65, 0.45, -3.48]} />
      <Oak position={[-2.52, 3.26, -3.53]} size={[6.8, 0.18, 0.26]} />
      <SoftBox
        position={[-5.85, 0.37, 0.46]}
        size={[0.19, 0.75, 8.15]}
        radius={0.02}
        color={p.cream}
      />
      {[-3.5, -0.2, 4.45].map((z) => (
        <SoftBox
          key={z}
          position={[-5.85, 1.66, z]}
          size={[0.21, 3.3, 0.21]}
          radius={0.025}
          color={p.sage}
        />
      ))}
      <Oak position={[-5.85, 3.23, 0.47]} size={[0.27, 0.16, 8.4]} />
      {[-1.95, 2.08].map((z) => (
        <Arch
          key={z}
          position={[-5.73, 0.6, z]}
          rotation={Math.PI / 2}
          width={2.4}
          height={2.5}
        />
      ))}
      <SoftBox
        position={[3.5, 1.65, -6.5]}
        size={[4.75, 3.3, 0.18]}
        radius={0.025}
        color={p.cream}
      />
      <Oak position={[3.5, 3.25, -6.5]} size={[4.84, 0.17, 0.26]} />
      <SoftBox
        position={[1.16, 1.6, -5.08]}
        size={[0.16, 3.2, 2.84]}
        radius={0.025}
        color={p.cream}
      />
      <SoftBox
        position={[2.91, first ? 1.65 : 0.45, -3.55]}
        size={[3.4, first ? 3.3 : 0.9, 0.17]}
        radius={0.02}
        color={p.cream}
      />
      <Oak
        position={[2.91, first ? 3.3 : 0.89, -3.55]}
        size={[3.55, 0.1, 0.24]}
      />
      <SoftBox
        position={[5.72, 1.65, -3.55]}
        size={[0.2, 3.3, 0.2]}
        radius={0.03}
        color={p.sage}
      />
      <SoftBox
        position={[5.07, 2.96, -3.55]}
        size={[1.38, 0.62, 0.2]}
        radius={0.03}
        color={p.sage}
      />
      {[-4.58, -1.37].map((z, i) => (
        <SoftBox
          key={z}
          position={[5.83, first ? 1.65 : 0.48, z]}
          size={[0.2, first ? 3.3 : 0.96, i ? 4.5 : 3.8]}
          radius={0.025}
          color={p.cream}
        />
      ))}
      <SoftBox
        position={[5.83, 0.36, 2.45]}
        size={[0.2, 0.72, 2.4]}
        radius={0.025}
        color={p.cream}
      />
      <SoftBox
        position={[5.83, first ? 1.65 : 0.48, 4.18]}
        size={[0.2, first ? 3.3 : 0.96, 0.8]}
        radius={0.025}
        color={p.cream}
      />
      <group position={[0, 0, 4.6]}>
        <SoftBox
          position={[0.7, 0.39, 0]}
          size={[9.55, 0.78, 0.2]}
          radius={0.03}
          color={p.cream}
        />
        <SoftBox
          position={[-5.54, 1.57, 0]}
          size={[0.17, 3.15, 0.2]}
          radius={0.03}
          color={p.sage}
        />
        <SoftBox
          position={[-4.17, 1.57, 0]}
          size={[0.17, 3.15, 0.2]}
          radius={0.03}
          color={p.sage}
        />
        <SoftBox
          position={[-4.85, 3.07, 0]}
          size={[1.6, 0.17, 0.25]}
          radius={0.04}
          color={p.sage}
        />
        <Oak position={[0.7, 0.81, 0]} size={[9.62, 0.11, 0.32]} />
        {first && (
          <>
            <SoftBox
              position={[0.69, 2.95, 0]}
              size={[9.52, 0.65, 0.22]}
              radius={0.02}
              color={p.sage}
            />
            {[-3.8, -0.7, 2.3, 5.35].map((x) => (
              <SoftBox
                key={x}
                position={[x, 1.85, 0]}
                size={[0.1, 2.2, 0.2]}
                radius={0.02}
                color={p.sage}
              />
            ))}
            <mesh position={[0.76, 1.88, 0]}>
              <boxGeometry args={[9.0, 2.1, 0.025]} />
              <meshStandardMaterial
                color="#99b5b9"
                transparent
                opacity={0.12}
                depthWrite={false}
              />
            </mesh>
          </>
        )}
      </group>
      {first && (
        <>
          <SoftBox
            position={[0, 3.46, 0.42]}
            size={[11.6, 0.12, 8.05]}
            radius={0.02}
            color="#ece0cd"
          />
          <SoftBox
            position={[3.51, 3.46, -4.95]}
            size={[4.62, 0.12, 3.06]}
            radius={0.02}
            color="#ece0cd"
          />
          {[-3.0, 0, 3.1].map((z) => (
            <Oak key={z} position={[0, 3.34, z]} size={[11.66, 0.16, 0.12]} />
          ))}
        </>
      )}
    </>
  );
}
function ServiceWindow() {
  const orders = useGame((s) => s.ops.orders);
  const active = orders.some(
    (o) => o.channel === "drive" && o.vehiclePhase === "waiting",
  );
  const panel = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (panel.current)
      panel.current.position.z = THREE.MathUtils.damp(
        panel.current.position.z,
        active ? -0.8 : 0,
        6,
        dt,
      );
  });
  return (
    <group position={[5.83, 0, 2.45]}>
      <SoftBox
        position={[0, 1.78, -1.1]}
        size={[0.22, 2.18, 0.16]}
        radius={0.04}
        color={p.forest}
      />
      <SoftBox
        position={[0, 1.78, 1.1]}
        size={[0.22, 2.18, 0.16]}
        radius={0.04}
        color={p.forest}
      />
      <SoftBox
        position={[0, 2.85, 0]}
        size={[0.22, 0.15, 2.35]}
        radius={0.04}
        color={p.forest}
      />
      <Oak position={[0.14, 0.81, 0]} size={[0.72, 0.12, 2.35]} />
      <group ref={panel}>
        <mesh position={[0, 2.0, -0.52]}>
          <boxGeometry args={[0.035, 1.6, 0.99]} />
          <meshStandardMaterial
            color="#b5c9bd"
            transparent
            opacity={0.13}
            roughness={0.13}
            depthWrite={false}
          />
        </mesh>
        <SoftBox
          position={[-0.02, 2.0, -0.03]}
          size={[0.045, 1.72, 0.055]}
          radius={0.02}
          color={p.sage}
        />
      </group>
      <mesh position={[0, 2.0, 0.53]}>
        <boxGeometry args={[0.025, 1.6, 0.99]} />
        <meshStandardMaterial
          color="#aac5ba"
          transparent
          opacity={0.12}
          roughness={0.15}
          depthWrite={false}
        />
      </mesh>
      <SoftBox
        position={[0, 2.0, 1.07]}
        size={[0.065, 1.72, 0.06]}
        radius={0.02}
        color={p.sage}
      />
      <group position={[0.52, 2.96, 0]} rotation={[0, 0, -0.08]}>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} position={[0, 0, -0.99 + i * 0.33]}>
            <SoftBox
              size={[1.05, 0.11, 0.33]}
              radius={0.025}
              color={i % 2 ? p.sage : p.cream}
            />
            <SoftBox
              position={[0.51, -0.11, 0]}
              size={[0.09, 0.22, 0.33]}
              radius={0.045}
              color={i % 2 ? p.sage : p.cream}
            />
          </group>
        ))}
      </group>
      <Label
        position={[0.13, 2.62, 0]}
        rotation={[0, Math.PI / 2, 0]}
        text="PICKUP · DRIVE THRU"
        size={[1.82, 0.29]}
        font={58}
        background={p.forest}
        color={p.cream}
      />
      <Ball position={[0.25, 2.75, -0.85]} scale={0.075} color={p.light} />
      <pointLight
        position={[0.65, 2.6, 0]}
        color={p.light}
        intensity={1.5}
        distance={3}
      />
      <Cylinder
        position={[-0.22, 1.05, 0.84]}
        scale={[0.06, 0.06, 0.06]}
        color="#c2a36d"
        metal={0.7}
      />
    </group>
  );
}
function Exterior() {
  const open = useGame((s) => s.ops.open);
  return (
    <>
      <SoftBox
        position={[1.15, -0.48, 0.85]}
        size={[14.8, 0.54, 15.5]}
        radius={0.22}
        color="#686e65"
      />
      <SoftBox
        position={[1.15, -0.23, 0.85]}
        size={[14.3, 0.07, 15.2]}
        radius={0.12}
        color="#aeada1"
      />
      <SoftBox
        position={[6.98, -0.176, 0.85]}
        size={[2.32, 0.05, 15.1]}
        radius={0.04}
        color="#465965"
        rough={0.34}
      />
      <SoftBox
        position={[-0.2, -0.17, 5.98]}
        size={[11.88, 0.065, 2.95]}
        radius={0.02}
        color="#969f99"
      />
      {Array.from({ length: 18 }, (_, i) => (
        <Box
          key={i}
          position={[-5.65 + i * 0.65, -0.125, 5.98]}
          scale={[0.011, 0.008, 2.9]}
          color="#7f8b85"
          shadow={false}
        />
      ))}
      {[5.28, 6.0, 6.72].map((z) => (
        <Box
          key={z}
          position={[-0.15, -0.116, z]}
          scale={[11.8, 0.008, 0.011]}
          color="#7f8b85"
          shadow={false}
        />
      ))}
      {[0.12, 0.26, 0.4].map((h, i) => (
        <SoftBox
          key={h}
          position={[-4.84, -h + 0.17, 4.68 + i * 0.28]}
          size={[1.68, 0.14, 1.02 - i * 0.18]}
          radius={0.045}
          color="#d1cbbc"
        />
      ))}
      <group position={[-4.85, 3.08, 4.7]}>
        {Array.from({ length: 5 }, (_, i) => (
          <group key={i} position={[-0.75 + i * 0.375, 0, 0]}>
            <SoftBox
              size={[0.375, 0.1, 1.06]}
              radius={0.02}
              color={i % 2 ? p.cream : p.sage}
            />
            <SoftBox
              position={[0, -0.12, 0.5]}
              size={[0.375, 0.25, 0.09]}
              radius={0.045}
              color={i % 2 ? p.cream : p.sage}
            />
          </group>
        ))}
      </group>
      <Label
        position={[-4.85, 2.66, 4.7]}
        text={open ? "OPEN · AFTER HOURS" : "AFTER HOURS · CAFÉ"}
        size={[1.15, 0.25]}
        font={60}
        background={p.forest}
        color={p.cream}
      />
      {[-3.4, 2.25, 4.55].map((x, i) => (
        <group key={x}>
          <SoftBox
            position={[x, 0.13, 4.95]}
            size={[i === 2 ? 1.13 : 1.62, 0.42, 0.46]}
            radius={0.06}
            color={p.terra}
          />
          {[-0.53, 0, 0.53].map((dx) => (
            <Plant key={dx} position={[x + dx, 0.32, 4.95]} scale={0.42} />
          ))}
          {[-0.45, 0, 0.45].map((dx) => (
            <Ball
              key={dx}
              position={[x + dx, 0.63, 5.03]}
              scale={0.06}
              color={i % 2 ? "#e8b47f" : "#deb3ac"}
            />
          ))}
        </group>
      ))}
      <Plant position={[-5.55, -0.05, 5.4]} scale={0.95} />
      <Plant position={[5.28, -0.05, 4.92]} scale={0.85} />
      <group position={[-5.3, 0, 6.6]}>
        <Rod from={[0, 0, 0]} to={[0, 2.48, 0]} r={0.04} color={p.forest} />
        <SoftBox
          position={[0, 2.49, 0]}
          size={[0.32, 0.5, 0.32]}
          radius={0.06}
          color="#ebc887"
        />
        <SoftBox
          position={[0, 2.78, 0]}
          size={[0.4, 0.11, 0.4]}
          radius={0.04}
          color={p.forest}
        />
        <pointLight
          position={[0, 2.4, 0]}
          intensity={2}
          color={p.light}
          distance={4}
        />
      </group>
      <group position={[-3.63, 0.42, 5.65]} rotation={[-0.17, 0, 0]}>
        <SoftBox size={[0.66, 0.91, 0.07]} radius={0.035} color={p.oak} />
        <Label
          position={[0, 0, 0.043]}
          text="GOOD COFFEE\nBRIGHTER NIGHTS\n♡"
          size={[0.54, 0.78]}
          font={70}
          background={p.forest}
          color={p.cream}
        />
      </group>
    </>
  );
}
export function Environment() {
  const purchased = useGame((s) => s.purchased),
    theme = useGame((s) => s.business.theme);
  return (
    <>
      <Exterior />
      <Floor />
      <Architecture />
      <ServiceWindow />
      <Counter position={[2.3, 0, -2.7]} length={4.5} />
      <Counter position={[0.52, 0, 0.25]} length={3.3} rotation={Math.PI / 2} />
      <Counter
        position={[5.05, 0, -0.25]}
        length={1.8}
        rotation={Math.PI / 2}
      />
      <Counter position={[2.4, 0, -4.05]} length={1.7} />
      <SoftBox
        position={[-3.45, 0.04, -1.45]}
        size={[2.6, 0.03, 2.5]}
        radius={0.15}
        color="#d5c5a6"
      />
      <SoftBox
        position={[-3.45, 0.04, 1.4]}
        size={[2.6, 0.03, 2.5]}
        radius={0.15}
        color="#d5c5a6"
      />
      <SoftBox
        position={[-1.55, 0.04, 2.8]}
        size={[2.0, 0.03, 2.3]}
        radius={0.12}
        color="#d8c9b1"
      />
      {tableCenters.map(([x, z]) => (
        <Table key={z} position={[x, 0, z]} />
      ))}
      <Sofa />
      <Bookcase />
      <Picture position={[-1.66, 2.27, -3.42]} flower />
      <Picture position={[-5.02, 2.35, -3.42]} />
      <Picture position={[-5.69, 2.14, 3.32]} rotation={Math.PI / 2} flower />
      <Label
        position={[-0.16, 2.33, -3.43]}
        text="MENU\nESPRESSO  ·  4\nAMERICANO  ·  5\nLATTE  ·  6\nCAPPUCCINO  ·  6\nWARM COOKIES"
        size={[1.16, 1.47]}
        font={72}
        background={p.forest}
        color={p.cream}
      />
      <Oak position={[-1.65, 1.7, -3.21]} size={[1.03, 0.1, 0.42]} />
      <Plant position={[-1.72, 1.75, -3.2]} scale={0.55} hanging />
      <Oak position={[2.25, 2.77, -3.18]} size={[3.63, 0.105, 0.46]} />
      {[0.9, 1.35, 3.4, 3.75].map((x, i) => (
        <group key={x}>
          <Cylinder
            position={[x, 2.92, -3.18]}
            scale={[0.09, 0.22, 0.09]}
            color={i % 2 ? "#d2bf9c" : p.cream}
          />
          <Cylinder
            position={[x, 3.04, -3.18]}
            scale={[0.092, 0.025, 0.092]}
            color={p.oak}
          />
        </group>
      ))}
      <Plant position={[4.27, 2.85, -3.18]} scale={0.55} hanging />
      <Plant position={[-2.35, 0, -2.7]} scale={1.05} />
      <Plant position={[-5.4, 0, -0.23]} scale={0.8} />
      <Plant position={[-5.24, 0, 3.65]} scale={0.65} />
      <Plant position={[1.39, 1.22, 1.84]} scale={0.42} />
      <Plant position={[4.3, 1.22, -3.1]} scale={0.36} />
      <Plant position={[5.15, 0, 1.07]} scale={0.65} />
      <Pendant position={[-3.45, 2.64, -1.45]} />
      <Pendant position={[-3.45, 2.64, 1.45]} />
      <Pendant position={[-1.45, 2.7, 2.85]} />
      <Pendant position={[2.35, 2.95, -1.3]} />
      <Pendant position={[3.7, 2.84, -5.0]} />
      {purchased.includes("lamp") && (
        <group position={[-2.16, 0, -3.15]}>
          <Rod from={[0, 0, 0]} to={[0, 1.5, 0]} r={0.025} color="#a98a61" />
          <SoftBox
            position={[0, 1.5, 0]}
            size={[0.37, 0.4, 0.37]}
            radius={0.055}
            color="#e3c896"
          />
          <pointLight
            position={[0, 1.45, 0]}
            color={p.light}
            intensity={1.5}
            distance={3}
          />
        </group>
      )}
      {theme === "rose" && (
        <SoftBox
          position={[-0.25, 1.17, 1.0]}
          size={[0.012, 0.9, 1.3]}
          radius={0.01}
          color="#b99187"
        />
      )}
      {theme === "midnight" && (
        <SoftBox
          position={[-0.25, 1.17, 1.0]}
          size={[0.012, 0.9, 1.3]}
          radius={0.01}
          color="#577a79"
        />
      )}
      <SoftBox
        position={[layout.cat[0], 0.055, layout.cat[2]]}
        size={[0.5, 0.1, 0.53]}
        radius={0.15}
        color="#899a7a"
      />
    </>
  );
}
