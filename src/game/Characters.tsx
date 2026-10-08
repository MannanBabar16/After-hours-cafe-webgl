import { memo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Box, Ball, Cylinder, Cup, GroundShadow, Cone } from "./primitives";
import { seats, DOOR, customerById } from "../data/content";
import type { Visitor } from "../store/game";
import { useGame } from "../store/game";
import { audio } from "./audio";

export interface ActorMotion {
  x: number;
  z: number;
  angle: number;
  walking: boolean;
}
export const playerMotion: ActorMotion = {
  x: -0.8,
  z: -1.45,
  angle: Math.PI,
  walking: false,
};
export const visitorMotions = new Map<number, ActorMotion>();
export function Person({
  motion,
  color = "#dfc3a3",
  hair = "#372b24",
  player = false,
  seated = false,
  activity = "window",
  carrying = false,
}: {
  motion: ActorMotion;
  color?: string;
  hair?: string;
  player?: boolean;
  seated?: boolean;
  activity?: string;
  carrying?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const tray = useGame((s) => (player ? s.tray : null));
  const apron = useGame((s) => (player ? s.business.apron : "#415d47"));
  const cupColor = useGame((s) => s.business.cup);
  const trayGroup = useRef<THREE.Group>(null);
  const wasCarrying = useRef(carrying);
  const serveAnimation = useRef(0);
  const trayRecipe = useRef(tray?.recipe);
  if (tray) trayRecipe.current = tray.recipe;
  useEffect(() => {
    group.current?.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    });
  }, []);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const sitting = seated && !motion.walking;
    if (group.current) {
      group.current.position.set(motion.x, sitting ? 0.3 : 0, motion.z);
      const diff =
        THREE.MathUtils.euclideanModulo(
          motion.angle - group.current.rotation.y + Math.PI,
          Math.PI * 2,
        ) - Math.PI;
      group.current.rotation.y += diff * Math.min(1, dt * 10);
    }
    if (body.current)
      body.current.position.y = motion.walking
        ? Math.abs(Math.sin(t * 9)) * 0.045
        : Math.sin(t * 1.6 + motion.x) * 0.012;
    const swing = motion.walking
      ? Math.sin(t * 9) * 0.44
      : Math.sin(t * 1.4) * 0.02;
    if (wasCarrying.current && !carrying) serveAnimation.current = 0.65;
    wasCarrying.current = carrying;
    serveAnimation.current = Math.max(0, serveAnimation.current - dt);
    const lowering = serveAnimation.current > 0;
    if (trayGroup.current) {
      trayGroup.current.visible = carrying || lowering;
      trayGroup.current.position.y =
        0.1 - (lowering ? (1 - serveAnimation.current / 0.65) * 0.19 : 0);
      trayGroup.current.scale.setScalar(
        lowering ? Math.max(0.3, serveAnimation.current / 0.65) : 1,
      );
    }
    if (leftLeg.current)
      leftLeg.current.rotation.x = sitting ? -Math.PI / 2 : swing;
    if (rightLeg.current)
      rightLeg.current.rotation.x = sitting ? -Math.PI / 2 : -swing;
    if (leftArm.current)
      leftArm.current.rotation.x =
        carrying || lowering
          ? -1.05
          : sitting && activity !== "window"
            ? -0.9
            : -swing * 0.7;
    if (rightArm.current)
      rightArm.current.rotation.x =
        carrying || lowering
          ? -1.05
          : sitting && activity !== "window"
            ? -0.95
            : swing * 0.7;
  });
  return (
    <group ref={group}>
      <GroundShadow position={[0, 0.009, 0]} size={0.95} />
      <group ref={body}>
        <group position={[0, 0.55, 0]}>
          <Box
            position={[0, 0.34, 0]}
            scale={[0.48, 0.6, 0.31]}
            color={color}
          />
          {player && (
            <>
              <Box
                position={[0, 0.32, 0.167]}
                scale={[0.35, 0.55, 0.022]}
                color={apron}
              />
              <Box
                position={[0, 0.28, 0.184]}
                scale={[0.19, 0.12, 0.018]}
                color="#6d7e58"
              />
              <Box
                position={[-0.12, 0.61, 0.16]}
                scale={[0.05, 0.26, 0.022]}
                color={apron}
              />
              <Box
                position={[0.12, 0.61, 0.16]}
                scale={[0.05, 0.26, 0.022]}
                color={apron}
              />
            </>
          )}
          <Ball
            position={[0, 0.96, 0]}
            scale={[0.245, 0.27, 0.225]}
            color="#deb997"
          />
          <Ball
            position={[0, 1.085, -0.025]}
            scale={[0.253, 0.18, 0.233]}
            color={hair}
          />
          <Box
            position={[0.05, 1.15, 0.08]}
            rotation={[0, 0, -0.15]}
            scale={[0.38, 0.08, 0.23]}
            color={hair}
          />
          {[-0.074, 0.074].map((x) => (
            <Ball
              key={x}
              position={[x, 0.985, 0.219]}
              scale={[0.016, 0.023, 0.01]}
              color="#34332b"
            />
          ))}
          <Ball
            position={[0, 0.926, 0.23]}
            scale={[0.023, 0.014, 0.014]}
            color="#c78f79"
          />
          <group ref={leftArm} position={[-0.31, 0.58, 0]}>
            <Cylinder
              position={[0, -0.22, 0]}
              scale={[0.072, 0.43, 0.072]}
              color={color}
            />
            <Ball position={[0, -0.44, 0]} scale={0.082} color="#deb997" />
          </group>
          <group ref={rightArm} position={[0.31, 0.58, 0]}>
            <Cylinder
              position={[0, -0.22, 0]}
              scale={[0.072, 0.43, 0.072]}
              color={color}
            />
            <Ball position={[0, -0.44, 0]} scale={0.082} color="#deb997" />
          </group>
          {[-0.13, 0.13].map((x, i) => (
            <group
              ref={i === 0 ? leftLeg : rightLeg}
              key={x}
              position={[x, 0.04, 0]}
            >
              <Box
                position={[0, -0.23, 0]}
                scale={[0.16, 0.46, 0.19]}
                color={player ? "#554d3e" : "#45494a"}
              />
              <Box
                position={[0, -0.47, 0.06]}
                scale={[0.18, 0.11, 0.29]}
                color="#38372e"
              />
            </group>
          ))}
          {player && (
            <group ref={trayGroup} position={[0, 0.1, 0.5]} visible={carrying}>
              <Cylinder scale={[0.39, 0.036, 0.28]} color="#ae8359" />
              <Cup
                position={[0, 0.024, 0]}
                color={cupColor}
                art={tray?.art}
                fill={1}
                coffee={
                  trayRecipe.current === "espresso" ? "#b9864f" : "#d9b983"
                }
                foam={trayRecipe.current !== "espresso"}
                scale={0.78}
              />
            </group>
          )}
          {!player && seated && activity === "phone" && (
            <Box
              position={[0.06, 0.27, 0.37]}
              rotation={[-0.5, 0, 0]}
              scale={[0.14, 0.23, 0.023]}
              color="#bcc9be"
            />
          )}
          {!player && seated && activity === "book" && (
            <Box
              position={[0, 0.14, 0.37]}
              rotation={[-0.25, 0, 0]}
              scale={[0.38, 0.028, 0.28]}
              color="#e2d8bb"
            />
          )}
        </group>
      </group>
    </group>
  );
}
export function VisitorActor({ visitor }: { visitor: Visitor }) {
  const cupColor = useGame((s) => s.business.cup);
  const def = customerById(visitor.id);
  const seated = ["waiting", "receiving", "sitting", "activity"].includes(
    visitor.phase,
  );
  const table = seats[visitor.seat] ?? seats[0];
  const motion = useRef<ActorMotion>(
    visitorMotions.get(visitor.uid) ?? {
      x: seated ? table[0] : DOOR[0],
      z: seated ? table[1] + 0.97 : DOOR[1],
      angle: Math.PI,
      walking: !seated,
    },
  );
  visitorMotions.set(visitor.uid, motion.current);
  const waypoints = useRef<[number, number][]>([]);
  const waypoint = useRef(0);
  useEffect(() => {
    let path: [number, number][] = [];
    const z = table[1] + 0.97;
    if (visitor.phase === "entering")
      path = [
        [1.7, 4.43],
        [1.7, -1.4],
      ];
    else if (visitor.phase === "queueing") path = [[1.7, -1.4]];
    else if (visitor.phase === "ordering")
      path =
        table[0] > 2
          ? [
              [1.7, z],
              [table[0], z],
            ]
          : table[0] < -2
            ? [
                [1.7, -0.35],
                [-2.1, -0.35],
                [-2.1, z],
                [table[0], z],
              ]
            : [
                [1.7, 4.43],
                [table[0], 4.43],
                [table[0], z],
              ];
    else if (visitor.phase === "leaving")
      path =
        table[0] > 2
          ? [[1.7, z], [1.7, 4.43], DOOR]
          : table[0] < -2
            ? [[-2.1, z], [-2.1, -0.35], [1.7, -0.35], [1.7, 4.43], DOOR]
            : [[table[0], 4.43], [1.7, 4.43], DOOR];
    else return; // Preserve the approach until the guest has reached their seat.
    waypoints.current = path;
    waypoint.current = 0;
  }, [visitor.phase, visitor.seat, table]);
  useFrame((_, dt) => {
    const m = motion.current;
    if (
      useGame.getState().paused ||
      useGame.getState().settingsOpen ||
      useGame.getState().help ||
      useGame.getState().managementOpen ||
      useGame.getState().brew.practice
    ) {
      m.walking = false;
      return;
    }
    const target = waypoints.current[waypoint.current];
    if (!target) {
      m.walking = false;
      m.angle = Math.PI;
      return;
    }
    const tx = target[0];
    const tz = target[1];
    const dx = tx - m.x;
    const dz = tz - m.z;
    const distance = Math.hypot(dx, dz);
    m.walking = distance > 0.065;
    if (m.walking) {
      const step = Math.min(
        distance,
        dt * (visitor.phase === "leaving" ? 1.8 : 1.45),
      );
      m.x += (dx / distance) * step;
      m.z += (dz / distance) * step;
      m.angle = Math.atan2(dx, dz);
    } else {
      waypoint.current++;
      m.angle = Math.PI;
    }
  });
  return (
    <>
      <Person
        motion={motion.current}
        color={def.palette}
        hair={def.hair}
        seated={seated}
        activity={def.activity}
      />
      {visitor.paid && (
        <Cup
          position={[table[0] - 0.21, 0.925, table[1] + 0.13]}
          fill={1}
          color={cupColor}
          art={visitor.art}
          coffee={visitor.recipe === "espresso" ? "#ba8953" : "#dcc093"}
          foam={!["espresso", "americano"].includes(visitor.recipe)}
          scale={0.75}
        />
      )}
      {visitor.paid && visitor.pastry && (
        <group position={[table[0] + 0.25, 0.95, table[1] + 0.12]}>
          <Cylinder scale={[0.19, 0.015, 0.14]} color="#ece0c5" />
          {[-1, 0, 1].map((i) => (
            <Ball
              key={i}
              position={[i * 0.065, 0.045, Math.abs(i) * 0.035]}
              scale={[0.07, 0.045, 0.045]}
              color={i === 0 ? "#c89b55" : "#d6aa68"}
            />
          ))}
        </group>
      )}
      {seated && def.activity === "laptop" && (
        <group position={[table[0], 0.945, table[1] + 0.26]}>
          <Box scale={[0.56, 0.024, 0.33]} color="#6d7c79" />
          <Box
            position={[0, 0.18, -0.12]}
            rotation={[-0.15, 0, 0]}
            scale={[0.56, 0.35, 0.022]}
            color="#506864"
          />
          <Box
            position={[0, 0.18, -0.103]}
            rotation={[-0.15, 0, 0]}
            scale={[0.49, 0.29, 0.008]}
            color="#afc3aa"
          />
        </group>
      )}
    </>
  );
}
export const Milo = memo(function Milo() {
  const purchased = useGame((s) => s.purchased);
  const cat = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  useEffect(() => {
    cat.current?.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    });
  }, []);
  useFrame(({ clock }, dt) => {
    if (!cat.current) return;
    const t = clock.elapsedTime;
    const resting = purchased.includes("sofa");
    const segment = Math.floor(t / 40) % 3;
    const spot = resting
      ? [-2.15, 0.7, 3.65]
      : segment === 0
        ? [5.25, 0, 1.5]
        : segment === 1
          ? [4.9, 0, -3.65]
          : [1.5, 0, 3.8];
    cat.current.position.x = THREE.MathUtils.damp(
      cat.current.position.x,
      spot[0],
      1.5,
      dt,
    );
    cat.current.position.z = THREE.MathUtils.damp(
      cat.current.position.z,
      spot[2],
      1.5,
      dt,
    );
    cat.current.position.y = spot[1] + 0.12 + Math.sin(t * 1.6) * 0.008;
    cat.current.scale.y =
      1 + (t % 22 > 20 ? Math.sin(((t % 22) - 20) * Math.PI) * 0.22 : 0);
    if (tail.current) tail.current.rotation.y = Math.sin(t * 1.5) * 0.18;
  });
  return (
    <group ref={cat} position={[5.25, 0.12, 1.5]} rotation={[0, -0.6, 0]}>
      <Ball scale={[0.19, 0.18, 0.34]} color="#bc9168" />
      <Ball
        position={[0, 0.18, 0.24]}
        scale={[0.2, 0.18, 0.17]}
        color="#ca9c71"
      />
      {[-0.11, 0.11].map((x) => (
        <group key={x}>
          <Cone
            position={[x, 0.38, 0.24]}
            rotation={[0, 0, -x]}
            scale={[0.075, 0.14, 0.075]}
            color="#c99a70"
          />
          <Cone
            position={[x, 0.38, 0.26]}
            scale={[0.036, 0.065, 0.038]}
            color="#d8b3a0"
          />
          <Box
            position={[x, 0.23, 0.395]}
            rotation={[0, 0, x > 0 ? 0.1 : -0.1]}
            scale={[0.052, 0.014, 0.015]}
            color="#4d4035"
          />
          <Ball
            position={[x, 0.055, 0.2]}
            scale={[0.07, 0.08, 0.12]}
            color="#d2ad83"
          />
        </group>
      ))}
      <Ball
        position={[0, 0.17, 0.408]}
        scale={[0.025, 0.018, 0.018]}
        color="#c47e75"
      />
      <group ref={tail} position={[0.05, 0, -0.27]}>
        <Cylinder
          position={[0.09, 0.04, -0.16]}
          rotation={[Math.PI / 2, 0, -0.4]}
          scale={[0.045, 0.37, 0.045]}
          color="#ba8860"
        />
      </group>
    </group>
  );
});
const dirtSpots: [[number, number], [number, number], [number, number]] = [
  [-1, 1],
  [1, 2.3],
  [1.6, -0.5],
];
function Dirt() {
  const dirt = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (dirt.current) {
      const n = Math.floor(clock.elapsedTime / 17) % 3;
      dirt.current.position.set(dirtSpots[n][0], 0.064, dirtSpots[n][1]);
      dirt.current.scale.setScalar(
        clock.elapsedTime % 17 > 13
          ? Math.max(0, (17 - (clock.elapsedTime % 17)) / 4)
          : 1,
      );
    }
  });
  return (
    <group ref={dirt}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ball
          key={i}
          position={[Math.cos(i) * 0.17, 0, Math.sin(i) * 0.14]}
          scale={[0.044, 0.004, 0.027]}
          color="#6b503c"
          shadow={false}
        />
      ))}
    </group>
  );
}
export const Mochi = memo(function Mochi() {
  const group = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const sparkle = useRef<THREE.Group>(null);
  const lastTone = useRef(-1);
  useEffect(() => {
    group.current?.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    });
  }, []);
  useFrame(({ clock }, dt) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    const period = Math.floor(t / 17);
    const cleaning = t % 17 > 13;
    const stuck = t % 53 > 49;
    const spot = stuck ? [-2.69, 1.1] : dirtSpots[period % 3];
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      spot[0],
      stuck ? 1.5 : 0.45,
      dt,
    );
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      spot[1],
      stuck ? 1.5 : 0.45,
      dt,
    );
    group.current.rotation.y = stuck
      ? Math.sin(t * 18) * 0.18
      : Math.atan2(
          spot[0] - group.current.position.x,
          spot[1] - group.current.position.z,
        );
    if (eyes.current) eyes.current.scale.y = t % 7 > 6.8 ? 0.16 : 1;
    if (sparkle.current) {
      sparkle.current.visible = cleaning;
      sparkle.current.rotation.y = t;
    }
    if ((cleaning || stuck) && lastTone.current !== period) {
      lastTone.current = period;
      audio.play("robot");
    }
  });
  return (
    <>
      <group ref={group} position={[0, 0.16, 1]}>
        <Cylinder scale={[0.3, 0.24, 0.3]} color="#e4decb" rough={0.38} />
        <Cylinder
          position={[0, 0.13, 0]}
          scale={[0.28, 0.024, 0.28]}
          color="#b9c7b0"
        />
        <Box
          position={[0, 0.03, 0.276]}
          scale={[0.28, 0.1, 0.021]}
          color="#344f49"
        />
        <group ref={eyes} position={[0, 0.04, 0.291]}>
          {[-0.075, 0.075].map((x) => (
            <Box
              key={x}
              position={[x, 0, 0]}
              scale={[0.034, 0.035, 0.012]}
              color="#beecb9"
            />
          ))}
        </group>
        <Ball position={[0, 0.15, 0.04]} scale={0.025} color="#a9ba91" />
        <GroundShadow position={[0, -0.14, 0]} size={0.9} />
        <group ref={sparkle}>
          {Array.from({ length: 5 }, (_, i) => (
            <Ball
              key={i}
              position={[Math.cos(i) * 0.34, -0.04, Math.sin(i) * 0.34]}
              scale={0.022}
              color="#d6c597"
            />
          ))}
        </group>
      </group>
      <Dirt />
    </>
  );
});
