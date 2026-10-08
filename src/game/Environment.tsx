import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  Box,
  Ball,
  Cylinder,
  Cone,
  Label,
  Cup,
  GroundShadow,
} from "./primitives";
import { seats } from "../data/content";
import { useGame } from "../store/game";

export const obstacles = [
  { x: -1.8, z: -3.1, w: 7.1, d: 1.2 },
  ...seats.map(([x, z]) => ({ x, z, w: 1.1, d: 1.1 })),
  { x: -5.25, z: -0.65, w: 0.65, d: 1.3 },
];
export function isWalkable(x: number, z: number) {
  if (x < -5.5 || x > 5.5 || z < -2.2 || z > 4.05) return false;
  const purchased = useGame.getState().purchased;
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
  return !obstacles.some(
    (o) =>
      Math.abs(x - o.x) < o.w / 2 + 0.24 && Math.abs(z - o.z) < o.d / 2 + 0.24,
  );
}
function Plant({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <Cylinder
        position={[0, 0.25, 0]}
        scale={[0.29, 0.5, 0.29]}
        color="#b17d60"
      />
      <Cylinder
        position={[0, 0.51, 0]}
        scale={[0.26, 0.018, 0.26]}
        color="#3e3027"
      />
      <Cylinder
        position={[0, 0.9, 0]}
        scale={[0.027, 0.9, 0.027]}
        color="#5d7148"
      />
      {Array.from({ length: 9 }, (_, i) => (
        <group
          key={i}
          rotation={[0, i * 2.4, 0]}
          position={[0, 0.65 + i * 0.07, 0]}
        >
          <Ball
            position={[0.22, 0.11, 0]}
            rotation={[0, 0, -0.6]}
            scale={[0.29, 0.09, 0.14]}
            color={i % 2 ? "#57784f" : "#759061"}
          />
        </group>
      ))}
      <GroundShadow position={[0, 0.008, 0]} size={1.1} />
    </group>
  );
}
function Chair({
  position,
  rotation = 0,
  color = "#829273",
}: {
  position: [number, number, number];
  rotation?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box position={[0, 0.5, 0]} scale={[0.57, 0.13, 0.58]} color={color} />
      <Box
        position={[0, 0.94, -0.24]}
        scale={[0.6, 0.65, 0.09]}
        color={color}
      />
      {[-0.22, 0.22].flatMap((x) =>
        [-0.22, 0.22].map((z) => (
          <Box
            key={`${x}:${z}`}
            position={[x, 0.24, z]}
            rotation={[z * 0.14, 0, -x * 0.14]}
            scale={[0.065, 0.48, 0.065]}
            color="#855b40"
          />
        )),
      )}
    </group>
  );
}
function Table({
  position,
  upgrade = false,
}: {
  position: [number, number, number];
  upgrade?: boolean;
}) {
  return (
    <group position={position}>
      <Cylinder
        position={[0, 0.86, 0]}
        scale={[0.66, 0.11, 0.66]}
        color={upgrade ? "#d3a775" : "#a87953"}
      />
      <Cylinder
        position={[0, 0.44, 0]}
        scale={[0.055, 0.8, 0.055]}
        color="#38433b"
        metal={0.3}
      />
      <Cylinder
        position={[0, 0.05, 0]}
        scale={[0.36, 0.05, 0.36]}
        color="#38433b"
      />
      <Plant position={[0.27, 0.915, 0.13]} scale={0.2} />
      <Box
        position={[-0.2, 0.93, -0.15]}
        rotation={[0, 0.3, 0]}
        scale={[0.25, 0.022, 0.32]}
        color="#e0ccad"
      />
      <GroundShadow position={[0, 0.005, 0]} size={1.8} />
      <Chair
        position={[0, 0, 0.97]}
        rotation={Math.PI}
        color={upgrade ? "#778b6d" : "#967a5b"}
      />
      <Chair position={[0, 0, -0.97]} color={upgrade ? "#778b6d" : "#967a5b"} />
    </group>
  );
}
function Pendant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Cylinder
        position={[0, 0.75, 0]}
        scale={[0.017, 1.5, 0.017]}
        color="#43423a"
      />
      <Cone scale={[0.36, 0.32, 0.36]} color="#4b6555" />
      <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 20]} />
        <meshBasicMaterial color="#ffda95" />
      </mesh>
      <mesh position={[0, -0.21, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ffe6ab" />
      </mesh>
    </group>
  );
}
function Floor() {
  const planks = useRef<THREE.InstancedMesh>(null);
  const wood = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#b08966";
    ctx.fillRect(0, 0, 128, 512);
    for (let i = 0; i < 90; i++) {
      const x = (i * 37) % 128;
      ctx.strokeStyle = `rgba(${i % 2 ? "60,30,15" : "230,198,146"},${0.03 + (i % 4) * 0.012})`;
      ctx.lineWidth = (i % 3) + 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 6, 140, x - 5, 350, x + 3, 512);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => {
    if (!planks.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 28; i++) {
      dummy.position.set(-5.79 + i * 0.43, 0.012, 0);
      dummy.scale.set(0.416, 0.05, 9);
      dummy.updateMatrix();
      planks.current.setMatrixAt(i, dummy.matrix);
      planks.current.setColorAt(
        i,
        new THREE.Color().setHSL(0.083, 0.28, 0.53 + (i % 3) * 0.022),
      );
    }
    planks.current.instanceMatrix.needsUpdate = true;
    if (planks.current.instanceColor)
      planks.current.instanceColor.needsUpdate = true;
  }, []);
  return (
    <>
      <Box position={[0, -0.28, 0]} scale={[12.3, 0.55, 9.3]} color="#b5a58a" />
      <Box
        position={[0, -0.19, 4.66]}
        scale={[12.34, 0.1, 0.04]}
        color="#deb885"
      />
      <instancedMesh
        ref={planks}
        args={[undefined, undefined, 28]}
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={wood} roughness={0.78} />
      </instancedMesh>
      <Box
        position={[0, 0.05, -1.62]}
        scale={[5.8, 0.012, 1]}
        color="#5d6957"
        shadow={false}
      />
      <Box
        position={[0, 0.055, 2.78]}
        scale={[2.2, 0.018, 1.7]}
        color="#bbaa84"
        shadow={false}
      />
      {[-0.85, -0.6, 0.6, 0.85].map((x) => (
        <Box
          key={x}
          position={[x, 0.07, 2.78]}
          scale={[0.018, 0.01, 1.7]}
          color="#765e45"
          shadow={false}
        />
      ))}
    </>
  );
}
function Bookshelf({ position }: { position: [number, number, number] }) {
  const bookColors = ["#987255", "#849278", "#e0c895", "#8d9d9d", "#ad7d6e"];
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      <Box position={[0, 0.98, 0]} scale={[1.75, 2, 0.38]} color="#76543b" />
      {[0.2, 0.8, 1.4].map((y, j) => (
        <group key={y}>
          <Box position={[0, y, 0]} scale={[1.8, 0.07, 0.51]} color="#ab855e" />
          {Array.from({ length: 9 }, (_, i) => (
            <Box
              key={i}
              position={[-0.7 + i * 0.16, y + 0.23, 0.04]}
              rotation={[0, 0, i === 7 ? 0.13 : 0]}
              scale={[0.12, 0.25 + (i % 3) * 0.1, 0.33]}
              color={bookColors[(i + j) % 5]}
            />
          ))}
        </group>
      ))}
      <Plant position={[0.57, 2.02, 0]} scale={0.36} />
    </group>
  );
}
export const Environment = memo(function Environment() {
  const purchased = useGame((s) => s.purchased);
  const theme = useGame((s) => s.business.theme);
  const name = useGame((s) => s.business.name);
  const wall = { sage: "#d6ccb1", rose: "#c9a9a0", midnight: "#899eab" }[theme];
  return (
    <group>
      <Floor />
      <Box
        position={[0, 1.65, -4.58]}
        scale={[12.15, 3.35, 0.16]}
        color={wall}
      />
      <Box
        position={[-6.05, 1.65, -1.55]}
        scale={[0.16, 3.35, 6]}
        color="#c5bfaa"
      />
      <Box position={[0, 0.2, -4.46]} scale={[12, 0.35, 0.1]} color="#7c634a" />
      <Box
        position={[-5.94, 0.2, -1.55]}
        scale={[0.1, 0.35, 6]}
        color="#7c634a"
      />
      <Box
        position={[0, 3.28, -4.37]}
        scale={[12, 0.12, 0.2]}
        color="#9f805b"
      />
      <Box
        position={[-5.86, 3.28, -1.6]}
        scale={[0.16, 0.12, 5.9]}
        color="#9f805b"
      />
      <Label
        text={
          name === "After Hours Café"
            ? "AFTER HOURS\n카페 · 오늘도 따뜻하게"
            : `${name.toUpperCase()}\nCOFFEE · RAIN · GOOD COMPANY`
        }
        position={[-1.1, 2.56, -4.46]}
        size={[3.7, 0.86]}
        font={64}
        background={wall}
        color="#53604c"
      />
      <group position={[3.6, 2.12, -4.44]}>
        <Box scale={[1.65, 1.4, 0.08]} color="#8a6947" />
        <Label
          text={"TONIGHT’S LITTLE RITUALS\ncoffee · rain · good company"}
          position={[0, 0, 0.045]}
          size={[1.53, 1.28]}
          background="#3c5345"
          color="#d8c69c"
          font={50}
        />
      </group>
      <group position={[5.02, 2.76, -4.41]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.06, 28]} />
          <meshStandardMaterial color="#b29265" />
        </mesh>
        <mesh position={[0, 0, 0.036]}>
          <circleGeometry args={[0.218, 28]} />
          <meshStandardMaterial color="#eee2c5" />
        </mesh>
        <Box
          position={[0, 0.064, 0.044]}
          rotation={[0, 0, -0.2]}
          scale={[0.014, 0.15, 0.014]}
          color="#6c7358"
        />
        <Box
          position={[-0.047, 0.021, 0.047]}
          rotation={[0, 0, 1.15]}
          scale={[0.012, 0.125, 0.014]}
          color="#6c7358"
        />
      </group>
      <Box
        position={[-5.9, 2.58, -2.2]}
        scale={[0.24, 0.09, 1.17]}
        color="#a88a64"
      />
      <Plant position={[-5.78, 2.62, -2.38]} scale={0.36} />
      {Array.from({ length: 7 }, (_, i) => (
        <Ball
          key={`ivy-${i}`}
          position={[-5.75, 2.64 - i * 0.1, -2.15 + Math.sin(i) * 0.06]}
          rotation={[0, 0, i * 0.2]}
          scale={[0.05, 0.065, 0.09]}
          color={i % 2 ? "#6b8854" : "#7d925f"}
        />
      ))}
      <Box
        position={[-1.7, 0.67, -3.15]}
        scale={[7.5, 1.3, 1.1]}
        color="#a67750"
      />
      {Array.from({ length: 18 }, (_, i) => (
        <Box
          key={i}
          position={[-5.3 + i * 0.43, 0.66, -2.585]}
          scale={[0.025, 1.18, 0.025]}
          color="#775335"
          shadow={false}
        />
      ))}
      <Box
        position={[-1.7, 1.36, -3.15]}
        scale={[7.75, 0.15, 1.32]}
        color="#dad1b6"
      />
      <Box
        position={[-1.7, 1.44, -3.15]}
        scale={[7.78, 0.015, 1.36]}
        color="#efe5cf"
      />
      <Box
        position={[-4.25, 1.59, -3.14]}
        scale={[1.25, 0.26, 0.77]}
        color="#705744"
      />
      <mesh position={[-4.25, 1.88, -3.14]}>
        <boxGeometry args={[1.3, 0.58, 0.8]} />
        <meshPhysicalMaterial
          color="#dbe7de"
          transmission={0}
          transparent
          opacity={0.18}
          roughness={0.12}
          depthWrite={false}
        />
      </mesh>
      <Box
        position={[-4.25, 2.18, -3.14]}
        scale={[1.3, 0.045, 0.8]}
        color="#c1a579"
        metal={0.25}
      />
      {[-4.55, -4.25, -3.95].map((x, i) => (
        <group key={x}>
          <Cylinder
            position={[x, 1.75, -3.08]}
            scale={[0.12, 0.07, 0.12]}
            color={i === 1 ? "#c19352" : "#b77840"}
          />
          <Ball
            position={[x, 1.8, -3.08]}
            scale={[0.12, 0.07, 0.1]}
            color="#dca665"
          />
        </group>
      ))}
      <Label
        text={"BAKED WITH LOVE"}
        position={[-4.25, 1.6, -2.735]}
        size={[0.96, 0.14]}
        font={38}
        background="#705744"
      />
      <Box
        position={[0.25, 1.6, -3.25]}
        scale={[0.48, 0.32, 0.5]}
        color="#434e43"
      />
      <Cylinder
        position={[0.25, 1.95, -3.25]}
        scale={[0.2, 0.4, 0.2]}
        color="#7f674c"
      />
      <Cone
        position={[0.25, 2.16, -3.25]}
        scale={[0.18, 0.1, 0.18]}
        color="#333b35"
      />
      <Label
        text={"MENU\nESPRESSO 4 · LATTE 6"}
        position={[1.06, 1.86, -3.17]}
        size={[0.82, 0.55]}
        rotation={[-0.12, 0, 0]}
        font={48}
        background="#394b3f"
      />
      <Box
        position={[-3.45, 2.32, -4.3]}
        scale={[1.55, 0.1, 0.36]}
        color="#ab8058"
      />
      {[-3.93, -3.5, -3.08].map((x) => (
        <Cup key={x} position={[x, 2.38, -4.25]} scale={0.75} />
      ))}
      <Box
        position={[-4.74, 2.47, -4.38]}
        scale={[0.53, 0.83, 0.1]}
        color="#785640"
      />
      <Label
        text={"오늘의\n커피"}
        position={[-4.74, 2.47, -4.315]}
        size={[0.44, 0.72]}
        background="#dfc6a0"
        color="#684f38"
        font={72}
      />
      <Plant position={[-5.4, 1.44, -3.4]} scale={0.42} />
      <Bookshelf position={[-5.68, 0, -0.75]} />
      {purchased.includes("bookshelf") && (
        <Bookshelf position={[-5.65, 0, 1.05]} />
      )}
      {purchased.includes("poster") && (
        <group>
          <Box
            position={[-5.915, 2.25, 0.5]}
            scale={[0.05, 1.2, 0.91]}
            color="#a37852"
          />
          <Label
            text={"SEOUL\nAFTER DARK"}
            position={[-5.88, 2.25, 0.5]}
            rotation={[0, Math.PI / 2, 0]}
            size={[0.8, 1.06]}
            font={70}
            background="#374e58"
            color="#e1bf81"
          />
        </group>
      )}
      {seats.map(([x, z], i) => (
        <Table
          key={i}
          position={[x, 0, z]}
          upgrade={purchased.includes("table")}
        />
      ))}
      <Box position={[6.04, 0.45, 0]} scale={[0.13, 0.9, 9]} color="#718177" />
      <Box position={[6.04, 3.32, 0]} scale={[0.13, 0.12, 9]} color="#43574d" />
      {[-4.4, -1.5, 1.5, 4.4].map((z) => (
        <Box
          key={z}
          position={[6.04, 2.06, z]}
          scale={[0.12, 2.5, 0.11]}
          color="#516358"
        />
      ))}
      {[-2.93, 0, 2.94].map((z) => (
        <mesh key={z} position={[6, 2.02, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.79, 2.5]} />
          <meshStandardMaterial
            color="#80b6c8"
            transparent
            opacity={0.11}
            roughness={0.08}
            metalness={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
      <Box
        position={[5.92, 0.95, 0]}
        scale={[0.34, 0.08, 8.85]}
        color="#b5a07b"
      />
      <Plant position={[5.83, 1, -3.62]} scale={0.36} />
      <Plant position={[5.83, 1, 2.05]} scale={0.32} />
      {purchased.includes("plant") && (
        <>
          <Plant position={[5.28, 0, -3.65]} scale={1.15} />
          <Plant position={[-5.25, 0, 3.65]} scale={0.8} />
        </>
      )}
      <Pendant position={[-2.25, 3.1, -2.2]} />
      <Pendant position={[1.5, 3.1, -2.2]} />
      <Pendant position={[3.7, 3.3, 0]} />
      {purchased.includes("lamp") && (
        <group position={[-4.96, 0, 2.45]}>
          <Cylinder
            position={[0, 0.08, 0]}
            scale={[0.31, 0.08, 0.31]}
            color="#8e774f"
          />
          <Cylinder
            position={[0, 1.05, 0]}
            scale={[0.025, 2, 0.025]}
            color="#be9c60"
            metal={0.5}
          />
          <Cone
            position={[0, 2.06, 0]}
            scale={[0.42, 0.55, 0.42]}
            color="#edcea0"
          />
          <pointLight
            position={[0, 1.92, 0]}
            color="#ffcd83"
            intensity={4}
            distance={5}
          />
        </group>
      )}
      {purchased.includes("sofa") && (
        <group position={[-2.25, 0, 3.58]} rotation={[0, -0.2, 0]}>
          <Box
            position={[0, 0.46, 0]}
            scale={[1.9, 0.45, 0.8]}
            color="#728b73"
          />
          <Box
            position={[0, 0.92, -0.32]}
            scale={[1.9, 0.8, 0.22]}
            color="#78907a"
          />
          {[-0.87, 0.87].map((x) => (
            <Box
              key={x}
              position={[x, 0.71, 0]}
              scale={[0.22, 0.6, 0.9]}
              color="#667e69"
            />
          ))}
          <Box
            position={[-0.45, 0.74, -0.15]}
            rotation={[0, 0.1, 0.15]}
            scale={[0.4, 0.27, 0.15]}
            color="#d6b17b"
          />
          {[-0.67, 0.67].map((x) => (
            <Box
              key={x}
              position={[x, 0.17, 0]}
              scale={[0.09, 0.3, 0.58]}
              color="#63462d"
            />
          ))}
        </group>
      )}
      <Label
        text={"OPEN\nLATE, ALWAYS"}
        position={[5.78, 2.75, 2.83]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[1.02, 0.55]}
        background="#2c4846"
        color="#ebbc7b"
        font={72}
      />
      <Street />
    </group>
  );
});
function Street() {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (light.current) {
      const t = clock.elapsedTime % 24;
      light.current.position.z = 8 - t * 0.9;
      light.current.intensity = t < 17 ? 5 : 0;
    }
  });
  return (
    <group>
      <Box
        position={[9, -0.53, 0]}
        scale={[5.1, 0.1, 22]}
        color="#1c353f"
        rough={0.25}
      />
      <Box
        position={[6.65, -0.36, 0]}
        scale={[1.05, 0.16, 15]}
        color="#44575b"
      />
      {Array.from({ length: 13 }, (_, i) => (
        <Box
          key={i}
          position={[6.66, -0.27, -6 + i]}
          scale={[0.95, 0.018, 0.025]}
          color="#263c45"
          shadow={false}
        />
      ))}
      {[-5.5, 6.2].map((z) => (
        <group key={z} position={[8.2, -0.4, z]}>
          <Cylinder
            position={[0, 1.85, 0]}
            scale={[0.045, 3.7, 0.045]}
            color="#354e52"
          />
          <Box
            position={[-0.34, 3.71, 0]}
            scale={[0.73, 0.07, 0.08]}
            color="#354e52"
          />
          <mesh position={[-0.68, 3.69, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#e6c58e" />
          </mesh>
          <pointLight
            position={[-0.68, 3.5, 0]}
            color="#afc7d1"
            intensity={5}
            distance={7}
          />
          <mesh position={[0, -0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.1, 24]} />
            <meshStandardMaterial
              color="#8d9895"
              transparent
              opacity={0.17}
              roughness={0.15}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          position={[9.2 + (i % 2), -0.46, -6 + i * 2.5]}
          rotation={[-Math.PI / 2, 0, 0.4 * i]}
          scale={[0.7 + i * 0.03, 0.25 + i * 0.02, 1]}
        >
          <circleGeometry args={[1, 24]} />
          <meshStandardMaterial
            color="#91b5c2"
            roughness={0.05}
            metalness={0.6}
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      ))}
      <pointLight
        ref={light}
        position={[9, 0.65, 7]}
        color="#d0d9c4"
        distance={10}
        intensity={4}
      />
      <Label
        text={"밤의 커피"}
        position={[10.9, 3, -6]}
        size={[2.4, 0.6]}
        background="#17323e"
        color="#9bc6c4"
        font={100}
      />
    </group>
  );
}
