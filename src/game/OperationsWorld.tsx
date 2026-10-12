import { layout } from "../data/layout";
import { SoftBox, Oak, Rod, Ring } from "./art";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Box, Ball, Cylinder, Label, GroundShadow } from "./primitives";
import { useGame } from "../store/game";
import { caps } from "../data/operations";
import { BoxVisual, CarryVisual, PaperCup, Cookie } from "./OperationsProps";
import { Plant } from "./Environment";
import type { Order } from "../store/operationTypes";
export function Stockroom() {
  const s = useGame(),
    boxes = s.ops.boxes,
    loose = s.ops.loose;
  return (
    <>
      <group position={[3.2, 0, -5.89]}>
        <Oak position={[-2.0, 1.52, 0]} size={[0.1, 3, 0.6]} />
        <Oak position={[2.0, 1.52, 0]} size={[0.1, 3, 0.6]} />
        {[0.55, 1.18, 1.81, 2.44].map((y) => (
          <Oak key={y} position={[0, y, 0]} size={[4.15, 0.095, 0.75]} />
        ))}
        <Label
          position={[0, 2.92, 0.06]}
          text="MOON SUPPLIES · STOCKROOM"
          size={[3.1, 0.24]}
          font={64}
          background="#c99a70"
          color="#405846"
        />
        {["BEANS", "MILK", "CUPS", "DOUGH", "VANILLA"].map((name, i) => (
          <Label
            key={name}
            position={[-1.54 + i * 0.77, 2.39, 0.39]}
            text={name}
            size={[0.61, 0.11]}
            font={50}
            background="#f4e8d6"
            color="#624936"
          />
        ))}
      </group>
      <group position={layout.dough}>
        <Oak position={[0, 0.035, 0]} size={[0.7, 0.07, 0.46]} />
        {Array.from({ length: Math.min(s.ops.containers.dough, 6) }, (_, i) => (
          <Ball
            key={i}
            position={[
              -0.2 + (i % 3) * 0.19,
              0.11,
              Math.floor(i / 3) * 0.16 - 0.08,
            ]}
            scale={[0.06, 0.04, 0.06]}
            color="#e2c18d"
          />
        ))}
        <Label
          text="COOKIE DOUGH"
          position={[0, 0.09, -0.23]}
          size={[0.8, 0.13]}
          font={54}
          background="#c99a70"
          color="#405846"
        />
      </group>
      {boxes
        .filter((b) => b.location !== "carried")
        .map((box) => (
          <group
            key={box.id}
            position={[
              box.x,
              box.location === "storage"
                ? Math.max(0.12, 2.49 - Math.floor(box.slot / 5) * 0.63)
                : box.z > 4.8
                  ? -0.13
                  : 0.065,
              box.z,
            ]}
            onClick={(e) => {
              e.stopPropagation();
              if (Math.hypot(s.player.x - box.x, s.player.z - box.z) < 1.8)
                s.takeBox(box.id);
            }}
          >
            <BoxVisual box={box} small={box.location === "storage"} />
          </group>
        ))}
      {loose.map((obj) => (
        <group
          key={obj.id}
          position={[obj.x, obj.z > 4.8 ? -0.13 : 0.065, obj.z]}
        >
          <CarryVisual carry={obj.carry} />
        </group>
      ))}
      <group position={[0.55, 1.18, -0.65]}>
        <SoftBox size={[0.69, 0.025, 0.56]} radius={0.07} color="#d3c3a1" />
        {s.ops.handoff.map((item, i) => (
          <group
            key={item.id}
            position={[
              -0.19 + (i % 3) * 0.19,
              0.03,
              Math.floor(i / 3) * 0.18 - 0.08,
            ]}
          >
            {item.product === "cookie" ? (
              <Cookie scale={0.7} />
            ) : (
              <PaperCup fill={1} product={item.product} scale={0.7} />
            )}
          </group>
        ))}
        <Label
          text="PICK UP · THANK YOU"
          position={[-0.48, -0.28, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          size={[0.74, 0.14]}
          font={56}
          background="#78917b"
        />
      </group>
      <group position={[1.05, 1.19, -0.55]}>
        <Oak size={[0.66, 0.03, 0.44]} />
        <Label
          position={[0, 0.021, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          text={`SERVING TRAY · ${caps(s.ops.levels, "tray")}`}
          size={[0.58, 0.31]}
          font={48}
          background="#c99a70"
          color="#405846"
        />
      </group>
      <group position={[4.85, 0, 3.58]}>
        <Cylinder
          position={[0, 0.39, 0]}
          scale={[0.22, 0.65, 0.22]}
          color="#798571"
        />
        <SoftBox
          position={[0, 0.74, 0]}
          size={[0.5, 0.11, 0.5]}
          radius={0.13}
          color="#455d48"
        />
        <SoftBox
          position={[0, 0.746, 0]}
          size={[0.29, 0.006, 0.21]}
          radius={0.06}
          color="#283d32"
        />
        <Label
          position={[0, 0.46, 0.226]}
          text="RECYCLE"
          size={[0.27, 0.12]}
          font={55}
          background="#798571"
          color="#f4e8d6"
        />
      </group>
      {s.ops.spills.map((spill) => (
        <mesh
          key={spill.id}
          position={[spill.x, 0.072, spill.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.28, 20]} />
          <meshStandardMaterial
            color="#624936"
            transparent
            opacity={0.65}
            roughness={0.25}
          />
        </mesh>
      ))}
      <Plant position={[1.57, 0, -4.89]} scale={0.62} />
    </>
  );
}

function VehicleModel({
  kind,
  color,
  truck = false,
  braking = false,
}: {
  kind: Order["vehicle"];
  color: string;
  truck?: boolean;
  braking?: boolean;
}) {
  const length = kind === "compact" ? 2.05 : kind === "suv" ? 2.65 : 2.5,
    height = kind === "suv" || kind === "van" ? 0.8 : 0.56;
  const wheels = useRef<THREE.Group>(null),
    vehicle = useRef<THREE.Group>(null);
  useEffect(() => {
    vehicle.current?.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = false;
    });
  }, []);
  useFrame(({ clock }) => {
    if (wheels.current)
      wheels.current.children.forEach(
        (w) => (w.rotation.x = braking ? 0 : clock.elapsedTime * 5),
      );
  });
  return (
    <group ref={vehicle} scale={[1, 1.2, 1]}>
      <SoftBox
        position={[0, 0.36, 0]}
        size={[1.22, 0.44, truck ? 3.2 : length]}
        radius={0.19}
        color={color}
        metal={0.12}
        rough={0.48}
      />
      <SoftBox
        position={[0, 0.66, truck ? 1.05 : length * 0.32]}
        size={[1.08, 0.17, 0.57]}
        radius={0.075}
        color={color}
        metal={0.12}
      />
      <SoftBox
        position={[0, 0.96 + height * 0.28, truck ? -0.3 : 0]}
        size={[1.08, 0.17, truck ? 1.84 : length * 0.55]}
        radius={0.105}
        color={color}
        metal={0.1}
      />
      {[-0.46, 0.46].flatMap((x) =>
        [-0.48, 0.48].map((z) => (
          <Rod
            key={x + ":" + z}
            from={[x, 0.54, z]}
            to={[x * 0.85, 0.98 + height * 0.28, z * 0.78]}
            r={0.035}
            color={color}
          />
        )),
      )}
      <mesh
        position={[0, 0.79, truck ? 1.27 : length * 0.255]}
        rotation={[-0.22, 0, 0]}
      >
        <boxGeometry args={[0.89, 0.42, 0.025]} />
        <meshStandardMaterial
          color="#65818b"
          transparent
          opacity={0.38}
          roughness={0.2}
        />
      </mesh>
      {[-0.53, 0.53].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.78, 0]}>
            <boxGeometry args={[0.025, 0.38, truck ? 1.8 : length * 0.52]} />
            <meshStandardMaterial
              color="#6c8790"
              transparent
              opacity={0.3}
              roughness={0.2}
            />
          </mesh>
          <SoftBox
            position={[x, 0.62, 0]}
            size={[0.06, 0.09, length * 0.5]}
            radius={0.025}
            color={color}
          />
          <SoftBox
            position={[x, 0.58, 0.22]}
            size={[0.025, 0.025, 0.13]}
            radius={0.012}
            color="#bdc3ae"
            metal={0.7}
          />
        </group>
      ))}
      <group position={[-0.29, 0.68, truck ? 0.85 : 0.2]}>
        <SoftBox
          position={[0, 0, 0]}
          size={[0.27, 0.28, 0.21]}
          radius={0.08}
          color="#6d826c"
        />
        <group rotation={[0, braking ? -Math.PI / 2 : 0, 0]}>
        <Ball
          position={[0, 0.24, 0]}
          scale={[0.135, 0.15, 0.13]}
          color="#ddb998"
        />
        <Ball
          position={[0, 0.32, -0.02]}
          scale={[0.14, 0.085, 0.125]}
          color="#624936"
        />
        <Ball position={[-0.05, 0.26, 0.12]} scale={0.012} color="#3f3a31" />
        <Ball position={[0.05, 0.26, 0.12]} scale={0.012} color="#3f3a31" />
        </group>
        <Ring
          r={0.1}
          t={0.012}
          position={[0, 0.02, 0.2]}
          rotation={[0.8, 0, 0]}
          color="#425244"
        />
      </group>
      <SoftBox
        position={[0, 0.33, (truck ? 3.2 : length) / 2 + 0.005]}
        size={[1.06, 0.13, 0.075]}
        radius={0.05}
        color="#bbbbaa"
        metal={0.5}
      />
      {[-0.39, 0.39].map((x) => (
        <group key={x}>
          <SoftBox
            position={[x, 0.54, (truck ? 3.2 : length) / 2 + 0.027]}
            size={[0.2, 0.12, 0.046]}
            radius={0.035}
            color="#ffe2a5"
          />
          <SoftBox
            position={[x, 0.5, -(truck ? 3.2 : length) / 2 - 0.027]}
            size={[0.18, 0.12, 0.046]}
            radius={0.035}
            color={braking ? "#f99275" : "#af6c59"}
          />
          <SoftBox
            position={[Math.sign(x) * 0.66, 0.74, 0.37]}
            size={[0.13, 0.08, 0.16]}
            radius={0.045}
            color={color}
          />
        </group>
      ))}
      <group ref={wheels}>
        {[-0.55, 0.55].flatMap((x) =>
          [-0.7, 0.7].map((z) => (
            <group
              key={x + ":" + z}
              position={[x, 0.21, z * (truck ? 1.5 : 1)]}
            >
              <Cylinder
                rotation={[0, 0, Math.PI / 2]}
                scale={[0.22, 0.15, 0.22]}
                color="#3b4644"
              />
              <Cylinder
                position={[Math.sign(x) * 0.085, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                scale={[0.13, 0.017, 0.13]}
                color="#c9c5b1"
                metal={0.45}
              />
              <Cylinder
                position={[Math.sign(x) * 0.096, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                scale={[0.055, 0.019, 0.055]}
                color="#8d9b87"
              />
            </group>
          )),
        )}
      </group>
      <GroundShadow position={[0, 0.008, 0]} size={2.6} />
      {truck && (
        <>
          <SoftBox
            position={[0, 0.83, -0.53]}
            size={[1.16, 0.94, 1.88]}
            radius={0.08}
            color="#859a7e"
          />
          <Label
            position={[-0.59, 0.88, -0.53]}
            rotation={[0, -Math.PI / 2, 0]}
            text="MOON DELIVERY"
            size={[1.55, 0.3]}
            font={60}
            background="#859a7e"
            color="#f4e8d6"
          />
        </>
      )}
    </group>
  );
}

function DriveCar({ order, index }: { order: Order; index: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const o = useGame.getState().ops.orders.find((o) => o.id === order.id);
    if (!o || !group.current) return;
    const target = layout.windowZ - o.vehicleZ;
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      target,
      8,
      dt,
    );
  });
  return (
    <group
      ref={group}
      name={"drive-car-" + order.id}
      position={[
        layout.laneX,
        -0.15,
        layout.windowZ - (order.vehicleZ ?? 10 + index * 3.5),
      ]}
      rotation={[0, 0, 0]}
    >
      <VehicleModel
        kind={order.vehicle}
        color={order.color}
        braking={order.vehiclePhase === "waiting"}
      />
    </group>
  );
}
export function Traffic() {
  const allOrders = useGame((s) => s.ops.orders),
    truckStage = useGame((s) => s.ops.truck.stage);
  const orders = allOrders.filter((o) => o.channel === "drive");
  const truck = useRef<THREE.Group>(null),
    door = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const t = useGame.getState().ops.truck;
    if (truck.current) {
      truck.current.visible = t.stage !== "gone";
      const target =
        t.stage === "arriving"
          ? -12 + Math.min(1, t.elapsed / 4) * 12
          : t.stage === "leaving"
            ? t.elapsed * 3
            : 0;
      truck.current.position.x = THREE.MathUtils.damp(
        truck.current.position.x,
        target,
        8,
        dt,
      );
    }
    if (door.current)
      door.current.rotation.y = THREE.MathUtils.damp(
        door.current.rotation.y,
        t.stage === "parked" ? -1.2 : 0,
        6,
        dt,
      );
  });
  return (
    <>
      <group position={[layout.laneX, -0.12, 1.5]}>
        {[-0.84, 0.84].map((x) => (
          <Box
            key={x}
            position={[x, 0, 0]}
            scale={[0.035, 0.015, 15.8]}
            color="#d4c7a6"
          />
        ))}
        {[-4.5, -1.6, 5.2, 8.0].map((z) => (
          <group key={z} position={[0, 0.025, z]}>
            <Box scale={[0.05, 0.012, 0.65]} color="#e7d9b9" />
            {[-1, 1].map((x) => (
              <Box
                key={x}
                position={[x * 0.11, 0, 0.23]}
                rotation={[0, x * 0.75, 0]}
                scale={[0.04, 0.013, 0.34]}
                color="#e7d9b9"
              />
            ))}
          </group>
        ))}
        <Label
          text="DRIVE THRU →"
          position={[0, 0.04, -3.2]}
          rotation={[-Math.PI / 2, 0, 0]}
          size={[1.25, 0.4]}
          font={64}
          background="#465965"
          color="#f4e8d6"
        />
      </group>
      <group position={[5.94, 0, -2.45]}>
        <SoftBox
          position={[0, 0.79, 0]}
          size={[0.16, 1.65, 0.19]}
          radius={0.04}
          color="#405846"
        />
        <SoftBox
          position={[0, 1.79, 0]}
          size={[0.22, 0.95, 0.76]}
          radius={0.08}
          color="#78917b"
        />
        <Label
          position={[0.12, 1.88, 0]}
          rotation={[0, Math.PI / 2, 0]}
          text="ORDER HERE
COFFEE + COOKIES"
          size={[0.65, 0.5]}
          font={68}
          background="#405846"
          color="#f4e8d6"
        />
        <Ball position={[0.13, 1.5, 0]} scale={0.09} color="#c3b396" />
      </group>
      {orders.map((o, i) => (
        <DriveCar key={o.id} order={o} index={i} />
      ))}
      <group
        ref={truck}
        position={[-12, -0.15, 7.7]}
        rotation={[0, Math.PI / 2, 0]}
        visible={truckStage !== "gone"}
      >
        <VehicleModel
          kind="van"
          color="#758d73"
          truck
          braking={truckStage === "parked"}
        />
        <group ref={door} position={[-0.59, 0.69, -1.15]}>
          <Box
            position={[0, 0, 0.25]}
            scale={[0.035, 0.63, 0.5]}
            color="#d0c2a4"
          />
        </group>
      </group>
      <Box
        position={[0, -0.19, 7.73]}
        scale={[14.5, 0.05, 1.35]}
        color="#334a4c"
        rough={0.16}
      />
      <Label
        text="DELIVERIES · THANK YOU"
        position={[-2, -0.11, 6.52]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[2.7, 0.38]}
        font={62}
        background="#969f99"
        color="#456451"
      />
    </>
  );
}

export function ServingRobot() {
  const level = useGame((s) => s.ops.levels.robot),
    stage = useGame((s) => s.ops.robot.stage),
    items = useGame((s) => s.ops.robot.items);
  const robot = useRef<THREE.Group>(null),
    eyes = useRef<THREE.Group>(null);
  useEffect(() => {
    robot.current?.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = false;
    });
  }, [level]);
  const point = useMemo(
    () => new THREE.Vector3(layout.dock[0], 0, layout.dock[1]),
    [],
  );
  useFrame(({ clock }, dt) => {
    if (!robot.current) return;
    const r = useGame.getState().ops.robot;
    if (r.stage === "idle" || r.route.length < 2)
      point.set(layout.dock[0], 0, layout.dock[1]);
    else {
      let travel = r.elapsed * 1.5;
      let last = r.route[0];
      for (const next of r.route.slice(1)) {
        const len = Math.hypot(next[0] - last[0], next[1] - last[1]);
        if (travel <= len) {
          const f = len ? travel / len : 1;
          point.set(
            last[0] + (next[0] - last[0]) * f,
            0,
            last[1] + (next[1] - last[1]) * f,
          );
          break;
        }
        travel -= len;
        last = next;
        point.set(next[0], 0, next[1]);
      }
    }
    const dx = point.x - robot.current.position.x,
      dz = point.z - robot.current.position.z;
    robot.current.position.lerp(point, 1 - Math.exp(-dt * 10));
    if (Math.hypot(dx, dz) > 0.003)
      robot.current.rotation.y = THREE.MathUtils.damp(
        robot.current.rotation.y,
        Math.atan2(dx, dz),
        8,
        dt,
      );
    if (eyes.current)
      eyes.current.scale.y =
        Math.sin(clock.elapsedTime * 0.9) > 0.98 ? 0.18 : 1;
  });
  return level > 0 ? (
    <group ref={robot} position={[layout.dock[0], 0, layout.dock[1]]}>
      <Cylinder
        position={[0, 0.19, 0]}
        scale={[0.28, 0.32, 0.28]}
        color="#f4e8d6"
      />
      <Cylinder
        position={[0, 0.08, 0]}
        scale={[0.29, 0.12, 0.29]}
        color="#536955"
      />
      {[-0.26, 0.26].map((x) => (
        <Cylinder
          key={x}
          position={[x, 0.1, 0]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[0.09, 0.07, 0.09]}
          color="#2c3b31"
        />
      ))}
      <SoftBox
        position={[0, 0.57, 0]}
        size={[0.5, 0.34, 0.37]}
        radius={0.13}
        color="#f4e8d6"
      />
      <Box
        position={[0, 0.58, 0.145]}
        scale={[0.39, 0.18, 0.016]}
        color="#28453a"
      />
      <group ref={eyes}>
        {[-0.07, 0.07].map((x) => (
          <Box
            key={x}
            position={[x, 0.59, 0.158]}
            scale={[0.035, 0.043, 0.006]}
            color="#def0b8"
          />
        ))}
      </group>
      <Ball
        position={[0, 0.6, 0.176]}
        scale={[0.037, 0.012, 0.005]}
        color="#a9c98d"
      />
      {Array.from({ length: level }, (_, i) => (
        <group key={i} position={[0, 0.35 + i * 0.23, -0.05]}>
          <Box scale={[0.5, 0.035, 0.4]} color="#b9c3a1" />
          {items[i] && (
            <group position={[0, 0.03, 0]}>
              {items[i].product === "cookie" ? (
                <Cookie scale={0.8} />
              ) : (
                <PaperCup fill={1} product={items[i].product} scale={0.6} />
              )}
            </group>
          )}
        </group>
      ))}
      <Label
        text={stage === "idle" ? "BOMI · READY" : "BOMI · ON MY WAY"}
        position={[0, 0.21, 0.288]}
        size={[0.4, 0.08]}
        font={43}
        background="#536955"
      />
      <GroundShadow position={[0, 0.012, 0]} size={0.8} />
    </group>
  ) : (
    <group position={[layout.dock[0], 0.03, layout.dock[1]]}>
      <Box scale={[0.65, 0.045, 0.62]} color="#7d937b" />
      <Label
        text="BOMI’S DOCK"
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[0.55, 0.12]}
        font={50}
        background="#7d937b"
      />
    </group>
  );
}
