import { create } from "zustand";
import { useEffect } from "react";
import { useGame, prepareCookieTray } from "../store/game";
import type { StationId } from "../data/operations";
import { audio } from "./audio";
import { playerMotion } from "./Characters";
export const keys = new Set<string>();
export const view = {
  yaw: Math.PI,
  pitch: -0.07,
  locked: false,
  transitioning: false,
};
export type Focus = {
  kind: "station" | "box" | "customer" | "loose" | "spill";
  label: string;
  position: [number, number, number];
  id: number | StationId;
  distance: number;
};
export const useFocus = create<{
  focus: Focus | null;
  setFocus: (focus: Focus | null) => void;
}>((set) => ({ focus: null, setFocus: (focus) => set({ focus }) }));
export function releasePointer() {
  if (typeof document !== "undefined" && document.pointerLockElement)
    document.exitPointerLock();
}
export async function capturePointer() {
  const s = useGame.getState();
  if (
    s.cameraMode !== "first" ||
    s.phone ||
    s.paused ||
    s.workstation ||
    s.managementOpen ||
    s.settingsOpen ||
    s.help ||
    s.phase === "title" ||
    s.phase === "summary"
  )
    return;
  try {
    await document.querySelector("canvas")?.requestPointerLock();
  } catch {
    useGame
      .getState()
      .notify(
        "Click the café to look around",
        "Your browser asks for a click before locking the mouse.",
      );
  }
}
export function interact() {
  const s = useGame.getState();
  if (
    s.phone ||
    s.paused ||
    s.settingsOpen ||
    s.help ||
    s.managementOpen ||
    s.workstation
  )
    return;
  const f = useFocus.getState().focus;
  if (!f || f.distance > 1.8) return;
  if (f.kind === "box") s.takeBox(Number(f.id));
  if (f.kind === "loose") s.pickupLoose(Number(f.id));
  if (f.kind === "spill") s.cleanSpill(Number(f.id));
  if (f.kind === "customer") {
    const order = s.ops.orders.find((o) => o.id === f.id);
    if (order && !order.accepted) s.acceptOrder(order.id);
    else if (order) s.serve(order.id);
  }
  if (f.kind === "station") {
    if (f.id === "dough" && s.carry?.kind !== "box") prepareCookieTray();
    else s.interactStation(f.id as StationId);
  }
}
export function useControls() {
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches("input,textarea,select"))
        return;
      const key = event.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "e",
          "v",
          "f",
          "r",
          "g",
          "tab",
          "escape",
          "q",
          " ",
        ].includes(key)
      )
        event.preventDefault();
      keys.add(key);
      if (event.repeat) return;
      const s = useGame.getState();
      if (key === "e") interact();
      if (key === "v") {
        const nextFirst = s.cameraMode !== "first";
        s.toggleCamera();
        if (nextFirst) void capturePointer();
        else releasePointer();
      }
      if (key === "f") {
        releasePointer();
        s.togglePhone();
      }
      if (key === "r") {
        releasePointer();
        s.togglePhone("Café");
      }
      if (key === "tab") {
        releasePointer();
        s.togglePhone("Equipment");
      }
      if (key === "g" && !s.phone && !s.workstation && !s.paused) {
        useGame.setState({
          player: {
            x: playerMotion.x,
            z: playerMotion.z,
            angle: playerMotion.angle,
          },
        });
        s.drop();
      }
      if (key === "q" || key === "escape") {
        releasePointer();
        s.back();
      }
      if (key === "`" && import.meta.env.DEV) {
        releasePointer();
        useGame.setState({ debugOpen: !s.debugOpen });
      }
      audio.update(s.settings);
    };
    const up = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    const blur = () => {
      keys.clear();
    };
    const lock = () => {
      view.locked = !!document.pointerLockElement;
    };
    const mouse = (event: MouseEvent) => {
      if (!view.locked) return;
      view.yaw -= event.movementX * 0.0022;
      view.pitch = Math.max(
        -1.2,
        Math.min(0.85, view.pitch - event.movementY * 0.0022),
      );
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("pointerlockchange", lock);
    document.addEventListener("mousemove", mouse);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("pointerlockchange", lock);
      document.removeEventListener("mousemove", mouse);
    };
  }, []);
}
