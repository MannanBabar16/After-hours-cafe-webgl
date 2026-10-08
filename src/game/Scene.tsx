import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Environment, isWalkable } from "./Environment";
import { CoffeeMachine } from "./CoffeeMachine";
import { BarTools, DirtyTables } from "./BarTools";
import {
  Person,
  playerMotion,
  VisitorActor,
  visitorMotions,
  Milo,
  Mochi,
} from "./Characters";
import { useGame } from "../store/game";
import { useFocus, keys, interact } from "./controls";
import type { Focus } from "./controls";
import { customerById, recipeById, MACHINE } from "../data/content";
import { audio } from "./audio";

function Player() {
  const tray = useGame((s) => s.tray);
  const shift = useGame((s) => s.shift);
  const phase = useGame((s) => s.phase);
  const timer = useRef(0);
  const footstep = useRef(0);
  useEffect(() => {
    playerMotion.x = -0.8;
    playerMotion.z = -1.45;
    playerMotion.angle = Math.PI;
  }, [shift, phase === "title"]);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useGame.getState();
    const m = playerMotion;
    const locked =
      s.phase !== "playing" ||
      s.workstation ||
      s.phone ||
      s.settingsOpen ||
      s.paused ||
      s.help ||
      s.managementOpen;
    let h = 0;
    let v = 0;
    if (!locked) {
      h = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
      v = (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0);
    }
    const dx = (h + v) / Math.SQRT2;
    const dz = (-h + v) / Math.SQRT2;
    const norm = Math.hypot(dx, dz);
    m.walking = norm > 0;
    if (m.walking) {
      footstep.current += dt;
      if (footstep.current > 0.36) {
        audio.play("footstep");
        footstep.current = 0;
      }
    } else footstep.current = 0.2;
    if (norm > 0) {
      const speed = tray ? 2.2 : 2.8;
      const x = m.x + (dx / norm) * dt * speed;
      const z = m.z + (dz / norm) * dt * speed;
      if (isWalkable(x, m.z)) m.x = x;
      if (isWalkable(m.x, z)) m.z = z;
      m.angle = Math.atan2(dx, dz);
    }
    timer.current += dt;
    if (timer.current > 0.13) {
      timer.current = 0;
      const candidates: { focus: Focus; score: number }[] = [];
      const consider = (candidate: Focus, x: number, z: number) => {
        const dx = x - m.x;
        const dz = z - m.z;
        const distance = Math.hypot(dx, dz);
        const facing =
          distance > 0
            ? (Math.sin(m.angle) * dx + Math.cos(m.angle) * dz) / distance
            : 1;
        const score = distance + (1 - facing) * 0.15;
        if (score < 2.25 && facing > -0.65)
          candidates.push({ focus: candidate, score });
      };
      if (!locked) {
        consider(
          {
            kind: "machine",
            label: tray ? "Serve your drink first" : "Use espresso machine",
            position: [MACHINE[0], 2.2, MACHINE[2]],
          },
          MACHINE[0],
          -2.55,
        );
        s.visitors.forEach((v) => {
          if (["entering", "queueing", "leaving"].includes(v.phase)) return;
          const pos = visitorMotions.get(v.uid);
          if (!pos) return;
          const def = customerById(v.id);
          const label = !v.accepted
            ? `${def.name} · The usual?`
            : v.phase === "waiting" && tray
              ? `Serve ${def.name}`
              : v.paid
                ? `Say hello to ${def.name}`
                : `${def.name} · ${recipeById(v.recipe).name}`;
          consider(
            {
              kind: "customer",
              uid: v.uid,
              label,
              position: [pos.x, 2.07, pos.z],
            },
            pos.x,
            pos.z,
          );
        });
        if (s.purchased.includes("sofa"))
          consider(
            {
              kind: "cat",
              label: "Say hello to Milo",
              position: [-2.15, 1.5, 3.65],
            },
            -2.15,
            3.65,
          );
      }
      const focus =
        candidates.sort((a, b) => a.score - b.score)[0]?.focus ?? null;
      const old = useFocus.getState().focus;
      if (
        old?.label !== focus?.label ||
        old?.uid !== focus?.uid ||
        old?.kind !== focus?.kind
      )
        useFocus.getState().setFocus(focus);
    }
  });
  return <Person motion={playerMotion} player carrying={!!tray} />;
}
function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(-1, 0.6, 0));
  const targetPosition = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useGame.getState();
    if (s.workstation) {
      targetPosition.current.set(0.55, 4.1, 0.7);
      targetLook.current.set(-1.03, 1.84, -3.1);
    } else {
      const title = s.phase === "title";
      const x = title ? -2.1 : playerMotion.x * 0.12;
      const z = title ? 0 : playerMotion.z * 0.11;
      targetLook.current.set(x, 0.45, z);
      targetPosition.current.set(x + 12, 11.5, z + 15.5);
    }
    const speed = s.workstation ? 3.3 : 2.2 + (1 - s.settings.smoothing) * 4;
    camera.position.lerp(targetPosition.current, 1 - Math.exp(-dt * speed));
    look.current.lerp(targetLook.current, 1 - Math.exp(-dt * speed));
    camera.lookAt(look.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = s.workstation ? 39 : 38;
      camera.fov = THREE.MathUtils.damp(camera.fov, fov, 3, dt);
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
function WorldPrompt() {
  const focus = useFocus((s) => s.focus);
  if (!focus) return null;
  return (
    <Html
      position={focus.position}
      center
      zIndexRange={[10, 0]}
      distanceFactor={undefined}
    >
      <button className="world-prompt" onClick={interact}>
        <kbd>E</kbd>
        <span>{focus.label}</span>
      </button>
    </Html>
  );
}
function PaymentMoments() {
  const visitors = useGame((s) => s.visitors);
  const received = visitors.filter((v) => v.phase === "receiving");
  return (
    <>
      {received.map((v) => {
        const position = visitorMotions.get(v.uid);
        if (!position) return null;
        return (
          <Html
            key={v.uid}
            position={[position.x, 2.3, position.z]}
            center
            zIndexRange={[9, 0]}
          >
            <div className="floating-payment">
              Thank you, {customerById(v.id).name}.
              <span>
                <IconlessHeart /> +$
                {(v.payment ?? recipeById(v.recipe).price).toFixed(2)}
              </span>
            </div>
          </Html>
        );
      })}
    </>
  );
}
function IconlessHeart() {
  return <span aria-hidden="true">♡</span>;
}
function World() {
  const visitors = useGame((s) => s.visitors);
  const mochi = useGame((s) => s.purchased.includes("mochi"));
  const workstation = useGame((s) => s.workstation);
  useEffect(() => {
    const live = new Set(visitors.map((v) => v.uid));
    for (const uid of visitorMotions.keys())
      if (!live.has(uid)) visitorMotions.delete(uid);
  }, [visitors]);
  return (
    <>
      <AdaptiveResolution />
      <CameraRig />
      <Atmosphere />
      <Environment />
      <CoffeeMachine />
      <BarTools />
      <DirtyTables />
      <group visible={!workstation}>
        <Player />
      </group>
      {visitors.map((v) => (
        <VisitorActor key={v.uid} visitor={v} />
      ))}
      <Milo />
      {mochi && <Mochi />}
      <WorldPrompt />
      <PaymentMoments />
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
      camera={{ position: [10, 11.5, 15.5], fov: 38, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#203139");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <fog attach="fog" args={["#203139", 29, 65]} />
      <World />
    </Canvas>
  );
}
export function GameClock() {
  useEffect(() => {
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      useGame.getState().tick(Math.min(0.3, (now - last) / 1000));
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
