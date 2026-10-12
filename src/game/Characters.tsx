import { PaperCup } from "./OperationsProps";
import { SoftBox, Ring, Rod } from "./art";
import { layout, counterSpot, seatSpot, guestPath } from "../data/layout";
import { memo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Ball, Cylinder, Cup, GroundShadow, Cone } from "./primitives";
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
  x: layout.spawn.x,
  z: layout.spawn.z,
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
  hasDrink = false,
}: {
  motion: ActorMotion;
  color?: string;
  hair?: string;
  player?: boolean;
  seated?: boolean;
  activity?: string;
  carrying?: boolean;
  hasDrink?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const calves = useRef<(THREE.Group | null)[]>([]),
    calfMeshes = useRef<(THREE.Mesh | null)[]>([]),
    feet = useRef<(THREE.Mesh | null)[]>([]);
  const carried = useGame((s) => (player ? s.carry : null));
  const tray =
    carried?.kind === "product" && carried.item.product !== "cookie"
      ? { recipe: carried.item.product, art: "heart" as const }
      : null;
  const apron = useGame((s) => (player ? s.business.apron : "#415d47"));
  const cupColor = useGame((s) => s.business.cup);
  const trayGroup = useRef<THREE.Group>(null);
  const blink = useRef<THREE.Group>(null);
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
    if (blink.current) blink.current.scale.y = t % 5.3 > 5.16 ? 0.15 : 1;
    const sitting = seated && !motion.walking;
    const sipping =
      sitting &&
      hasDrink &&
      activity === "window" &&
      (t + motion.x * 2) % 10 > 7;
    if (group.current) {
      group.current.position.set(motion.x, sitting ? -0.1 : 0, motion.z);
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
      trayGroup.current.visible = false;
      trayGroup.current.position.y =
        0.1 - (lowering ? (1 - serveAnimation.current / 0.65) * 0.19 : 0);
      trayGroup.current.scale.setScalar(
        lowering ? Math.max(0.3, serveAnimation.current / 0.65) : 1,
      );
    }
    if (leftLeg.current)
      leftLeg.current.rotation.x = THREE.MathUtils.damp(
        leftLeg.current.rotation.x,
        sitting ? -Math.PI / 2 : swing,
        12,
        dt,
      );
    if (rightLeg.current)
      rightLeg.current.rotation.x = sitting ? -Math.PI / 2 : -swing;
    for (let i = 0; i < 2; i++) {
      if (calves.current[i])
        calves.current[i]!.rotation.x = sitting ? Math.PI / 2 : 0;
      if (calfMeshes.current[i]) {
        calfMeshes.current[i]!.scale.y = sitting ? 1.4 : 1;
        calfMeshes.current[i]!.position.y = sitting ? -0.2 : -0.14;
      }
      if (feet.current[i])
        feet.current[i]!.position.y = sitting ? -0.42 : -0.29;
    }

    if (leftArm.current)
      leftArm.current.rotation.x =
        carrying || lowering
          ? -1.05
          : sitting && activity !== "window"
            ? -0.9
            : -swing * 0.7;
    if (rightArm.current)
      rightArm.current.rotation.x = sipping
        ? -1.75
        : carrying || lowering
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
          <SoftBox
            position={[0, 0.34, 0]}
            size={[0.48, 0.6, 0.31]}
            color={color}
          />
          {player && (
            <>
              <Rod
                from={[-0.12, 0.61, -0.17]}
                to={[0.17, 0.23, -0.17]}
                r={0.019}
                color={apron}
              />
              <Rod
                from={[0.12, 0.61, -0.17]}
                to={[-0.17, 0.23, -0.17]}
                r={0.019}
                color={apron}
              />
              <SoftBox
                position={[0, 0.22, -0.166]}
                size={[0.44, 0.06, 0.018]}
                radius={0.005}
                color={apron}
              />
              <SoftBox
                position={[0, 0.32, 0.167]}
                size={[0.35, 0.55, 0.022]}
                color={apron}
              />
              <SoftBox
                position={[0, 0.28, 0.184]}
                size={[0.19, 0.12, 0.018]}
                color="#6d7e58"
              />
              <SoftBox
                position={[-0.12, 0.61, 0.16]}
                size={[0.05, 0.26, 0.022]}
                color={apron}
              />
              <SoftBox
                position={[0.12, 0.61, 0.16]}
                size={[0.05, 0.26, 0.022]}
                color={apron}
              />
            </>
          )}
          <Ball
            position={[0, 0.96, 0]}
            scale={[0.28, 0.3, 0.255]}
            color="#deb997"
          />
          <Ball
            position={[0, 1.085, -0.025]}
            scale={[0.288, 0.2, 0.263]}
            color={hair}
          />
          {[
            [-0.13, 1.17, 0.16],
            [0.04, 1.19, 0.18],
            [0.16, 1.12, 0.12],
          ].map(([x, y, z]) => (
            <Ball
              key={x}
              position={[x, y, z]}
              rotation={[0, 0, -0.25]}
              scale={[0.14, 0.085, 0.11]}
              color={hair}
            />
          ))}
          {player && (
            <Ball
              position={[0, 1.26, -0.18]}
              scale={[0.14, 0.14, 0.12]}
              color={hair}
            />
          )}
          <group ref={blink}>
            {[-0.088, 0.088].map((x) => (
              <Ball
                key={x}
                position={[x, 0.985, 0.251]}
                scale={[0.017, 0.026, 0.012]}
                color="#34332b"
              />
            ))}
          </group>
          {[-0.16, 0.16].map((x) => (
            <Ball
              key={x}
              position={[x, 0.931, 0.241]}
              scale={[0.039, 0.018, 0.008]}
              color="#daa78c"
            />
          ))}
          <Ring
            r={0.031}
            t={0.007}
            position={[0, 0.932, 0.255]}
            scale={[1, 0.5, 1]}
            rotation={[0, 0, Math.PI]}
            color="#9a6e57"
          />
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
              <SoftBox
                position={[0, -0.12, 0]}
                size={[0.16, 0.24, 0.19]}
                color={player ? "#554d3e" : "#45494a"}
              />
              <group
                ref={(g) => {
                  calves.current[i] = g;
                }}
                position={[0, -0.24, 0]}
              >
                <SoftBox
                  ref={(m) => {
                    calfMeshes.current[i] = m;
                  }}
                  position={[0, -0.14, 0]}
                  size={[0.15, 0.28, 0.18]}
                  radius={0.045}
                  color={player ? "#554d3e" : "#45494a"}
                />
                <SoftBox
                  ref={(m) => {
                    feet.current[i] = m;
                  }}
                  position={[0, -0.29, 0.05]}
                  size={[0.19, 0.11, 0.27]}
                  radius={0.045}
                  color="#564d3d"
                />
              </group>
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
            <SoftBox
              position={[0.06, 0.27, 0.37]}
              rotation={[-0.5, 0, 0]}
              size={[0.14, 0.23, 0.023]}
              color="#bcc9be"
            />
          )}
          {!player && seated && activity === "book" && (
            <SoftBox
              position={[0, 0.14, 0.37]}
              rotation={[-0.25, 0, 0]}
              size={[0.38, 0.028, 0.28]}
              color="#e2d8bb"
            />
          )}
        </group>
      </group>
    </group>
  );
}
export function VisitorActor({ visitor }: { visitor: Visitor }) {
  const def = customerById(visitor.id);
  const seated = [
    "waiting",
    "receiving",
    "findingSeat",
    "sitting",
    "activity",
  ].includes(visitor.phase);
  const table = seats[visitor.seat] ?? seats[0];
  const queueIndex = useGame((s) =>
    s.visitors
      .filter((v) => !v.accepted && !v.paid)
      .findIndex((v) => v.uid === visitor.uid),
  );
  const seat = seatSpot(visitor.seat),
    counter = counterSpot(Math.max(0, queueIndex));
  const motion = useRef<ActorMotion>(
    visitorMotions.get(visitor.uid) ?? {
      x: seated ? seat[0] : visitor.phase === "entering" ? DOOR[0] : counter[0],
      z: seated ? seat[1] : visitor.phase === "entering" ? DOOR[1] : counter[1],
      angle: Math.PI,
      walking: !seated,
    },
  );
  visitorMotions.set(visitor.uid, motion.current);
  const waypoints = useRef<[number, number][]>([]);
  const waypoint = useRef(0);
  const drinkingCup = useRef<THREE.Group>(null),
    cupTarget = useRef(new THREE.Vector3());
  useEffect(() => {
    let path: [number, number][] = [];
    if (visitor.phase === "entering")
      path = [[-4.85, 4.22], [-0.65, 4.22], counter];
    else if (visitor.phase === "queueing" || visitor.phase === "ordering")
      path = [counter];
    else if (visitor.phase === "waiting" || visitor.phase === "findingSeat")
      path = guestPath(true, visitor.seat);
    else if (visitor.phase === "leaving") path = guestPath(false, visitor.seat);
    else return; // Preserve the approach until the guest has reached their seat.
    waypoints.current = path;
    waypoint.current = 0;
  }, [visitor.phase, visitor.seat, queueIndex]);
  useFrame(({ clock }, dt) => {
    const m = motion.current;
    if (
      useGame.getState().paused ||
      useGame.getState().settingsOpen ||
      useGame.getState().help ||
      useGame.getState().managementOpen ||
      useGame.getState().phase === "title"
    ) {
      m.walking = false;
      return;
    }
    if (drinkingCup.current) {
      const sip =
        visitor.paid &&
        seated &&
        !m.walking &&
        def.activity === "window" &&
        (clock.elapsedTime + m.x * 2) % 10 > 7;
      cupTarget.current.set(
        sip
          ? m.x + Math.sin(m.angle) * 0.24 + Math.cos(m.angle) * 0.15
          : table[0] - 0.21,
        sip ? 1.14 : 0.884,
        sip
          ? m.z + Math.cos(m.angle) * 0.24 - Math.sin(m.angle) * 0.15
          : table[1] + (visitor.seat % 2 ? -0.18 : 0.18),
      );
      drinkingCup.current.position.lerp(
        cupTarget.current,
        1 - Math.exp(-dt * 6),
      );
      drinkingCup.current.rotation.x = THREE.MathUtils.damp(
        drinkingCup.current.rotation.x,
        sip ? 0.2 : 0,
        6,
        dt,
      );
    }
    const target = waypoints.current[waypoint.current];
    if (!target) {
      m.walking = false;
      m.angle =
        visitor.phase === "ordering" || visitor.phase === "queueing"
          ? Math.PI / 2
          : visitor.seat % 2 === 0
            ? Math.PI
            : 0;
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
        hasDrink={visitor.paid}
      />
      {visitor.paid && seated && (
        <group
          ref={drinkingCup}
          position={[
            table[0] - 0.21,
            0.884,
            table[1] + (visitor.seat % 2 ? -0.18 : 0.18),
          ]}
        >
          <PaperCup fill={1} product={visitor.recipe} scale={0.72} />
        </group>
      )}
      {visitor.paid && visitor.pastry && (
        <group position={[table[0] + 0.25, 0.887, table[1] + 0.12]}>
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
        <group position={[table[0], 0.89, table[1] + 0.26]}>
          <SoftBox size={[0.56, 0.024, 0.33]} color="#6d7c79" />
          <SoftBox
            position={[0, 0.18, -0.12]}
            rotation={[-0.15, 0, 0]}
            size={[0.56, 0.35, 0.022]}
            color="#506864"
          />
          <SoftBox
            position={[0, 0.18, -0.103]}
            rotation={[-0.15, 0, 0]}
            size={[0.49, 0.29, 0.008]}
            color="#afc3aa"
          />
        </group>
      )}
    </>
  );
}
export const miloMotion = { x: layout.cat[0], y: 0.12, z: layout.cat[2] };
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
      ? [-4.77, 0.59, 1.65]
      : segment === 0
        ? [-4.7, 0, 1.65]
        : segment === 1
          ? [-2.5, 0, -2.7]
          : [-4.8, 0, 3.7];
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
    Object.assign(miloMotion, {
      x: cat.current.position.x,
      y: cat.current.position.y,
      z: cat.current.position.z,
    });
    cat.current.scale.y =
      1 + (t % 22 > 20 ? Math.sin(((t % 22) - 20) * Math.PI) * 0.22 : 0);
    if (tail.current) tail.current.rotation.y = Math.sin(t * 1.5) * 0.18;
  });
  return (
    <group ref={cat} position={[-4.7, 0.12, 1.65]} rotation={[0, -0.6, 0]}>
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
          <SoftBox
            position={[x, 0.23, 0.395]}
            rotation={[0, 0, x > 0 ? 0.1 : -0.1]}
            size={[0.052, 0.014, 0.015]}
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
    const ops = useGame.getState().ops;
    const spill = ops.spills[0];
    const period = spill?.id ?? -1;
    const cleaning = !!spill && ops.cleaningTimer > 9;
    const spot = spill ? [spill.x, spill.z] : [4.8, 3.45];
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      spot[0],
      1.2,
      dt,
    );
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      spot[1],
      1.2,
      dt,
    );
    group.current.rotation.y = Math.atan2(
      spot[0] - group.current.position.x,
      spot[1] - group.current.position.z,
    );
    if (eyes.current) eyes.current.scale.y = t % 7 > 6.8 ? 0.16 : 1;
    if (sparkle.current) {
      sparkle.current.visible = cleaning;
      sparkle.current.rotation.y = t;
    }
    if (cleaning && lastTone.current !== period) {
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
        <SoftBox
          position={[0, 0.03, 0.276]}
          size={[0.28, 0.1, 0.021]}
          color="#344f49"
        />
        <group ref={eyes} position={[0, 0.04, 0.291]}>
          {[-0.075, 0.075].map((x) => (
            <SoftBox
              key={x}
              position={[x, 0, 0]}
              size={[0.034, 0.035, 0.012]}
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
    </>
  );
});
