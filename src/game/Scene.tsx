import { studioEnvironment } from "./art";
import type { Order } from "../store/operationTypes";
import { ProductIcon } from "../ui/ProductIcon";
import { layout, counterSpot, stationVisuals } from "../data/layout";
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
import { stationPositions, supplyCatalog, caps } from "../data/operations";
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
import { orderFocusBias, targetFacing } from "./focus";

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
  const carryAge = useRef(0);
  useEffect(() => {
    carryAge.current = 0;
    carryGroup.current?.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = false;
    });
  }, [carry]);
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
      carryAge.current += dt;
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
    if (carryGroup.current)
      carryGroup.current.position.y -= 0.1 * Math.exp(-carryAge.current * 14);
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
      aim = position,
    ) => {
      const dx = position[0] - m.x,
        dz = position[2] - m.z,
        distance = Math.hypot(dx, dz),
        facing = targetFacing(
          m.x,
          m.z,
          s.cameraMode === "first" ? view.yaw : m.angle,
          aim,
        );
      if (distance < 1.8 && (s.cameraMode === "first" ? facing > 0.68 : true))
        candidates.push({
          focus: { kind, id, label, position: [...aim], distance },
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
      if (
        id === "dough" &&
        s.carry?.kind === "box" &&
        s.ops.boxes.find((b) => b.id === (s.carry as { boxId: number }).boxId)
          ?.supply !== "dough"
      )
        continue;
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

      consider(
        "station",
        id,
        stationLabel(id),
        point,
        bias,
        stationVisuals[id],
      );
    }
    if (!s.carry)
      for (const box of s.ops.boxes)
        if (box.location !== "carried")
          consider(
            "box",
            box.id,
            `${box.quantity ? "Pick up" : "Recycle"} ${supplyCatalog[box.supply].name.toLowerCase()} · ${box.quantity}`,
            [
              box.x,
              box.location === "storage"
                ? Math.max(0.12, 2.49 - Math.floor(box.slot / 5) * 0.63) + 0.65
                : 0.6,
              box.z,
            ],
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
    const zoom = (event: WheelEvent) => {
      const s = useGame.getState();
      if (
        s.cameraMode !== "isometric" ||
        s.phone ||
        s.workstation ||
        s.paused ||
        s.help ||
        s.settingsOpen
      )
        return;
      event.preventDefault();
      view.zoom = THREE.MathUtils.clamp(
        view.zoom + event.deltaY * 0.00035,
        0.88,
        1.14,
      );
    };
    gl.domElement.addEventListener("wheel", zoom, { passive: false });
    gl.domElement.addEventListener("click", click);
    return () => {
      gl.domElement.removeEventListener("click", click);
      gl.domElement.removeEventListener("wheel", zoom);
    };
  }, [gl]);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05),
      s = useGame.getState(),
      p = playerMotion;
    const first =
      s.cameraMode === "first" && s.phase !== "title" && s.phase !== "summary";
    if (first) {
      const atWindow =
        Math.hypot(p.x - stationPositions.window[0], p.z - layout.windowZ) < 1.15 &&
        Math.sin(view.yaw) > 0.65;
      const eyeHeight = atWindow ? 1.17 : 1.62;
      position.current.set(p.x, eyeHeight, p.z);
      target.current.set(
        p.x + Math.sin(view.yaw) * Math.cos(view.pitch) * 3,
        eyeHeight + Math.sin(view.pitch) * 3,
        p.z + Math.cos(view.yaw) * Math.cos(view.pitch) * 3,
      );
    } else if (s.workstation) {
      position.current.set(3.2, 3.18, 0.2);
      target.current.set(2.65, 1.75, -2.6);
    } else {
      const x = s.phase === "title" ? 0.55 : 0.55 + p.x * 0.055,
        z = s.phase === "title" ? -0.1 : -0.1 + p.z * 0.04;
      target.current.set(x, 0.6, z);
      const aspect =
        camera instanceof THREE.PerspectiveCamera ? camera.aspect : 1.7;
      const scale = view.zoom * Math.min(2.35, Math.max(1, 1.3 / aspect));
      position.current.set(x + 13 * scale, 16 * scale, z + 13 * scale);
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
  const stockPoses = useGame((s) =>
    s.ops.boxes.map((b) => `${b.id}:${b.location}:${b.x}:${b.z}`).join("|"),
  );
  useEffect(() => {
    if (light.current) light.current.shadow.needsUpdate = true;
  }, [purchased, graphics, stockPoses]);
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
        (s.phase === "closing" || s.phase === "summary" ? 1.25 : 1.85) *
        flicker;
    }
  });
  return (
    <>
      <hemisphereLight args={["#dfcfa8", "#626151", 1.15]} />
      <ambientLight intensity={0.28} color="#afc4c5" />
      <directionalLight
        ref={light}
        position={[2, 9, 5]}
        color="#fff0d6"
        intensity={1.85}
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
        shadow-radius={3}
      />
      <pointLight
        position={[2.35, 2.96, -1.3]}
        color="#ffc978"
        intensity={7}
        distance={9}
        decay={2}
      />
      <pointLight
        position={[-3.45, 2.8, 0.3]}
        color="#ffe0a1"
        intensity={6}
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

function CapacityNote({ id }: { id: string | number }) {
  const s = useGame();
  const list: [string, number, number][] = [];
  if (id === "machine" || id === "hopper")
    list.push(["Beans", s.ops.containers.beans, caps(s.ops.levels, "hopper")]);
  if (id === "machine" || id === "milk")
    list.push(["Milk", s.ops.containers.milk, caps(s.ops.levels, "milkTank")]);
  if (id === "cups" || id === "machine")
    list.push([
      "Cups",
      s.ops.containers.cups,
      caps(s.ops.levels, "cupDispenser"),
    ]);
  if (id === "display")
    list.push([
      "Cookies",
      s.ops.display.quantity,
      caps(s.ops.levels, "display"),
    ]);
  if (id === "oven")
    list.push(["Tray", s.ops.oven.quantity, caps(s.ops.levels, "oven")]);
  if (id === "dough") list.push(["Dough", s.ops.containers.dough, 24]);
  if (id === "syrup") list.push(["Vanilla", s.ops.containers.syrup, 10]);
  return list.length ? (
    <div className="capacity-note">
      {list.map(([name, amount, total]) => (
        <span key={name}>
          {name}
          <b>
            {amount}/{total}
          </b>
        </span>
      ))}
    </div>
  ) : null;
}
function WorldPrompts() {
  const focus = useFocus((s) => s.focus),
    mode = useGame((s) => s.cameraMode),
    phone = useGame((s) => s.phone),
    workstation = useGame((s) => s.workstation);
  if (!focus || mode === "first" || phone || workstation) return null;
  return (
    <Html
      position={[
        focus.position[0],
        focus.position[1] + 0.15,
        focus.position[2],
      ]}
      center
      zIndexRange={[9, 0]}
    >
      <div className="world-context">
        <button className="world-prompt" onClick={interact}>
          <kbd>E</kbd>
          <span>{focus.label}</span>
        </button>
        <CapacityNote id={focus.id} />
      </div>
    </Html>
  );
}
function OrderBubble({ order }: { order: Order }) {
  const anchor = useRef<THREE.Group>(null),
    mode = useGame((s) => s.cameraMode),
    phone = useGame((s) => s.phone);
  useFrame(() => {
    if (!anchor.current) return;
    const m = visitorMotions.get(order.visitorUid);
    const point =
      order.channel === "drive"
        ? [layout.laneX, 2.03, layout.windowZ - order.vehicleZ]
        : [
            m?.x ?? counterSpot(order.id)[0],
            2.1 + (order.accepted ? 0 : (order.id % 3) * 0.35),
            m?.z ?? counterSpot(order.id)[1],
          ];
    anchor.current.position.set(point[0], point[1], point[2]);
    anchor.current.visible =
      !phone &&
      (mode !== "first" ||
        Math.hypot(point[0] - playerMotion.x, point[2] - playerMotion.z) < 4.3);
  });
  if (phone) return null;
  return (
    <group ref={anchor}>
      <Html center zIndexRange={[6, 0]}>
        <div className={`order-bubble ${order.channel}`}>
          <small>
            {order.channel === "drive"
              ? "Drive thru"
              : customerById(order.customer).name}
          </small>
          <div className="bubble-products">
            {order.lines.map((l) => (
              <span
                key={l.product}
                className={l.delivered === l.quantity ? "done" : ""}
              >
                <ProductIcon product={l.product} size={27} />
                <b>{l.quantity - l.delivered || "✓"}</b>
              </span>
            ))}
          </div>
          <em>
            {order.accepted ? "Your order is on its way" : "E · take order"}
          </em>
        </div>
      </Html>
    </group>
  );
}
function OrderBubbles() {
  const s = useGame();
  if (s.phase === "title" || s.phase === "summary" || s.workstation)
    return null;
  return (
    <>
      {s.ops.orders
        .filter(
          (o) =>
            !o.paid &&
            (o.channel === "drive"
              ? o.vehiclePhase === "waiting"
              : s.visitors.find((v) => v.uid === o.visitorUid)?.phase !==
                "entering"),
        )
        .map((order) => (
          <OrderBubble key={order.id} order={order} />
        ))}
    </>
  );
}
function World() {
  const scene = useThree((s) => s.scene);
  const renderer = useThree((s) => s.gl);
  useEffect(() => {
    scene.environmentIntensity = 0.24;
  }, [scene]);
  const visitors = useGame((s) => s.visitors),
    purchased = useGame((s) => s.purchased);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const target = window as unknown as { __CAFE_DEV__?: unknown };
    target.__CAFE_DEV__ = {
      state: useGame,
      motion: playerMotion,
      focus: useFocus,
      walkable: isWalkable,
      visitors: visitorMotions,
      view,
      scene,
      renderer: renderer.info,
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
      <primitive attach="environment" object={studioEnvironment} />
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
        gl.setClearColor("#233740");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
      }}
    >
      <fog attach="fog" args={["#233740", 55, 95]} />
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
