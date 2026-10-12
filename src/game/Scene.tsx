import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Environment, isWalkable } from "./Environment";
import {
  Person,
  playerMotion,
  VisitorActor,
  visitorMotions,
  Milo,
  Mochi,
  miloMotion,
} from "./Characters";
import { useGame } from "../store/game";
import {
  stationPositions,
  supplyCatalog,
  products,
  caps,
} from "../data/operations";
import type { StationId } from "../data/operations";
import { customerById } from "../data/content";
import {
  useFocus,
  keys,
  view,
  interact,
  releasePointer,
  capturePointer,
} from "./controls";
import type { Focus } from "./controls";
import { AutoMachine, Bakery, CarryVisual } from "./OperationsProps";
import { Stockroom, Traffic, ServingRobot } from "./OperationsWorld";
import { audio } from "./audio";
import { orderFocusBias } from "./focus";
import { Icon } from "../ui/Icon";

export function stationLabel(id: StationId) {
  const s = useGame.getState();
  if (id === "machine")
    return s.carry?.kind === "cup" && s.ops.machine.stage === "empty"
      ? "Place cup below spout"
      : s.ops.machine.stage === "ready"
        ? "Collect finished coffee"
        : s.ops.machine.stage === "cup"
          ? "Choose a coffee"
          : "Automatic coffee machine";
  if (id === "cups")
    return s.carry?.kind === "box"
      ? "Refill cup dispenser"
      : `Take a paper cup · ${s.ops.containers.cups} left`;
  if (id === "hopper")
    return `Refill beans · ${s.ops.containers.beans}/${caps(s.ops.levels, "hopper")}`;
  if (id === "milk")
    return `Refill milk · ${s.ops.containers.milk}/${caps(s.ops.levels, "milkTank")}`;
  if (id === "syrup") return `Refill vanilla · ${s.ops.containers.syrup}/10`;
  if (id === "dough")
    return s.carry?.kind === "box"
      ? "Refill dough station"
      : `Prepare a cookie tray · ${s.ops.containers.dough} dough`;
  if (id === "oven")
    return s.ops.oven.stage === "ready"
      ? "Collect warm cookie tray"
      : s.ops.oven.stage === "loaded"
        ? "Close door & start oven"
        : s.carry?.kind === "bakingTray"
          ? "Put tray in oven"
          : "Cookie oven";
  if (id === "display")
    return s.carry?.kind === "bakingTray"
      ? "Transfer cookies to display"
      : `Take a cookie · ${s.ops.display.quantity} ready`;
  if (id === "storage")
    return s.carry?.kind === "box" ? "Place box on shelf" : "Stockroom shelves";
  if (id === "trash") return "Dispose in the bin";
  if (id === "grounds") return `Take grounds to bin · ${s.ops.grounds}/8`;
  if (id === "robot")
    return caps(s.ops.levels, "robot")
      ? "Load Bomi for an indoor order"
      : "Bomi’s serving dock";
  if (id === "handoff")
    return s.carry?.kind === "product" || s.carry?.kind === "tray"
      ? "Place products at handoff"
      : "Collect a handoff product";
  if (id === "tray")
    return `Take serving tray · ${caps(s.ops.levels, "tray")} item capacity`;
  if (id === "door")
    return s.ops.open ? "Close after last orders" : "Open the café";
  if (id === "window") return "Drive-through service window";
  return "Say hello to Milo";
}
function PlayerController() {
  const phase = useGame((s) => s.phase),
    shift = useGame((s) => s.shift),
    carry = useGame((s) => s.carry),
    cameraMode = useGame((s) => s.cameraMode);
  const carryGroup = useRef<THREE.Group>(null),
    footstep = useRef(0),
    saveTimer = useRef(0),
    focusTimer = useRef(0);
  useEffect(() => {
    const p = useGame.getState().player;
    Object.assign(playerMotion, { ...p, walking: false });
    view.yaw = p.angle;
  }, [shift, phase === "title"]);
  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.05),
      s = useGame.getState(),
      m = playerMotion;
    const blocked =
      !(s.phase === "playing" || s.phase === "closing") ||
      s.phone ||
      s.workstation ||
      s.managementOpen ||
      s.settingsOpen ||
      s.paused ||
      s.help ||
      s.debugOpen;
    const h = blocked ? 0 : (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0),
      v = blocked ? 0 : (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0);
    let dx = (h + v) / Math.SQRT2,
      dz = (-h + v) / Math.SQRT2;
    if (s.cameraMode === "first") {
      dx = Math.cos(view.yaw) * h - Math.sin(view.yaw) * v;
      dz = -Math.sin(view.yaw) * h - Math.cos(view.yaw) * v;
    }
    const norm = Math.hypot(dx, dz);
    m.walking = norm > 0;
    if (norm) {
      const step = dt * (s.carry?.kind === "box" ? 2.2 : 2.8);
      if (isWalkable(m.x + (dx / norm) * step, m.z)) m.x += (dx / norm) * step;
      if (isWalkable(m.x, m.z + (dz / norm) * step)) m.z += (dz / norm) * step;
      m.angle = s.cameraMode === "first" ? view.yaw : Math.atan2(dx, dz);
      footstep.current += dt;
      if (footstep.current > 0.38) {
        audio.play("footstep");
        footstep.current = 0;
      }
    } else if (s.cameraMode === "first") m.angle = view.yaw;
    saveTimer.current += dt;
    if (saveTimer.current > 0.35) {
      saveTimer.current = 0;
      if (
        Math.abs(s.player.x - m.x) + Math.abs(s.player.z - m.z) > 0.005 ||
        Math.abs(s.player.angle - m.angle) > 0.01
      )
        useGame.setState({ player: { x: m.x, z: m.z, angle: m.angle } });
    }
    if (carryGroup.current) {
      if (s.cameraMode === "first") {
        carryGroup.current.position.copy(camera.position);
        carryGroup.current.quaternion.copy(camera.quaternion);
        carryGroup.current.translateX(0.23);
        carryGroup.current.translateY(-0.22);
        carryGroup.current.translateZ(-0.35);
        carryGroup.current.scale.setScalar(
          s.carry?.kind === "box" ? 0.4 : 0.55,
        );
      } else {
        carryGroup.current.position.set(
          m.x + Math.sin(m.angle) * 0.47,
          1.0,
          m.z + Math.cos(m.angle) * 0.47,
        );
        carryGroup.current.rotation.set(0, m.angle, 0);
        carryGroup.current.scale.setScalar(0.82);
      }
    }
    focusTimer.current += dt;
    if (focusTimer.current < 0.12) return;
    focusTimer.current = 0;
    if (blocked) {
      if (useFocus.getState().focus) useFocus.getState().setFocus(null);
      return;
    }
    const candidates: { focus: Focus; score: number }[] = [];
    const consider = (
      kind: Focus["kind"],
      id: Focus["id"],
      label: string,
      position: readonly [number, number, number],
      bias = 0,
    ) => {
      const dx = position[0] - m.x,
        dz = position[2] - m.z,
        distance = Math.hypot(dx, dz),
        facing = distance
          ? (Math.sin(s.cameraMode === "first" ? view.yaw : m.angle) * dx +
              Math.cos(s.cameraMode === "first" ? view.yaw : m.angle) * dz) /
            distance
          : 1;
      if (distance < 1.8 && (s.cameraMode === "first" ? facing > 0.68 : true))
        candidates.push({
          focus: { kind, id, label, position: [...position], distance },
          score: distance + (1 - facing) * 0.15 + bias,
        });
    };
    for (const [id, position] of Object.entries(stationPositions) as [
      StationId,
      readonly [number, number, number],
    ][]) {
      let bias = 0;
      if (id === "hopper" || id === "milk" || id === "syrup") {
        const box =
          s.carry?.kind === "box"
            ? s.ops.boxes.find(
                (b) => b.id === (s.carry as { boxId: number }).boxId,
              )
            : undefined;
        if (!box) continue;
        const match =
          id === "hopper" ? "beans" : id === "milk" ? "milk" : "syrup";
        if (box.supply !== match) continue;
        bias = -0.65;
      }
      if (id === "grounds" && (s.carry || s.ops.grounds < 4)) continue;
      if (id === "tray" && s.carry) continue;
      if (id === "robot" && !caps(s.ops.levels, "robot")) continue;
      if (
        id === "display" &&
        !s.ops.display.quantity &&
        s.carry?.kind !== "bakingTray"
      )
        continue;
      if (
        id === "window" &&
        !s.ops.orders.some(
          (o) =>
            o.channel === "drive" && o.vehiclePhase === "waiting" && !o.paid,
        )
      )
        continue;
      if (
        id === "handoff" &&
        !s.ops.handoff.length &&
        s.carry?.kind !== "product" &&
        s.carry?.kind !== "tray"
      )
        continue;
      if (id === "cups" && s.carry?.kind === "box") {
        const box = s.ops.boxes.find(
          (b) => b.id === (s.carry as { boxId: number }).boxId,
        );
        if (box?.supply === "cups") bias = -0.6;
        else continue;
      }
      if (id === "oven" && s.carry?.kind === "bakingTray") bias = -0.6;
      if (
        id === "machine" &&
        (s.carry?.kind === "cup" || s.ops.machine.stage === "ready")
      )
        bias = -0.45;
      if (id === "storage" && s.carry?.kind !== "box") continue;
      if (id === "trash" && !s.carry) continue;
      if (id === "cat") {
        consider(
          "station",
          id,
          stationLabel(id),
          [miloMotion.x, miloMotion.y + 0.6, miloMotion.z],
          0.15,
        );
        continue;
      }
      const point: [number, number, number] = [
        position[0],
        position[1],
        position[2],
      ];
      if (position[2] < -2.5 && position[0] > -6) point[2] = -2.15;
      consider("station", id, stationLabel(id), point, bias);
    }
    if (!s.carry)
      for (const box of s.ops.boxes)
        if (box.location !== "carried")
          consider(
            "box",
            box.id,
            `${box.quantity ? "Pick up" : "Recycle"} ${supplyCatalog[box.supply].name.toLowerCase()} · ${box.quantity}`,
            [box.x, box.location === "storage" ? 1.3 : 0.6, box.z],
            -0.1,
          );
    if (!s.carry)
      for (const loose of s.ops.loose)
        consider("loose", loose.id, "Pick up your object", [
          loose.x,
          0.5,
          loose.z,
        ]);
    if (!s.carry)
      for (const spill of s.ops.spills)
        consider("spill", spill.id, "Wipe the spill", [spill.x, 0.2, spill.z]);
    for (const order of s.ops.orders.filter(
      (o) => o.channel === "indoor" && !o.paid,
    )) {
      const visitor = s.visitors.find((v) => v.uid === order.visitorUid);
      if (!visitor || visitor.phase === "entering") continue;
      const pos = visitorMotions.get(order.visitorUid);
      if (pos)
        consider(
          "customer",
          order.id,
          order.accepted
            ? `Serve ${customerById(order.customer).name}`
            : `Take ${customerById(order.customer).name}’s order`,
          [pos.x, 1.95, pos.z],
          orderFocusBias(order, s.carry),
        );
    }
    const f = candidates.sort((a, b) => a.score - b.score)[0]?.focus ?? null,
      old = useFocus.getState().focus;
    if (
      old?.id !== f?.id ||
      old?.label !== f?.label ||
      old?.kind !== f?.kind ||
      (old && f && Math.abs(old.distance - f.distance) > 0.05)
    )
      useFocus.getState().setFocus(f);
  });
  return (
    <>
      <group visible={cameraMode !== "first"}>
        <Person motion={playerMotion} player carrying={!!carry} />
      </group>
      {carry && (
        <group ref={carryGroup}>
          <CarryVisual carry={carry} />
        </group>
      )}
    </>
  );
}

function CameraRig() {
  const { camera, gl } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.6, 0)),
    position = useRef(new THREE.Vector3()),
    target = useRef(new THREE.Vector3());
  const mode = useGame((s) => s.cameraMode),
    menu = useGame(
      (s) =>
        s.phone ||
        s.workstation ||
        s.settingsOpen ||
        s.paused ||
        s.help ||
        s.managementOpen ||
        s.phase === "title" ||
        s.phase === "summary",
    );
  useEffect(() => {
    if (menu) releasePointer();
  }, [menu]);
  useEffect(() => {
    view.yaw = playerMotion.angle;
    view.pitch = -0.07;
  }, [mode]);
  useEffect(() => {
    const click = () => {
      void capturePointer();
    };
    gl.domElement.addEventListener("click", click);
    return () => gl.domElement.removeEventListener("click", click);
  }, [gl]);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05),
      s = useGame.getState(),
      p = playerMotion;
    const first =
      s.cameraMode === "first" && s.phase !== "title" && s.phase !== "summary";
    if (first) {
      position.current.set(p.x, 1.62, p.z);
      target.current.set(
        p.x + Math.sin(view.yaw) * Math.cos(view.pitch) * 3,
        1.62 + Math.sin(view.pitch) * 3,
        p.z + Math.cos(view.yaw) * Math.cos(view.pitch) * 3,
      );
    } else if (s.workstation) {
      position.current.set(-0.85, 3.28, -0.35);
      target.current.set(-1.5, 1.95, -3.0);
    } else {
      const x = s.phase === "title" ? -1 : p.x * 0.18 - 0.4,
        z = s.phase === "title" ? 0.35 : p.z * 0.12;
      target.current.set(x, 0.55, z);
      position.current.set(x + 13.4, 16, z + 13.4);
    }
    const speed = first
      ? 10 + (1 - s.settings.smoothing) * 6
      : s.workstation
        ? 4
        : 2 + (1 - s.settings.smoothing) * 4;
    camera.position.lerp(position.current, 1 - Math.exp(-dt * speed));
    look.current.lerp(target.current, 1 - Math.exp(-dt * speed));
    camera.lookAt(look.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const desired = first ? 72 : s.workstation ? 45 : 40;
      camera.fov = THREE.MathUtils.damp(camera.fov, desired, 5, dt);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function AdaptiveResolution() {
  const setDpr = useThree((s) => s.setDpr);
  const size = useThree((s) => s.size);
  const graphics = useGame((s) => s.settings.graphics);
  const sampling = useRef({
    seconds: 0,
    frames: 0,
    warmup: 3,
    ratio: 1,
    goodSeconds: 0,
  });
  useEffect(() => {
    const ceiling =
      graphics === "high" ? Math.min(window.devicePixelRatio, 1.5) : 0.85;
    const ratio = Math.min(
      ceiling,
      Math.sqrt(
        (graphics === "high" ? 4_000_000 : 1_400_000) /
          Math.max(1, size.width * size.height),
      ),
    );
    sampling.current = {
      seconds: 0,
      frames: 0,
      warmup: 3,
      ratio,
      goodSeconds: 0,
    };
    setDpr(ratio);
  }, [graphics, setDpr, size.width, size.height]);
  useFrame((_, dt) => {
    const s = sampling.current;
    if (document.hidden) return;
    if (s.warmup > 0) {
      s.warmup -= dt;
      return;
    }
    s.seconds += Math.min(dt, 0.1);
    s.frames++;
    if (s.seconds < 2) return;
    const average = s.seconds / s.frames;
    if (average > 0.0195) {
      const ratio = Math.max(
        graphics === "high" ? 0.55 : 0.45,
        s.ratio * Math.max(0.8, Math.min(0.94, Math.sqrt(0.0175 / average))),
      );
      if (Math.abs(ratio - s.ratio) > 0.015) {
        s.ratio = ratio;
        setDpr(ratio);
      }
      s.goodSeconds = 0;
    } else if (average < 0.0172) {
      s.goodSeconds += s.seconds;
      const ceiling =
        graphics === "high" ? Math.min(window.devicePixelRatio, 1.5) : 0.85;
      if (s.goodSeconds > 16 && s.ratio < ceiling) {
        s.ratio = Math.min(ceiling, s.ratio + 0.04);
        setDpr(s.ratio);
        s.goodSeconds = 0;
      }
    }
    s.seconds = 0;
    s.frames = 0;
  });
  return null;
}
function Atmosphere() {
  const rain = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const spots = useRef<Float32Array>(new Float32Array(320 * 3));
  const dummy = useRef(new THREE.Object3D());
  const purchased = useGame((s) => s.purchased);
  const graphics = useGame((s) => s.settings.graphics);
  useEffect(() => {
    if (light.current) light.current.shadow.needsUpdate = true;
  }, [purchased, graphics]);
  useEffect(() => {
    for (let i = 0; i < 320; i++) {
      spots.current[i * 3] = 6.35 + Math.random() * 6;
      spots.current[i * 3 + 1] = Math.random() * 10;
      spots.current[i * 3 + 2] = -10 + Math.random() * 20;
    }
  }, []);
  useFrame(({ clock }, rawDt) => {
    const s = useGame.getState();
    const heavy = s.event === "rain";
    audio.setRain(
      heavy,
      0.45 + 0.55 * Math.max(0, 1 - Math.abs(6 - playerMotion.x) / 10),
    );
    audio.setRain(
      heavy,
      0.45 + 0.55 * Math.max(0, 1 - Math.abs(6 - playerMotion.x) / 10),
    );
    const dt = Math.min(rawDt, 0.05);
    if (rain.current) {
      const count = s.settings.graphics === "low" ? 140 : 320;
      rain.current.count = count;
      for (let i = 0; i < count; i++) {
        const offset = i * 3;
        spots.current[offset + 1] -= dt * (heavy ? 9 : 6);
        if (spots.current[offset + 1] < -0.5) spots.current[offset + 1] = 9.5;
        dummy.current.position.set(
          spots.current[offset],
          spots.current[offset + 1],
          spots.current[offset + 2],
        );
        dummy.current.scale.set(0.011, heavy ? 0.26 : 0.16, 0.011);
        dummy.current.rotation.z = 0.14;
        dummy.current.updateMatrix();
        rain.current.setMatrixAt(i, dummy.current.matrix);
      }
      rain.current.instanceMatrix.needsUpdate = true;
    }
    if (light.current) {
      const flicker =
        s.event === "flicker"
          ? Math.sin(clock.elapsedTime * 22) > 0
            ? 0.18
            : 0.8
          : 1;
      light.current.intensity =
        (s.phase === "closing" || s.phase === "summary" ? 1.6 : 2.3) * flicker;
    }
  });
  return (
    <>
      <hemisphereLight args={["#dfcfa8", "#626151", 1.15]} />
      <ambientLight intensity={0.28} color="#afc4c5" />
      <directionalLight
        ref={light}
        position={[2, 9, 5]}
        color="#ffe2ac"
        intensity={2.3}
        castShadow
        shadow-autoUpdate={false}
        shadow-needsUpdate
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={8}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0006}
        shadow-normalBias={0.025}
      />
      <pointLight
        position={[-2, 3, -2.3]}
        color="#ffc978"
        intensity={14}
        distance={9}
        decay={2}
      />
      <pointLight
        position={[3.4, 3, 0.6]}
        color="#ffe0a1"
        intensity={9}
        distance={7}
        decay={2}
      />
      <directionalLight position={[9, 5, -6]} color="#779cac" intensity={0.8} />
      <instancedMesh
        ref={rain}
        args={[undefined, undefined, 320]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshBasicMaterial
          color="#afc8d0"
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  );
}

function WorldPrompts() {
  const focus = useFocus((s) => s.focus),
    mode = useGame((s) => s.cameraMode),
    phone = useGame((s) => s.phone);
  if (!focus || mode === "first" || phone) return null;
  return (
    <Html position={focus.position} center zIndexRange={[9, 0]}>
      <button className="world-prompt" onClick={interact}>
        <kbd>E</kbd>
        <span>{focus.label}</span>
      </button>
    </Html>
  );
}
function OrderBubbles() {
  const orders = useGame((s) => s.ops.orders),
    visitors = useGame((s) => s.visitors),
    mode = useGame((s) => s.cameraMode),
    phase = useGame((s) => s.phase);
  if (phase === "title" || phase === "summary") return null;
  return (
    <>
      {orders
        .filter((o) => !o.paid)
        .map((order) => {
          const visitor = visitors.find((v) => v.uid === order.visitorUid);
          const point =
            order.channel === "drive"
              ? [5.9, 2.1, 0]
              : [
                  1.7 + (order.id % 3) * 0.38,
                  2.13 + (order.id % 3) * 0.35,
                  -1.45 + (order.id % 3) * 0.3,
                ];
          if (
            (order.channel === "indoor" && visitor?.phase === "entering") ||
            (order.channel === "drive" && order.vehiclePhase !== "waiting")
          )
            return null;
          if (
            mode === "first" &&
            Math.hypot(point[0] - playerMotion.x, point[2] - playerMotion.z) > 5
          )
            return null;
          return (
            <Html
              key={order.id}
              position={point as [number, number, number]}
              center
              zIndexRange={[6, 0]}
            >
              <div className={`order-bubble ${order.channel}`}>
                <small>
                  {order.channel === "drive"
                    ? "DRIVE-THROUGH"
                    : customerById(order.customer).name}{" "}
                  · {order.accepted ? "IN PROGRESS" : "ORDER HERE"}
                </small>
                {order.lines.map((line) => (
                  <span
                    key={line.product}
                    className={line.delivered === line.quantity ? "done" : ""}
                  >
                    <Icon
                      name={line.product === "cookie" ? "cookie" : "coffee"}
                      size={15}
                    />
                    {products[line.product].name}
                    <b>{line.quantity - line.delivered || "✓"}</b>
                  </span>
                ))}
                <small className="bubble-quote">
                  $
                  {order.lines
                    .reduce((sum, line) => sum + line.price * line.quantity, 0)
                    .toFixed(2)}{" "}
                  · paid when complete
                </small>
              </div>
            </Html>
          );
        })}
    </>
  );
}
function World() {
  const visitors = useGame((s) => s.visitors),
    purchased = useGame((s) => s.purchased);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const target = window as unknown as { __CAFE_DEV__?: unknown };
    target.__CAFE_DEV__ = {
      state: useGame,
      motion: playerMotion,
      focus: useFocus,
    };
    return () => {
      delete target.__CAFE_DEV__;
    };
  }, []);
  useEffect(() => {
    const live = new Set(visitors.map((v) => v.uid));
    for (const uid of visitorMotions.keys())
      if (!live.has(uid)) visitorMotions.delete(uid);
  }, [visitors.length]);
  return (
    <>
      <AdaptiveResolution />
      <CameraRig />
      <Atmosphere />
      <Environment />
      <AutoMachine />
      <Bakery />
      <Stockroom />
      <Traffic />
      <ServingRobot />
      <PlayerController />
      {visitors.map((v) => (
        <VisitorActor key={v.uid} visitor={v} />
      ))}
      <Milo />
      {purchased.includes("mochi") && <Mochi />}
      <WorldPrompts />
      <OrderBubbles />
    </>
  );
}
export function Scene() {
  const graphics = useGame((s) => s.settings.graphics);
  return (
    <Canvas
      className="game-canvas"
      shadows={graphics === "high" ? "soft" : false}
      dpr={graphics === "high" ? [1, 1.5] : 1}
      camera={{ position: [13.4, 16, 13.4], fov: 40, near: 0.06, far: 100 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#203139");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.13;
      }}
    >
      <fog attach="fog" args={["#203139", 34, 70]} />
      <World />
    </Canvas>
  );
}
export function GameClock() {
  useEffect(() => {
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      useGame.getState().tick(Math.min(0.5, (now - last) / 1000));
      last = now;
    }, 100);
    const visible = () => {
      last = performance.now();
    };
    document.addEventListener("visibilitychange", visible);
    audio.update(useGame.getState().settings);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return null;
}
