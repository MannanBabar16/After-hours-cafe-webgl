import { useState } from "react";
import { useGame } from "../store/game";
import { audio } from "../game/audio";
import { Icon } from "./Icon";
import { moneyText } from "../data/operations";

export function TitleScreen() {
  const s = useGame(),
    [confirm, setConfirm] = useState(false);
  const start = () => {
    void audio.start();
    s.newGame();
    setConfirm(false);
  };
  return (
    <div className="title-screen">
      <div className="title-top">
        <span className="title-signature">
          <Icon name="moon" size={19} /> A LITTLE PLACE AFTER DARK
        </span>
        <span>
          <Icon name="rain" size={17} /> Seoul · a rainy evening
        </span>
      </div>
      <section className="title-content">
        <div className="title-rule" />
        <span className="eyebrow">COFFEE · COOKIES · GOOD COMPANY</span>
        <h1>
          After Hours
          <br />
          <em>Café.</em>
        </h1>
        <p>
          Keep the coffee flowing.
          <br />
          Give your regulars a little warmth.
          <br />
          Make this place your own.
        </p>
        <div className="title-actions">
          {s.hasSave && (
            <button
              className="primary-button"
              onClick={() => {
                void audio.start();
                s.continueGame();
              }}
            >
              <Icon name="play" size={17} /> Continue{" "}
              <span>Evening {s.shift}</span>
            </button>
          )}
          <button
            className={s.hasSave ? "secondary-button" : "primary-button"}
            onClick={() => (s.hasSave ? setConfirm(true) : start())}
          >
            <Icon name="coffee" size={18} />
            {s.hasSave ? "New café" : "Start your evening"}
          </button>
          <button
            className="text-button title-settings"
            onClick={() => useGame.setState({ settingsOpen: true })}
          >
            <Icon name="settings" size={16} /> Settings
          </button>
        </div>
        <span className="title-note">
          <span /> Stock. Brew. Bake. Serve. Find your own rhythm.
        </span>
      </section>
      <div className="title-bottom">
        <span>카페 · 오늘도 따뜻하게</span>
        <span>
          BEST ENJOYED WITH HEADPHONES <Icon name="music" size={14} />
        </span>
      </div>
      {confirm && (
        <div className="modal-backdrop">
          <section className="simple-modal">
            <span className="eyebrow">A FRESH LITTLE BEGINNING</span>
            <h2>Start a new café?</h2>
            <p>This replaces your saved evening, stock, and upgrades.</p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setConfirm(false)}
              >
                Keep my café
              </button>
              <button className="primary-button" onClick={start}>
                Start a new café
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
export function SettingsScreen() {
  const s = useGame(),
    [confirm, setConfirm] = useState(false);
  return (
    <div className="modal-backdrop">
      <section
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <button
          className="icon-button modal-close"
          aria-label="Close settings"
          onClick={() => useGame.setState({ settingsOpen: false })}
        >
          <Icon name="close" />
        </button>
        <span className="eyebrow">SETTLE IN</span>
        <h2>Just your kind of evening.</h2>
        <p>Find your comfortable little balance.</p>
        <div className="settings-fields">
          {(
            [
              { key: "master", label: "Master volume" },
              { key: "music", label: "Soft music" },
              { key: "sfx", label: "Café sounds" },
              { key: "smoothing", label: "Camera softness" },
            ] as const
          ).map((row) => (
            <label className="slider-row" key={row.key}>
              <span>{row.label}</span>
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={s.settings[row.key]}
                onChange={(e) =>
                  s.updateSettings({ [row.key]: Number(e.target.value) })
                }
              />
              <b>{Math.round(s.settings[row.key] * 100)}%</b>
            </label>
          ))}
          <div className="setting-row">
            <span>Graphics</span>
            <div className="segmented">
              {(["low", "high"] as const).map((q) => (
                <button
                  key={q}
                  className={s.settings.graphics === q ? "active" : ""}
                  onClick={() => s.updateSettings({ graphics: q })}
                >
                  {q === "high" ? "Lovely" : "Light"}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row">
            <span>Fullscreen</span>
            <button
              className="secondary-button compact"
              onClick={() => {
                if (document.fullscreenElement) void document.exitFullscreen();
                else
                  void document.documentElement
                    .requestFullscreen()
                    .catch(() =>
                      s.notify(
                        "Use browser fullscreen",
                        "F11 makes a little more room.",
                      ),
                    );
              }}
            >
              <Icon name="fullscreen" size={15} /> Toggle fullscreen
            </button>
          </div>
        </div>
        <div className="settings-footer">
          <button className="text-button" onClick={() => setConfirm(!confirm)}>
            <Icon name="reset" size={14} /> Reset save
          </button>
          {confirm && (
            <button className="secondary-button compact" onClick={s.resetSave}>
              Delete saved café
            </button>
          )}
          <button
            className="primary-button compact"
            onClick={() => useGame.setState({ settingsOpen: false })}
          >
            Lovely
          </button>
        </div>
      </section>
    </div>
  );
}
export function PauseScreen() {
  return (
    <div className="modal-backdrop pause-backdrop">
      <section className="simple-modal pause-panel">
        <Icon name="moon" size={29} />
        <span className="eyebrow">TAKE A LITTLE BREATH</span>
        <h2>The evening can wait.</h2>
        <p>Your coffee, oven, visitors, and deliveries are paused.</p>
        <button
          className="primary-button"
          onClick={() => useGame.setState({ paused: false })}
        >
          <Icon name="play" size={17} /> Back to the café
        </button>
        <button
          className="text-button"
          onClick={() => useGame.setState({ help: true, paused: false })}
        >
          A little guidance
        </button>
        <button
          className="text-button"
          onClick={() =>
            useGame.setState({ settingsOpen: true, paused: false })
          }
        >
          Settings
        </button>
      </section>
    </div>
  );
}
export function HelpScreen() {
  return (
    <div className="modal-backdrop">
      <section className="simple-modal help-panel">
        <button
          className="icon-button modal-close"
          aria-label="Close help"
          onClick={() => useGame.setState({ help: false })}
        >
          <Icon name="close" />
        </button>
        <span className="eyebrow">ONE SMALL THING AT A TIME</span>
        <h2>Your first little evening.</h2>
        <ol>
          <li>
            <b>Open and take an order.</b> Walk with WASD. Face your guest and
            press E.
          </li>
          <li>
            <b>Make the right coffee.</b> E at the cup stack, E at the machine,
            then choose a drink. Work elsewhere while it brews.
          </li>
          <li>
            <b>Collect and serve.</b> Return to the machine with free hands.
            Carry the drink to its guest and press E. Payment comes after every
            item is delivered.
          </li>
          <li>
            <b>Refill from real stock.</b> Pick up a labeled box in the
            stockroom, carry it to matching equipment, and press E. Empty
            packaging goes in the bin.
          </li>
          <li>
            <b>Add cookies.</b> After two orders, take a dough tray from the
            stockroom. Insert it in the oven, press E to start, then collect and
            transfer it to the display.
          </li>
        </ol>
        <div className="help-controls">
          <span>
            <kbd>V</kbd> Change camera
          </span>
          <span>
            <kbd>F</kbd> Business phone
          </span>
          <span>
            <kbd>G</kbd> Put down safely
          </span>
          <span>
            <kbd>Esc</kbd> Back / pause
          </span>
        </div>
        <p>
          First person: click the café for mouse look. Menus release the mouse.
          V returns to the diorama. Deliveries arrive outside; drive-through
          orders are served at the side window.
        </p>
        <button
          className="primary-button"
          onClick={() => useGame.setState({ help: false })}
        >
          I’ll find my rhythm
        </button>
      </section>
    </div>
  );
}
export function SummaryScreen() {
  const s = useGame(),
    profit = s.revenue - s.ops.ingredientCost - s.ops.overhead;
  return (
    <div className="modal-backdrop summary-backdrop">
      <section className="closing-report">
        <span className="eyebrow">THE LIGHTS, A LITTLE LOWER</span>
        <h1>A good little evening.</h1>
        <p>
          Evening {s.shift} · {s.served} orders · familiar faces and warm cups.
        </p>
        <div className="report-till">
          <span>IN YOUR TILL</span>
          <strong>{moneyText(s.money)}</strong>
        </div>
        <div className="report-lines">
          <div>
            <span>Sales & tips</span>
            <b>+{moneyText(s.revenue)}</b>
          </div>
          <div>
            <span>Ingredients actually used</span>
            <b>−{moneyText(s.ops.ingredientCost)}</b>
          </div>
          <div>
            <span>{s.business.owned ? "Utilities" : "Rent & utilities"}</span>
            <b>−{moneyText(s.ops.overhead)}</b>
          </div>
          <div className="report-profit">
            <span>Operating profit</span>
            <strong>{moneyText(profit)}</strong>
          </div>
        </div>
        <div className="report-small">
          <span>
            Stock purchased <b>{moneyText(s.ops.supplySpend)}</b>
          </span>
          <span>
            Equipment & décor <b>{moneyText(s.ops.upgradeSpend)}</b>
          </span>
          <span>
            New followers <b>+{s.followers - s.followerStart}</b>
          </span>
        </div>
        <p className="report-note">
          Your boxes, equipment stock, cookies, and upgrades are ready for the
          next evening.
        </p>
        <button className="primary-button" onClick={s.nextShift}>
          <Icon name="moon" size={18} /> Another evening
        </button>
        <button
          className="text-button"
          onClick={() => useGame.setState({ phase: "title" })}
        >
          Save & return to the title
        </button>
      </section>
    </div>
  );
}
export function DebugPanel() {
  const open = useGame((s) => s.debugOpen);
  if (!import.meta.env.DEV || !open) return null;
  return (
    <section className="debug-panel">
      <b>Development · real simulation controls</b>
      {[
        ["money", "+$100"],
        ["refill", "Refill containers"],
        ["indoor", "Indoor guest"],
        ["drive", "Drive-through car"],
        ["delivery", "Deliver pending stock"],
        ["bakery", "Unlock bakery"],
        ["oven", "Finish current bake"],
        ["upgrade", "Equipment level 2"],
        ["rain", "Toggle rain"],
        ["camera", "Switch camera"],
        ["close", "Close shift"],
      ].map(([key, label]) => (
        <button key={key} onClick={() => useGame.getState().debug(key)}>
          {label}
        </button>
      ))}
      <button onClick={() => useGame.setState({ debugOpen: false })}>
        Close
      </button>
    </section>
  );
}
