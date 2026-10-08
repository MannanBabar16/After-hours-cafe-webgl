import { create } from "zustand";
import { useEffect } from "react";
import { useGame } from "../store/game";
import { audio } from "./audio";
export const keys = new Set<string>();
export type Focus = {
  kind: "machine" | "customer" | "cat";
  label: string;
  position: [number, number, number];
  uid?: number;
};
export const useFocus = create<{
  focus: Focus | null;
  setFocus: (focus: Focus | null) => void;
}>((set) => ({ focus: null, setFocus: (focus) => set({ focus }) }));
export function interact() {
  const s = useGame.getState();
  if (s.phone || s.settingsOpen || s.paused || s.help || s.managementOpen)
    return;
  if (s.workstation) {
    s.craftStep();
    return;
  }
  const f = useFocus.getState().focus;
  if (!f) return;
  if (f.kind === "machine") s.openWorkstation();
  else if (f.kind === "cat") {
    audio.play("robot");
    s.notify("Milo approves.", "A slow blink. You have been accepted.");
  } else if (f.uid !== undefined) {
    const v = s.visitors.find((v) => v.uid === f.uid);
    if (!v) return;
    if (!v.accepted) s.acceptOrder(v.uid);
    else if (s.tray) s.serve(v.uid);
    else
      s.notify(
        f.label,
        v.paid
          ? "They settle into their favorite little ritual."
          : `A ${v.recipe}, whenever you’re ready. There’s no rush.`,
      );
  }
}
export function useControls() {
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches("input, textarea, select"))
        return;
      const key = event.key.toLowerCase();
      if (
        ["w", "a", "s", "d", "e", "q", "f", "r", "tab", "escape", " "].includes(
          key,
        )
      )
        event.preventDefault();
      keys.add(key);
      if (event.repeat) return;
      const s = useGame.getState();
      if (key === "e") interact();
      if (key === "r" && s.phase === "playing")
        useGame.setState({ managementOpen: !s.managementOpen });
      if (key === "f") s.togglePhone();
      if (key === "tab" && !s.workstation) s.togglePhone("Shop");
      if (key === "q" || key === "escape") s.back();
      if (key === " ") s.steam(true);
    };
    const up = (event: KeyboardEvent) => {
      keys.delete(event.key.toLowerCase());
      if (event.key === " ") useGame.getState().steam(false);
    };
    const blur = () => {
      keys.clear();
      useGame.getState().steam(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
}
