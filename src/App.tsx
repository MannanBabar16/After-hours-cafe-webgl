import { Component, useEffect } from "react";
import type { ReactNode } from "react";
import { Scene, GameClock } from "./game/Scene";
import { useControls } from "./game/controls";
import { useGame } from "./store/game";
import { HUD, Notifications } from "./ui/HUD";
import { Phone } from "./ui/Phone";
import { Workstation } from "./ui/Workstation";
import { Management } from "./ui/Management";
import { audio } from "./game/audio";
import {
  TitleScreen,
  SettingsScreen,
  SummaryScreen,
  PauseScreen,
  HelpScreen,
} from "./ui/Screens";
import "./styles.css";
class RenderBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="render-error">
        <h1>Your café needs WebGL.</h1>
        <p>
          Enable hardware acceleration in your desktop browser, then reload to
          switch the lights on.
        </p>
        <button onClick={() => location.reload()}>Try again</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  useControls();
  const phase = useGame((s) => s.phase);
  const workstation = useGame((s) => s.workstation);
  const settings = useGame((s) => s.settingsOpen);
  const paused = useGame((s) => s.paused);
  const help = useGame((s) => s.help);
  const management = useGame((s) => s.managementOpen);
  useEffect(() => {
    audio.setPaused(
      paused ||
        help ||
        settings ||
        management ||
        phase === "title" ||
        phase === "summary",
    );
  }, [paused, help, settings, management, phase]);
  return (
    <main className={`game-shell ${phase} ${workstation ? "at-bar" : ""}`}>
      <RenderBoundary>
        <Scene />
      </RenderBoundary>
      <GameClock />
      <div className="scene-vignette" />
      {phase === "title" ? (
        <TitleScreen />
      ) : phase === "summary" ? (
        <SummaryScreen />
      ) : (
        <>
          <HUD />
          {workstation && <Workstation />}
          <Phone />
          <Notifications />
        </>
      )}
      {paused && phase !== "title" && <PauseScreen />}
      {help && <HelpScreen />}
      {settings && <SettingsScreen />}
      {management && <Management />}
    </main>
  );
}
