import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Box, Ball, Cylinder, Cup, Label } from "./primitives";
import { useGame } from "../store/game";

function Steam({
  active,
  position,
}: {
  active: boolean;
  position: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.visible = active;
    group.current.children.forEach((particle, i) => {
      const p = (clock.elapsedTime * 0.45 + i * 0.17) % 1;
      particle.position.set(
        Math.sin(clock.elapsedTime * 1.5 + i) * 0.07,
        p * 0.7,
        Math.cos(i + clock.elapsedTime) * 0.035,
      );
      particle.scale.setScalar(0.025 + p * 0.055);
      (
        particle as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
      ).material.opacity = (1 - p) * 0.2;
    });
  });
  return (
    <group ref={group} position={position}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#f5e4c5" transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
export function CoffeeMachine() {
  const brew = useGame((s) => s.brew);
  const enhanced = useGame((s) => s.purchased.includes("machine"));
  const cupColor = useGame((s) => s.business.cup);
  const vibrating = useRef<THREE.Group>(null);
  const cup = useRef<THREE.Group>(null);
  const stream = useRef<THREE.Mesh>(null);
  const active = brew.stage === "extracting";
  const isMilk =
    ["pour", "foam", "ready"].includes(brew.stage) &&
    !["espresso", "americano"].includes(brew.recipe);
  const fill =
    brew.stage === "empty" || brew.stage === "placed"
      ? 0
      : active
        ? brew.progress
        : isMilk
          ? 1
          : 0.8;
  useFrame(({ clock }, dt) => {
    if (vibrating.current)
      vibrating.current.position.x = active
        ? Math.sin(clock.elapsedTime * 65) * 0.002
        : 0;
    if (cup.current) {
      cup.current.position.y = THREE.MathUtils.damp(
        cup.current.position.y,
        brew.stage === "empty" ? 0.22 : 0,
        13,
        dt,
      );
      cup.current.scale.setScalar(
        THREE.MathUtils.damp(cup.current.scale.x, 1, 9, dt),
      );
    }
    if (stream.current)
      stream.current.scale.x = 0.8 + Math.sin(clock.elapsedTime * 33) * 0.16;
  });
  return (
    <group position={[-1.6, 1.455, -3.18]}>
      <group ref={vibrating}>
        <Box
          position={[0, 0.41, 0]}
          scale={[1.7, 0.79, 0.67]}
          color={enhanced ? "#6c8e7a" : "#577365"}
          metal={0.25}
          rough={0.38}
        />
        <Box
          position={[0, 0.73, 0.015]}
          scale={[1.79, 0.12, 0.77]}
          color={enhanced ? "#c2a36b" : "#b8b8a5"}
          metal={0.6}
          rough={0.27}
        />
        <Box
          position={[0, 0.035, 0.2]}
          scale={[1.8, 0.07, 1.01]}
          color="#bcc1b3"
          metal={0.65}
          rough={0.24}
        />
        <Box
          position={[0, 0.13, 0.2]}
          scale={[1.64, 0.13, 0.84]}
          color="#314a40"
        />
        <Box
          position={[0, 0.12, 0.47]}
          scale={[1.54, 0.024, 0.25]}
          color="#9caa9e"
          metal={0.65}
        />
        {Array.from({ length: 13 }, (_, i) => (
          <Box
            key={i}
            position={[-0.7 + i * 0.115, 0.136, 0.47]}
            scale={[0.008, 0.006, 0.19]}
            color="#3c4c45"
            shadow={false}
          />
        ))}
        <Box
          position={[0, 0.59, 0.348]}
          scale={[1.48, 0.2, 0.065]}
          color={enhanced ? "#d0ae6d" : "#e0d7b9"}
          metal={0.3}
        />
        <Cylinder
          position={[-0.28, 0.505, 0.36]}
          scale={[0.1, 0.12, 0.1]}
          color="#bab7a3"
          metal={0.7}
        />
        <Cylinder
          position={[-0.28, 0.434, 0.45]}
          scale={[0.07, 0.028, 0.07]}
          color="#d6cbb1"
          metal={0.7}
        />
        <Cylinder
          position={[-0.28, 0.46, 0.56]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[0.027, 0.25, 0.027]}
          color="#46372c"
        />
        <Cylinder
          position={[0.58, 0.42, 0.36]}
          rotation={[0, 0, 0.26]}
          scale={[0.017, 0.37, 0.017]}
          color="#c5cabf"
          metal={0.8}
        />
        <Ball
          position={[0.525, 0.235, 0.37]}
          scale={0.022}
          color="#a9ac9f"
          metal={0.8}
        />
        <mesh position={[0.35, 0.635, 0.392]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.018, 20]} />
          <meshStandardMaterial color="#f0e7d1" />
        </mesh>
        <Box
          position={[0.35, 0.648, 0.406]}
          rotation={[
            0,
            0,
            -0.5 + (active ? Math.sin(Date.now() / 400) * 0.1 : 0),
          ]}
          scale={[0.008, 0.066, 0.008]}
          color="#51594b"
        />
        <mesh position={[0.65, 0.636, 0.393]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial color={active ? "#e3bd74" : "#b8d1a0"} />
        </mesh>
        <Label
          text={"LUNA / 01"}
          position={[-0.34, 0.635, 0.388]}
          size={[0.48, 0.073]}
          background="#e0d7b9"
          color="#44594e"
          font={60}
        />
        <Cup position={[-0.54, 0.802, -0.13]} scale={0.65} />
        <Cup position={[-0.02, 0.802, -0.13]} scale={0.65} />
      </group>
      {[
        "placed",
        "extracting",
        "purge",
        "milk",
        "steaming",
        "pour",
        "foam",
        "water",
        "ready",
      ].includes(brew.stage) && (
        <group ref={cup} position={[0, 0.15, 0]} scale={0.88}>
          <Cup
            position={[-0.28, 0.142, 0.48]}
            scale={0.75}
            color={cupColor}
            art={brew.art}
            fill={fill}
            coffee={isMilk ? "#d5b182" : "#bd8b4d"}
            foam={
              brew.stage === "ready" &&
              !["espresso", "americano"].includes(brew.recipe)
            }
          />
        </group>
      )}
      {active && (
        <mesh ref={stream} position={[-0.28, 0.386, 0.45]}>
          <cylinderGeometry args={[0.012, 0.016, 0.1, 8]} />
          <meshStandardMaterial
            color="#85572d"
            emissive="#70401f"
            emissiveIntensity={0.2}
          />
        </mesh>
      )}
      {["milk", "steaming", "foam"].includes(brew.stage) && (
        <group position={[0.54, 0.14, 0.38]}>
          <Cylinder
            position={[0, 0.1, 0]}
            scale={[0.105, 0.21, 0.105]}
            color="#b6c3b8"
            metal={0.6}
            rough={0.3}
          />
          <Cylinder
            position={[0, 0.21, 0]}
            scale={[0.093, 0.012, 0.093]}
            color="#eddbbb"
          />
          <mesh position={[0.11, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.05, 0.012, 6, 12]} />
            <meshStandardMaterial color="#b6c3b8" metalness={0.6} />
          </mesh>
        </group>
      )}
      <Steam
        active={active || brew.stage === "ready"}
        position={[-0.28, 0.43, 0.47]}
      />
      <Steam active={brew.stage === "steaming"} position={[0.52, 0.19, 0.37]} />
      {brew.stage === "ready" && (
        <pointLight
          position={[-0.28, 0.45, 0.7]}
          color="#ffdba1"
          intensity={0.45}
          distance={1}
        />
      )}
    </group>
  );
}
