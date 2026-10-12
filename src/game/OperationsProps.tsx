import { SupplyPrint } from "./SupplyPrint";
import { layout } from "../data/layout";
import { SoftBox, Rod } from "./art";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Ball, Cylinder, Label, material } from "./primitives";
import { useGame } from "../store/game";
import { caps, products } from "../data/operations";
import type { ProductId } from "../data/operations";
import type { Carry, SupplyBox } from "../store/operationTypes";

export function PaperCup({
  fill = 0,
  product = "espresso",
  scale = 1,
}: {
  fill?: number;
  product?: ProductId;
  scale?: number;
}) {
  const sleeve = useGame((s) =>
    s.business.cup === "#f3e5ca" ? "#78917b" : s.business.cup,
  );
  return (
    <group scale={scale}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.135, 0.1, 0.3, 18, 1, true]} />
        <meshStandardMaterial
          color="#f4e6cc"
          side={THREE.DoubleSide}
          roughness={0.6}
        />
      </mesh>
      <Cylinder
        position={[0, 0.009, 0]}
        scale={[0.102, 0.018, 0.102]}
        color="#f4e6cc"
      />
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.135, 0.012, 6, 18]} />
        <meshStandardMaterial color="#f9f0dd" />
      </mesh>
      <Cylinder
        position={[0, 0.15, 0]}
        scale={[0.117, 0.105, 0.117]}
        color={sleeve}
      />
      <Label
        position={[0, 0.153, 0.119]}
        text="☽ CAFÉ"
        size={[0.16, 0.044]}
        font={46}
        background={sleeve}
        color="#f9f0dd"
      />
      {fill > 0 && (
        <Cylinder
          position={[0, 0.04 + Math.min(1, fill) * 0.22, 0]}
          scale={[0.122, 0.014, 0.122]}
          color={products[product].color}
          rough={0.28}
        />
      )}
      {fill > 0.9 && products[product].milk > 0 && (
        <>
          <Ball
            position={[-0.022, 0.27, 0.015]}
            scale={[0.047, 0.003, 0.04]}
            color="#f7e9cf"
          />
          <Ball
            position={[0.02, 0.27, 0.015]}
            scale={[0.047, 0.003, 0.04]}
            color="#f7e9cf"
          />
        </>
      )}
    </group>
  );
}
export function Cookie({
  baked = true,
  quality = 1,
  scale = 1,
}: {
  baked?: boolean;
  quality?: number;
  scale?: number;
}) {
  return (
    <group scale={scale}>
      <Cylinder
        scale={[0.115, 0.055, 0.115]}
        color={!baked ? "#e4c891" : quality < 0.9 ? "#846039" : "#c18d4f"}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <Ball
          key={i}
          position={[
            Math.sin(i * 2.4) * 0.075,
            0.03,
            Math.cos(i * 2.4) * 0.075,
          ]}
          scale={[0.013, 0.012, 0.016]}
          color="#54382d"
        />
      ))}
    </group>
  );
}
export function BoxVisual({
  box,
  small = false,
}: {
  box: SupplyBox;
  small?: boolean;
}) {
  return (
    <group scale={small ? 0.9 : 1}>
      <SoftBox
        position={[0, 0.28, 0]}
        size={[0.65, 0.56, 0.48]}
        color={box.quantity ? "#c6a780" : "#a89477"}
      />
      <SoftBox
        position={[0, 0.565, 0]}
        size={[0.08, 0.014, 0.48]}
        color="#e0ccb0"
      />
      <SoftBox
        position={[0, 0.28, 0.248]}
        size={[0.55, 0.36, 0.012]}
        color="#f5ead6"
      />
      <SupplyPrint box={box} />
      <SoftBox
        position={[0.3, 0.28, 0]}
        size={[0.013, 0.33, 0.3]}
        color="#ede0c8"
      />
    </group>
  );
}
export function CarryVisual({ carry }: { carry: Carry }) {
  const box = useGame((s) =>
    carry.kind === "box"
      ? s.ops.boxes.find((b) => b.id === carry.boxId)
      : undefined,
  );
  if (carry.kind === "box") return box ? <BoxVisual box={box} /> : null;
  if (carry.kind === "cup") return <PaperCup />;
  if (carry.kind === "product")
    return carry.item.product === "cookie" ? (
      <group position={[0, 0.04, 0]}>
        <Cookie quality={carry.item.quality} />
      </group>
    ) : (
      <PaperCup fill={1} product={carry.item.product} />
    );
  if (carry.kind === "trash")
    return (
      <SoftBox
        position={[0, 0.15, 0]}
        size={[0.35, 0.3, 0.25]}
        color="#a79178"
      />
    );
  if (carry.kind === "tray")
    return (
      <group>
        <SoftBox size={[0.74, 0.035, 0.4]} color="#bca082" />
        {carry.items.map((item, i) => (
          <group key={item.id} position={[(i - 1) * 0.23, 0.02, 0]}>
            {item.product === "cookie" ? (
              <Cookie quality={item.quality} />
            ) : (
              <PaperCup fill={1} product={item.product} scale={0.8} />
            )}
          </group>
        ))}
      </group>
    );
  return (
    <group>
      <SoftBox size={[0.8, 0.035, 0.5]} color="#7b8580" metal={0.5} />
      {Array.from({ length: carry.quantity }, (_, i) => (
        <group
          key={i}
          position={[
            -0.26 + (i % 4) * 0.175,
            0.04,
            -0.13 + Math.floor(i / 4) * 0.24,
          ]}
        >
          <Cookie baked={carry.baked} quality={carry.quality} scale={0.65} />
        </group>
      ))}
    </group>
  );
}

export function AutoMachine() {
  const stage = useGame((s) => s.ops.machine.stage),
    level = useGame((s) => s.ops.levels.machine),
    beans = useGame((s) => s.ops.containers.beans),
    hopperLevel = useGame((s) => s.ops.levels.hopper),
    milk = useGame((s) => s.ops.containers.milk),
    milkLevel = useGame((s) => s.ops.levels.milkTank),
    cups = useGame((s) => s.ops.containers.cups),
    cupLevel = useGame((s) => s.ops.levels.cupDispenser),
    syrup = useGame((s) => s.ops.containers.syrup);
  const body = useRef<THREE.Group>(null),
    liquid = useRef<THREE.Mesh>(null),
    stream = useRef<THREE.Mesh>(null),
    steam = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const m = useGame.getState().ops.machine,
      fraction =
        m.stage === "ready"
          ? 1
          : m.stage === "brewing"
            ? Math.max(0, (m.elapsed - 0.8) / (m.duration - 0.8))
            : 0;
    if (body.current)
      body.current.position.x =
        m.stage === "brewing" && m.elapsed < 1.1
          ? Math.sin(clock.elapsedTime * 75) * 0.006
          : 0;
    if (liquid.current) {
      liquid.current.visible = fraction > 0;
      liquid.current.position.y = 0.05 + fraction * 0.22;
      liquid.current.material = material(products[m.recipe].color, 0, 0.28);
    }
    if (stream.current) {
      stream.current.visible = m.stage === "brewing" && m.elapsed > 0.8;
      const surface = 0.05 + fraction * 0.22;
      stream.current.position.y = (0.36 + surface) / 2;
      stream.current.scale.y = Math.max(0.014, 0.36 - surface);
      stream.current.material = material(
        products[m.recipe].milk && fraction > 0.75 ? "#ead7b5" : "#9f6437",
        0,
        0.25,
      );
    }
    if (steam.current) {
      steam.current.visible =
        m.stage === "ready" || (m.stage === "brewing" && fraction > 0.5);
      steam.current.children.forEach((p, i) => {
        const f = (clock.elapsedTime * 0.5 + i * 0.3) % 1;
        p.position.set(
          Math.sin(clock.elapsedTime + i) * 0.025,
          0.25 + f * 0.4,
          0,
        );
        p.scale.setScalar(0.02 + f * 0.035);
      });
    }
  });
  const tankH = 0.55 + milkLevel * 0.12,
    hopperH = 0.3 + hopperLevel * 0.1;
  const milkTube = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.93, 0.18 + tankH, -0.1),
          new THREE.Vector3(0.73, 0.24 + tankH, 0.05),
          new THREE.Vector3(0.62, 0.57, 0.26),
          new THREE.Vector3(0.49, 0.5, 0.26),
        ]),
        20,
        0.014,
        7,
        false,
      ),
    [tankH],
  );
  useEffect(() => () => milkTube.dispose(), [milkTube]);
  return (
    <group position={layout.machine}>
      <group ref={body}>
        <SoftBox
          position={[0, 0.49, -0.17]}
          size={[1.18, 1.02, 0.68]}
          color={level ? "#637d73" : "#86a69a"}
          rough={0.35}
          metal={0.35}
        />
        <SoftBox
          position={[0, 0.045, 0.06]}
          size={[1.25, 0.09, 0.95]}
          color="#c5c2ad"
          metal={0.75}
          rough={0.27}
        />
        <SoftBox
          position={[0, 0.5, 0.22]}
          size={[0.95, 0.89, 0.025]}
          color="#263e39"
          metal={0.35}
        />
        <SoftBox
          position={[0, 0.43, 0.25]}
          size={[0.61, 0.55, 0.018]}
          color="#152724"
        />
        <SoftBox
          position={[0, 0.61, 0.41]}
          size={[0.3, 0.09, 0.3]}
          color="#cbd1bd"
          metal={0.8}
          rough={0.18}
        />
        {[-0.065, 0.065].map((x) => (
          <Cylinder
            key={x}
            position={[x, 0.56, 0.52]}
            scale={[0.018, 0.09, 0.018]}
            color="#aebbb3"
            metal={0.85}
          />
        ))}
        <SoftBox
          position={[0, 0.11, 0.4]}
          size={[0.76, 0.05, 0.62]}
          color="#929d92"
          metal={0.65}
        />
        {Array.from({ length: 8 }, (_, i) => (
          <SoftBox
            key={i}
            position={[-0.3 + i * 0.085, 0.14, 0.4]}
            size={[0.03, 0.012, 0.53]}
            color="#33443e"
          />
        ))}
        <Label
          text={
            stage === "brewing"
              ? "BREWING"
              : stage === "ready"
                ? "COFFEE IS READY"
                : "AFTER HOURS"
          }
          position={[0, 0.85, 0.237]}
          size={[0.74, 0.13]}
          font={54}
          background="#294a3f"
          color="#d6dfb6"
        />
        {(["espresso", "americano", "latte", "cappuccino"] as const).map(
          (id, i) => (
            <group
              key={id}
              position={[-0.39 + i * 0.26, 0.74, 0.241]}
              onClick={(e) => {
                e.stopPropagation();
                useGame.getState().startBrew(id);
              }}
            >
              <SoftBox
                size={[0.2, 0.07, 0.025]}
                color={
                  stage === "brewing" &&
                  useGame.getState().ops.machine.recipe === id
                    ? "#d8bd83"
                    : "#a9c6b1"
                }
                rough={0.4}
              />
              <Label
                text={products[id].name.toUpperCase()}
                position={[0, 0, 0.016]}
                size={[0.18, 0.045]}
                font={52}
                background="#a9c6b1"
                color="#294136"
              />
            </group>
          ),
        )}
      </group>
      <group position={[-0.27, 1, -0.14]}>
        {Array.from({ length: Math.min(beans, 22) }, (_, i) => (
          <Ball
            key={i}
            position={[
              Math.cos(i * 2.4) * (0.06 + (i % 3) * 0.035),
              0.045 +
                (beans / caps(useGame.getState().ops.levels, "hopper")) *
                  hopperH *
                  0.8,
              Math.sin(i * 2.4) * (0.06 + (i % 3) * 0.035),
            ]}
            scale={[0.045, 0.025, 0.029]}
            color={i % 3 ? "#624936" : "#856046"}
            rotation={[0, i * 2.4, 0]}
          />
        ))}
        <Cylinder
          position={[0, 0.03, 0]}
          scale={[0.24, 0.06, 0.24]}
          color="#587064"
        />
        <mesh position={[0, hopperH / 2 + 0.045, 0]}>
          <cylinderGeometry args={[0.235, 0.21, hopperH, 16]} />
          <meshStandardMaterial
            color="#c9ddd0"
            transparent
            opacity={0.2}
            roughness={0.2}
            depthWrite={false}
          />
        </mesh>
        <Cylinder
          position={[
            0,
            0.03 +
              (beans / caps(useGame.getState().ops.levels, "hopper")) *
                hopperH *
                0.4,
            0,
          ]}
          scale={[
            0.195,
            Math.max(
              0.015,
              (beans / caps(useGame.getState().ops.levels, "hopper")) *
                hopperH *
                0.8,
            ),
            0.195,
          ]}
          color="#765136"
        />
        <Cylinder
          position={[0, hopperH + 0.05, 0]}
          scale={[0.245, 0.035, 0.245]}
          color="#364d40"
        />
        <Label
          text="BEANS"
          position={[0, hopperH / 2, 0.241]}
          size={[0.4, 0.09]}
          font={52}
          background="#4c6151"
        />
      </group>
      <group position={[0.93, 0, -0.1]}>
        <SoftBox
          position={[0, 0.08, 0]}
          size={[0.42, 0.14, 0.44]}
          color="#a2b5a5"
          metal={0.3}
        />
        <mesh position={[0, 0.18 + tankH / 2, 0]}>
          <cylinderGeometry args={[0.19, 0.19, tankH, 20]} />
          <meshStandardMaterial
            color="#bdd8cc"
            transparent
            opacity={0.21}
            roughness={0.16}
            depthWrite={false}
          />
        </mesh>
        <Cylinder
          position={[
            0,
            0.18 +
              ((milk / caps(useGame.getState().ops.levels, "milkTank")) *
                tankH) /
                2,
            0,
          ]}
          scale={[
            0.17,
            Math.max(
              0.004,
              (milk / caps(useGame.getState().ops.levels, "milkTank")) * tankH,
            ),
            0.17,
          ]}
          color="#f2e6cc"
          rough={0.4}
        />
        <Cylinder
          position={[0, 0.18 + tankH, 0]}
          scale={[0.215, 0.056, 0.215]}
          color="#78917b"
          rough={0.5}
        />
        <Label
          text="MILK"
          position={[0, 0.38, 0.205]}
          size={[0.34, 0.12]}
          font={60}
          background="#647a68"
        />
      </group>
      <mesh geometry={milkTube} material={material("#52604e", 0.25, 0.35)} />
      <group position={[-1.65, 0, 0.06]}>
        <Cylinder
          position={[0, 0.06, 0]}
          scale={[0.23, 0.08, 0.23]}
          color="#657b67"
        />
        <SoftBox
          position={[0, 0.4 + cupLevel * 0.07, -0.17]}
          size={[0.07, 0.75 + cupLevel * 0.14, 0.06]}
          color="#6a8570"
        />
        {Array.from({ length: cups }, (_, i) => (
          <group
            key={i}
            position={[
              0,
              0.08 +
                (i * (0.4 + cupLevel * 0.14)) /
                  caps(useGame.getState().ops.levels, "cupDispenser"),
              0,
            ]}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.108, 0.009, 5, 16]} />
              <meshStandardMaterial color="#f4e6cc" />
            </mesh>
          </group>
        ))}
        {cups > 0 && (
          <group
            position={[
              0,
              0.08 +
                ((cups - 1) * (0.4 + cupLevel * 0.14)) /
                  caps(useGame.getState().ops.levels, "cupDispenser"),
              0,
            ]}
          >
            <PaperCup scale={0.8} />
          </group>
        )}
        <Label
          text="PAPER CUPS"
          position={[0, 0.025, 0.24]}
          size={[0.55, 0.12]}
          font={60}
          background="#4c6452"
        />
      </group>
      <group position={[1.94, 0.09, 0]} scale={syrup ? 1 : 0.96}>
        <Cylinder
          position={[0, 0.25, 0]}
          scale={[0.105, 0.5, 0.105]}
          color="#b5a687"
        />
        <Cylinder
          position={[0, 0.53, 0]}
          scale={[0.025, 0.13, 0.025]}
          color="#445344"
        />
        <Label
          text="VANILLA"
          position={[0, 0.25, 0.112]}
          size={[0.23, 0.13]}
          font={55}
          background="#b5a687"
          color="#4c5b45"
        />
      </group>
      {stage !== "empty" && (
        <group position={[0, 0.155, 0.46]}>
          <PaperCup />
          <Cylinder ref={liquid} scale={[0.12, 0.014, 0.12]} color="#ad7343" />
          <Cylinder
            ref={stream}
            position={[0, 0.21, 0]}
            scale={[0.01, 0.22, 0.01]}
            color="#a46c3a"
          />
          <group ref={steam}>
            {[0, 1, 2].map((i) => (
              <mesh key={i}>
                <sphereGeometry args={[1, 8, 6]} />
                <meshBasicMaterial
                  color="#fff4dc"
                  transparent
                  opacity={0.12}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        </group>
      )}
      <Label
        text="GROUNDS"
        position={[0.43, 0.17, 0.6]}
        size={[0.35, 0.08]}
        font={50}
        background="#30483a"
      />
    </group>
  );
}

export function Bakery() {
  const stage = useGame((s) => s.ops.oven.stage),
    quantity = useGame((s) => s.ops.oven.quantity),
    door = useGame((s) => s.ops.oven.doorOpen),
    level = useGame((s) => s.ops.levels.oven),
    display = useGame((s) => s.ops.display),
    displayLevel = useGame((s) => s.ops.levels.display),
    unlocked = useGame((s) => s.business.lifetimeServed >= 2);
  const doorGroup = useRef<THREE.Group>(null),
    cookies = useRef<THREE.Group>(null),
    warm = stage === "baking" || stage === "ready";
  useFrame((_, dt) => {
    if (doorGroup.current)
      doorGroup.current.rotation.x = THREE.MathUtils.damp(
        doorGroup.current.rotation.x,
        door ? -1.15 : 0,
        7,
        dt,
      );
    if (cookies.current) {
      const o = useGame.getState().ops.oven,
        f = Math.min(1, o.elapsed / o.duration);
      cookies.current.children.forEach((c) => {
        c.scale.setScalar(0.7 + f * 0.1);
        c.traverse((mesh) => {
          if (
            mesh instanceof THREE.Mesh &&
            mesh.geometry.type === "CylinderGeometry"
          )
            mesh.material = material(
              o.quality < 0.9 ? "#846039" : f > 0.8 ? "#c18d4f" : "#e2be85",
            );
        });
      });
    }
  });
  return (
    <>
      <group
        position={layout.oven}
        rotation={[0, 0, 0]}
        scale={0.9 * (1 + level * 0.06)}
      >
        <SoftBox
          position={[0, 0.36, -0.34]}
          size={[1.12, 0.73, 0.09]}
          color="#647368"
          metal={0.3}
          rough={0.36}
        />
        <SoftBox
          position={[-0.52, 0.36, 0]}
          size={[0.08, 0.73, 0.77]}
          color="#647368"
          metal={0.3}
          rough={0.36}
        />
        <SoftBox
          position={[0.52, 0.36, 0]}
          size={[0.08, 0.73, 0.77]}
          color="#647368"
          metal={0.3}
          rough={0.36}
        />
        <SoftBox
          position={[0, 0.68, 0]}
          size={[1.1, 0.09, 0.77]}
          color="#647368"
          metal={0.3}
          rough={0.36}
        />
        <SoftBox
          position={[0, 0.07, 0]}
          size={[1.1, 0.09, 0.77]}
          color="#647368"
          metal={0.3}
          rough={0.36}
        />
        <SoftBox
          position={[0, 0.32, -0.275]}
          size={[0.91, 0.45, 0.018]}
          color={warm ? "#cba063" : "#283c36"}
        />
        <SoftBox
          position={[0, 0.14, 0.18]}
          size={[0.81, 0.03, 0.45]}
          color="#839184"
          metal={0.5}
        />
        {warm && (
          <pointLight
            position={[0, 0.38, 0.17]}
            intensity={0.45}
            color="#ffb65e"
            distance={1.3}
          />
        )}
        <group ref={cookies}>
          {Array.from({ length: quantity }, (_, i) => (
            <group
              key={i}
              position={[
                -0.3 + (i % 4) * 0.2,
                0.185,
                0.04 + Math.floor(i / 4) * 0.23,
              ]}
            >
              <Cookie />
            </group>
          ))}
        </group>
        <group ref={doorGroup} position={[0, 0.1, 0.415]}>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.94, 0.43, 0.035]} />
            <meshStandardMaterial
              color="#a9c2b2"
              transparent
              opacity={0.24}
              roughness={0.18}
              depthWrite={false}
            />
          </mesh>
          <SoftBox
            position={[0, 0.31, 0.04]}
            size={[0.57, 0.03, 0.06]}
            color="#d5d4bd"
            metal={0.7}
          />
        </group>
        <Label
          text={
            !unlocked
              ? "BAKERY · AFTER 2 ORDERS"
              : stage === "baking"
                ? "BAKING · WARM & SLOW"
                : stage === "ready"
                  ? "READY · COLLECT THE TRAY"
                  : stage === "loaded"
                    ? "TRAY IN · START OVEN"
                    : "OVEN · FRESH LITTLE BATCHES"
          }
          position={[0, 0.625, 0.4]}
          size={[0.91, 0.11]}
          font={42}
          background="#43594b"
        />
        <Ball
          position={[0.44, 0.61, 0.42]}
          scale={0.028}
          color={warm ? "#ffd285" : "#adc1a3"}
        />
      </group>
      <group
        position={layout.display}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[1 + displayLevel * 0.12, 1 + displayLevel * 0.16, 1]}
      >
        <SoftBox
          position={[0, 0.075, 0]}
          size={[1.22, 0.15, 0.62]}
          color="#7e6550"
        />
        <SoftBox
          position={[0, 0.63, 0]}
          size={[1.28, 0.05, 0.7]}
          color="#b5986c"
        />
        {[-0.59, 0.59].flatMap((x) =>
          [-0.28, 0.28].map((z) => (
            <Rod
              key={x + ":" + z}
              from={[x, 0.13, z]}
              to={[x, 0.63, z]}
              r={0.023}
              color="#8a9c8b"
            />
          )),
        )}
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[1.2, 0.46, 0.61]} />
          <meshStandardMaterial
            color="#b7d1c1"
            transparent
            opacity={0.14}
            roughness={0.1}
            depthWrite={false}
          />
        </mesh>
        {Array.from({ length: Math.min(display.quantity, 18) }, (_, i) => (
          <group
            key={i}
            position={[
              -0.43 + (i % 6) * 0.17,
              0.19 + Math.floor(i / 6) * 0.13,
              0.08,
            ]}
          >
            <Cookie quality={display.quality} scale={0.68} />
          </group>
        ))}
        <Label
          text="FRESHLY BAKED · COOKIES"
          position={[0, 0.08, 0.324]}
          size={[1.09, 0.1]}
          font={48}
          background="#7e6550"
        />
      </group>
    </>
  );
}
