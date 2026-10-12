import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Box, Cylinder, Label, GroundShadow } from "./primitives";
import { useGame } from "../store/game";
import { caps } from "../data/operations";
import { BoxVisual, CarryVisual, PaperCup, Cookie } from "./OperationsProps";
import { Plant, Pendant } from "./Environment";
import type { Order } from "../store/operationTypes";

export function Stockroom() {
  const boxes = useGame((s) => s.ops.boxes),
    loose = useGame((s) => s.ops.loose),
    shelfLevel = useGame((s) => s.ops.levels.storage),
    dough = useGame((s) => s.ops.containers.dough),
    handoff = useGame((s) => s.ops.handoff),
    spills = useGame((s) => s.ops.spills),
    carry = useGame((s) => s.carry);
  const open = useGame((s) => s.ops.open),
    trayCapacity = useGame((s) => caps(s.ops.levels, "tray"));
  return (
    <>
      <group>
        <Box
          position={[-7.55, -0.08, 0.8]}
          scale={[3.15, 0.16, 7.4]}
          color="#b99f7c"
        />
        <Box
          position={[-9.05, 1.5, 0.75]}
          scale={[0.14, 3.1, 7.5]}
          color="#c9c2a9"
        />
        <Box
          position={[-7.5, 1.5, -2.8]}
          scale={[3.2, 3.1, 0.15]}
          color="#cec5af"
        />
        <Label
          position={[-7.55, 2.72, -2.7]}
          text="THE LITTLE STOCKROOM"
          size={[2.5, 0.4]}
          font={61}
          background="#cec5af"
          color="#5c6750"
        />
        <Box
          position={[-7.6, 0.45, -1.96]}
          scale={[1.85, 0.9, 0.6]}
          color="#6c836c"
        />
        <Box
          position={[-7.6, 0.95, -1.96]}
          scale={[1.95, 0.12, 0.7]}
          color="#d3b38a"
        />
        <Box
          position={[-7.45, 1.08, -1.87]}
          scale={[0.69, 0.17, 0.42]}
          color="#bf9d75"
        />
        <Label
          position={[-7.5, 1.1, -1.64]}
          text={`COOKIE DOUGH · ${dough}/24`}
          size={[0.76, 0.15]}
          font={53}
          background="#bf9d75"
          color="#435c45"
        />
        <Box
          position={[-8.65, 1.5, 0.8]}
          scale={[0.13, 2.9, 4.1]}
          color="#6b7660"
        />
        {Array.from({ length: 3 + shelfLevel }, (_, i) => (
          <Box
            key={i}
            position={[-8.15, 0.6 + i * 0.65, 0.8]}
            scale={[0.9, 0.065, 3.9]}
            color="#a9845b"
          />
        ))}
        <Label
          position={[-8.3, 2.77, 2.45]}
          rotation={[0, Math.PI / 2, 0]}
          text={`STORAGE · ${caps(useGame.getState().ops.levels, "storage")} BOXES`}
          size={[1.2, 0.23]}
          background="#445c49"
          font={50}
        />
        <Pendant position={[-7.55, 3.1, 1.4]} />
        <Plant position={[-8.45, 0, 3.7]} scale={0.7} />
        <Label
          position={[-5.9, 2.7, 2.4]}
          rotation={[0, Math.PI / 2, 0]}
          text="STOCKROOM ←"
          size={[1.25, 0.25]}
          background="#5b7561"
          font={55}
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
                ? 0.65 + Math.floor(box.slot / 4) * 0.49
                : 0,
              box.z,
            ]}
            rotation={[0, box.location === "storage" ? Math.PI / 2 : 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (
                Math.hypot(
                  useGame.getState().player.x - box.x,
                  useGame.getState().player.z - box.z,
                ) < 1.8
              )
                useGame.getState().takeBox(box.id);
            }}
          >
            <BoxVisual box={box} small={box.location === "storage"} />
            <GroundShadow position={[0, 0.005, 0]} size={0.8} />
          </group>
        ))}
      {loose.map((object) => (
        <group
          key={object.id}
          position={[object.x, 0.04, object.z]}
          onClick={(e) => {
            e.stopPropagation();
            if (
              Math.hypot(
                useGame.getState().player.x - object.x,
                useGame.getState().player.z - object.z,
              ) < 1.8
            )
              useGame.getState().pickupLoose(object.id);
          }}
        >
          <CarryVisual carry={object.carry} />
        </group>
      ))}
      <group position={[-5.2, 0, 2.05]}>
        <Cylinder
          position={[0, 0.32, 0]}
          scale={[0.29, 0.64, 0.29]}
          color="#536756"
        />
        <Cylinder
          position={[0, 0.68, 0]}
          scale={[0.31, 0.08, 0.31]}
          color="#8d9b7c"
        />
        <Label
          text="REUSE / RECYCLE"
          position={[0, 0.39, 0.294]}
          size={[0.43, 0.17]}
          background="#536756"
          font={55}
        />
      </group>
      <group position={[1.5, 1.48, -3.05]}>
        <Box scale={[0.75, 0.035, 0.56]} color="#a58e70" />
        {handoff.map((item, i) => (
          <group
            key={item.id}
            position={[-0.25 + (i % 3) * 0.24, 0.03, Math.floor(i / 3) * 0.25]}
          >
            {item.product === "cookie" ? (
              <Cookie quality={item.quality} scale={0.8} />
            ) : (
              <PaperCup fill={1} product={item.product} scale={0.8} />
            )}
          </group>
        ))}
        <Label
          text="HANDOFF"
          position={[0, 0.02, 0.3]}
          size={[0.6, 0.08]}
          background="#a58e70"
          color="#3f5742"
          font={46}
        />
      </group>
      <group position={[1.6, 1.46, -2.63]}>
        <Box scale={[0.62, 0.025, 0.28]} color="#9d8664" />
        <Label
          text={`SERVING TRAY · ${trayCapacity} ITEMS`}
          position={[0, 0.02, 0.15]}
          size={[0.6, 0.07]}
          font={46}
          background="#9d8664"
          color="#fff0cf"
        />
      </group>
      {spills.map((spill) => (
        <mesh
          key={spill.id}
          position={[spill.x, 0.021, spill.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (
              !carry &&
              Math.hypot(
                useGame.getState().player.x - spill.x,
                useGame.getState().player.z - spill.z,
              ) < 1.8
            )
              useGame.getState().cleanSpill(spill.id);
          }}
        >
          <circleGeometry args={[0.28, 18]} />
          <meshStandardMaterial
            color="#5b3e29"
            transparent
            opacity={0.6}
            roughness={0.18}
          />
        </mesh>
      ))}
      <group position={[4.6, 0, 4.5]}>
        <Box position={[0, 0.07, 0]} scale={[1.4, 0.13, 0.8]} color="#bbb79e" />
        <Box position={[0.8, 1.5, 0]} scale={[0.1, 3, 0.14]} color="#617b66" />
        <Label
          text={open ? "OPEN · COME IN" : "CLOSED · PREPARING"}
          position={[0.8, 1.5, 0.09]}
          size={[0.95, 0.23]}
          background="#49654f"
          font={52}
        />
      </group>
      <group position={[5.9, 0, -0.1]}>
        <Box position={[0, 1.12, 0]} scale={[0.7, 0.12, 1.6]} color="#b9926a" />
        <Box
          position={[0, 2.2, -0.9]}
          scale={[0.13, 2.2, 0.13]}
          color="#4c6b54"
        />
        <Box
          position={[0, 2.2, 0.9]}
          scale={[0.13, 2.2, 0.13]}
          color="#4c6b54"
        />
        <Box position={[0, 3.26, 0]} scale={[0.2, 0.13, 1.9]} color="#4c6b54" />
        <Label
          position={[0.14, 2.74, 0]}
          rotation={[0, Math.PI / 2, 0]}
          text="DRIVE-THROUGH\nA LITTLE SOMETHING WARM"
          size={[1.55, 0.43]}
          font={52}
          background="#4c6b54"
        />
      </group>
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
  const wheels = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (wheels.current)
      wheels.current.children.forEach(
        (w) => (w.rotation.x = braking ? 0 : clock.elapsedTime * 5),
      );
  });
  return (
    <group>
      <Box
        position={[0, 0.38, 0]}
        scale={[1.18, 0.45, truck ? 3.2 : length]}
        color={color}
        metal={0.3}
        rough={0.35}
      />
      <Box
        position={[0, 0.73, truck ? -0.4 : 0]}
        scale={[1.02, height, truck ? 1.8 : length * 0.53]}
        color={color}
        metal={0.25}
        rough={0.35}
      />
      <Box
        position={[0, 0.79, truck ? 0.66 : length * 0.27]}
        rotation={[-0.18, 0, 0]}
        scale={[0.9, 0.39, 0.035]}
        color="#3e6874"
        metal={0.45}
        rough={0.18}
      />
      <Box
        position={[-0.6, 0.76, 0]}
        scale={[0.015, 0.33, 0.65]}
        color="#48717a"
        metal={0.4}
        rough={0.2}
      />
      <Box
        position={[0.6, 0.76, 0]}
        scale={[0.015, 0.33, 0.65]}
        color="#48717a"
        metal={0.4}
        rough={0.2}
      />
      <Box
        position={[0, 0.37, (truck ? 3.2 : length) / 2 + 0.015]}
        scale={[0.8, 0.14, 0.03]}
        color="#c8c6b0"
        metal={0.8}
      />
      {[-0.4, 0.4].map((x) => (
        <group key={x}>
          <Box
            position={[x, 0.55, (truck ? 3.2 : length) / 2 + 0.035]}
            scale={[0.19, 0.13, 0.035]}
            color="#ffedb8"
          />
          <Box
            position={[x, 0.53, -(truck ? 3.2 : length) / 2 - 0.035]}
            scale={[0.18, 0.1, 0.035]}
            color={braking ? "#ff6f59" : "#a34f3d"}
          />
        </group>
      ))}
      <group ref={wheels}>
        {[-0.56, 0.56].flatMap((x) =>
          [-0.7, 0.7].map((z) => (
            <group
              key={`${x}-${z}`}
              position={[x, 0.24, z * (truck ? 1.5 : 1)]}
            >
              <Cylinder
                rotation={[0, 0, Math.PI / 2]}
                scale={[0.23, 0.13, 0.23]}
                color="#303737"
              />
              <Cylinder
                position={[Math.sign(x) * 0.07, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                scale={[0.12, 0.014, 0.12]}
                color="#bbc1ae"
                metal={0.65}
              />
            </group>
          )),
        )}
      </group>
      <GroundShadow position={[0, 0.008, 0]} size={3} />
      {truck && (
        <>
          <Label
            position={[-0.6, 0.77, -0.4]}
            rotation={[0, -Math.PI / 2, 0]}
            text="MOON DELIVERY\nGOOD THINGS IN SMALL BOXES"
            size={[1.7, 0.55]}
            background={color}
            color="#f5e8c9"
            font={55}
          />
          <Box
            position={[0, 1.16, -0.4]}
            scale={[1.1, 0.045, 1.8]}
            color="#d0c2a4"
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
    const target = o.vehicleZ;
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
      position={[7.72, -0.3, order.vehicleZ ?? 10 + index * 3.5]}
      rotation={[0, Math.PI, 0]}
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
      <group position={[7.72, -0.41, 0]}>
        <Box scale={[2.65, 0.04, 25]} color="#354d4f" rough={0.19} />
        {[-1, 1].map((x) => (
          <Box
            key={x}
            position={[x, 0.035, 0]}
            scale={[0.035, 0.015, 22]}
            color="#8e9783"
          />
        ))}
        {[3.5, 7, 10.5].map((z) => (
          <Box
            key={z}
            position={[0, 0.04, z]}
            scale={[1.3, 0.018, 0.045]}
            color="#c9bf9e"
          />
        ))}
        <Label
          text="COFFEE TO GO →"
          position={[0, 0.06, 3.8]}
          rotation={[-Math.PI / 2, 0, 0]}
          size={[1.8, 0.48]}
          font={58}
          background="#354d4f"
        />
      </group>
      {orders.map((o, i) => (
        <DriveCar key={o.id} order={o} index={i} />
      ))}
      <group
        ref={truck}
        position={[-12, -0.32, 7.7]}
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
        position={[0, -0.4, 7.75]}
        scale={[25, 0.04, 2.9]}
        color="#334a4c"
        rough={0.16}
      />
      <Label
        text="DELIVERIES · THANK YOU"
        position={[-2, 0.04, 5.45]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[2.7, 0.38]}
        font={62}
        background="#aead97"
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
  const point = useMemo(() => new THREE.Vector3(0.55, 0, -0.9), []);
  useFrame(({ clock }, dt) => {
    if (!robot.current) return;
    const r = useGame.getState().ops.robot;
    if (r.stage === "idle" || r.route.length < 2) point.set(0.55, 0, -0.9);
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
    <group ref={robot} position={[0.55, 0, -0.9]}>
      <Cylinder
        position={[0, 0.19, 0]}
        scale={[0.28, 0.32, 0.28]}
        color="#d5d7ba"
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
      <Box position={[0, 0.57, 0]} scale={[0.43, 0.24, 0.27]} color="#849d82" />
      <Box
        position={[0, 0.58, 0.145]}
        scale={[0.35, 0.17, 0.012]}
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
    <group position={[0.55, 0.03, -0.9]}>
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
