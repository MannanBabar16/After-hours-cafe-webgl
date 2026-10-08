import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useGame } from "../store/game";
import { seats } from "../data/content";
import { Ball, Box, Cylinder, Cup, Label } from "./primitives";

export function BarTools() {
  const stage = useGame((s) => s.brew.stage);
  const ground = useGame((s) => s.brew.ground);
  const grind = useGame((s) => s.brew.grind);
  const tamper = useRef<Group>(null);
  const grindLight = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (tamper.current)
      tamper.current.position.y =
        stage === "tamping"
          ? 0.08 + (Math.sin(clock.elapsedTime * 3) + 1) * 0.09
          : 0.25;
    if (grindLight.current)
      grindLight.current.rotation.y =
        stage === "grinding" ? clock.elapsedTime * 12 : 0;
  });
  return (
    <group>
      <group position={[-3.12, 1.47, -3.22]}>
        <Box
          position={[0, 0.18, 0]}
          scale={[0.46, 0.37, 0.43]}
          color="#334d43"
          metal={0.25}
        />
        <Cylinder
          position={[0, 0.47, 0]}
          scale={[0.2, 0.23, 0.2]}
          color="#9d8e6a"
          rough={0.4}
        />
        <Cylinder
          position={[0, 0.59, 0]}
          scale={[0.215, 0.04, 0.215]}
          color="#344c40"
        />
        <Cylinder
          position={[0, 0.455, 0]}
          scale={[0.155, 0.19, 0.155]}
          color="#765332"
        />
        <Box
          position={[0, 0.23, 0.27]}
          scale={[0.13, 0.16, 0.2]}
          color="#babbaa"
          metal={0.5}
        />
        <Box
          position={[0, 0.015, 0.25]}
          scale={[0.49, 0.035, 0.48]}
          color="#829384"
        />
        <group ref={grindLight} position={[0.16, 0.24, 0.219]}>
          <Box
            scale={[0.07, 0.025, 0.025]}
            color={stage === "grinding" ? "#e1ba66" : "#829c78"}
          />
        </group>
        <Label
          position={[0, 0.14, 0.222]}
          size={[0.22, 0.09]}
          text={
            stage === "grinding" ? `${ground.toFixed(1)}g` : `GRIND ${grind}`
          }
          color="#d9c79c"
          background="#2a4138"
          font={60}
        />
        {stage === "grinding" && (
          <Cylinder
            position={[0, 0.105, 0.35]}
            scale={[0.006, 0.17, 0.006]}
            color="#68492d"
          />
        )}
        <Cylinder
          position={[0, 0.07, 0.35]}
          scale={[0.1, 0.06, 0.1]}
          color="#acb4a5"
          metal={0.6}
        />
        <Cylinder
          position={[0, 0.107, 0.35]}
          scale={[0.085, 0.01, 0.085]}
          color="#735336"
        />
      </group>
      <group position={[-2.5, 1.47, -2.96]}>
        <Box
          position={[0, 0.01, 0]}
          scale={[0.5, 0.025, 0.43]}
          color="#415849"
        />
        <Cylinder
          position={[0, 0.04, 0]}
          scale={[0.095, 0.045, 0.095]}
          color="#bac0af"
          metal={0.65}
        />
        <Cylinder
          position={[0, 0.068, 0]}
          scale={[0.08, 0.01, 0.08]}
          color={
            ["dosed", "distributed", "tamping", "locked"].includes(stage)
              ? "#705132"
              : "#36413c"
          }
        />
        <Box
          position={[0.15, 0.04, 0]}
          scale={[0.21, 0.05, 0.055]}
          color="#3c3d33"
        />
        <group
          ref={tamper}
          position={[0, 0.25, 0]}
          visible={["dosed", "distributed", "tamping", "locked"].includes(
            stage,
          )}
        >
          <Cylinder scale={[0.073, 0.025, 0.073]} color="#bbc2b0" metal={0.8} />
          <Cylinder
            position={[0, 0.046, 0]}
            scale={[0.036, 0.08, 0.036]}
            color="#87643d"
          />
          <Ball
            position={[0, 0.097, 0]}
            scale={[0.048, 0.025, 0.048]}
            color="#6c543d"
          />
        </group>
        <Label
          position={[0, 0.017, 0.29]}
          rotation={[-Math.PI / 2, 0, 0]}
          text="18g → 36g"
          size={[0.5, 0.15]}
          color="#decda6"
          background="#415849"
          font={60}
        />
      </group>
    </group>
  );
}
export function DirtyTables() {
  const dirty = useGame((s) => s.business.dirtySeats);
  const visitors = useGame((s) => s.visitors);
  return (
    <group>
      {dirty
        .filter((seat) => !visitors.some((v) => v.seat === seat && v.paid))
        .map((seat) => (
          <group key={seat} position={[seats[seat][0], 0.925, seats[seat][1]]}>
            <Cup position={[-0.2, 0, 0.13]} fill={0.15} scale={0.75} />
            {[0, 1, 2].map((i) => (
              <Ball
                key={i}
                position={[0.06 + i * 0.055, 0.02, 0.1 + (i % 2) * 0.045]}
                scale={[0.018, 0.006, 0.012]}
                color="#a88655"
              />
            ))}
          </group>
        ))}
    </group>
  );
}
