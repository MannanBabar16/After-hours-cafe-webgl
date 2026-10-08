import { useState } from "react";
import { useGame } from "../store/game";
import { recipes } from "../data/content";
import { audio } from "../game/audio";
import { Icon } from "./Icon";
import { shiftProfit, overhead, level, baristaTitle } from "../game/business";
export function TitleScreen() {
  const hasSave = useGame((s) => s.hasSave);
  const shift = useGame((s) => s.shift);
  const [confirm, setConfirm] = useState(false);
  const start = () => {
    void audio.start();
    useGame.getState().newGame();
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
        <span className="eyebrow">MAKE YOURSELF AT HOME</span>
        <h1>
          After Hours
          <br />
          <em>Café.</em>
        </h1>
        <p>
          Learn the craft.
          <br />
          Run your café.
          <br />
          Know your people.
        </p>
        <div className="title-actions">
          {hasSave && (
            <button
              className="primary-button"
              onClick={() => {
                void audio.start();
                useGame.getState().continueGame();
              }}
            >
              <Icon name="play" size={17} /> Continue{" "}
              <span>Evening {shift}</span>
            </button>
          )}
          <button
            className={hasSave ? "secondary-button" : "primary-button"}
            onClick={() => (hasSave ? setConfirm(true) : start())}
          >
            <Icon name="coffee" size={18} />{" "}
            {hasSave ? "New game" : "Open your café"}
          </button>
          <button
            className="text-button title-settings"
            onClick={() => useGame.setState({ settingsOpen: true })}
          >
            <Icon name="settings" size={16} /> Settings
          </button>
        </div>
        <span className="title-note">
          <span /> A quiet little evening, just for you.
        </span>
      </section>
      <div className="title-bottom">
        <span>카페 · 오늘도 따뜻하게</span>
        <span>
          BEST ENJOYED WITH HEADPHONES <Icon name="music" size={14} />
        </span>
      </div>
      {confirm && (
        <Confirm
          title="A fresh little beginning?"
          description="Your saved café will be replaced with a new evening."
          action="Start a new game"
          onConfirm={start}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
export function SettingsScreen() {
  const settings = useGame((s) => s.settings);
  const [confirm, setConfirm] = useState(false);
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  return (
    <div className="modal-backdrop">
      <section
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <button
          className="icon-button modal-close"
          aria-label="Close settings"
          onClick={() => useGame.setState({ settingsOpen: false })}
        >
          <Icon name="close" />
        </button>
        <span className="eyebrow">SETTLE IN</span>
        <h2 id="settings-title">Just your kind of evening.</h2>
        <p>Find your comfortable little balance.</p>
        <div className="settings-fields">
          {[
            { key: "master" as const, label: "Master volume" },
            { key: "music" as const, label: "Music & soft keys" },
            { key: "sfx" as const, label: "Café sounds" },
            { key: "smoothing" as const, label: "Camera softness" },
          ].map((row) => (
            <label className="slider-row" key={row.key}>
              <span>{row.label}</span>
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={settings[row.key]}
                onChange={(e) =>
                  useGame
                    .getState()
                    .updateSettings({ [row.key]: Number(e.target.value) })
                }
              />
              <b>{Math.round(settings[row.key] * 100)}%</b>
            </label>
          ))}
          <div className="setting-row">
            <span>Graphics</span>
            <div className="segmented">
              {(["low", "high"] as const).map((q) => (
                <button
                  key={q}
                  className={settings.graphics === q ? "active" : ""}
                  onClick={() =>
                    useGame.getState().updateSettings({ graphics: q })
                  }
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
              onClick={async () => {
                try {
                  if (document.fullscreenElement)
                    await document.exitFullscreen();
                  else await document.documentElement.requestFullscreen();
                  setFullscreen(!!document.fullscreenElement);
                } catch {
                  useGame
                    .getState()
                    .notify(
                      "Use your browser’s fullscreen",
                      "Press F11 to make a little more room.",
                    );
                }
              }}
            >
              <Icon name="fullscreen" size={15} />
              {fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            </button>
          </div>
        </div>
        <div className="settings-footer">
          <button className="text-button" onClick={() => setConfirm(true)}>
            <Icon name="reset" size={14} /> Reset save
          </button>
          <button
            className="primary-button compact"
            onClick={() => useGame.setState({ settingsOpen: false })}
          >
            All comfortable
          </button>
        </div>
      </section>
      {confirm && (
        <Confirm
          title="Let this café go?"
          description="Your saved money, furniture, and familiar faces will be cleared."
          action="Reset save"
          onConfirm={() => {
            useGame.getState().resetSave();
            setConfirm(false);
          }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
export function SummaryScreen() {
  const s = useGame();
  const popular = recipes.reduce((a, b) =>
    s.drinkCounts[b.id] > s.drinkCounts[a.id] ? b : a,
  );
  return (
    <div className="summary-screen">
      <section className="summary-panel">
        <div className="summary-moon">
          <Icon name="moon" size={29} />
        </div>
        <span className="eyebrow">
          EVENING {String(s.shift).padStart(2, "0")} · SHIFT COMPLETE
        </span>
        <h2>
          The city sleeps.
          <br />
          <em>You made it warmer.</em>
        </h2>
        <p>One café. A few good cups. A little more like home.</p>
        <div className="summary-revenue">
          <span>TONIGHT’S REVENUE</span>
          <b>${s.revenue.toFixed(2)}</b>
        </div>
        <div className="summary-profit">
          <b>
            ${shiftProfit(s.revenue, s.business).toFixed(2)} operating profit
          </b>
          <span>
            ${s.business.ingredientCost.toFixed(2)} ingredients · $
            {overhead(s.business)} operating costs · +${s.business.rewards} goal
            rewards
          </span>
          <span>
            Level {level(s.business.xp)} · {baristaTitle(s.business.xp)}
          </span>
        </div>
        <div className="summary-grid">
          <div>
            <Icon name="users" />
            <b>{s.served}</b>
            <span>People served</span>
          </div>
          <div>
            <Icon name="coffee" />
            <b>{s.perfect}</b>
            <span>Perfect drinks</span>
          </div>
          <div>
            <Icon name="heart" />
            <b>{s.newRegulars}</b>
            <span>New regulars</span>
          </div>
          <div>
            <Icon name="camera" />
            <b>+{s.followers - s.followerStart}</b>
            <span>New followers</span>
          </div>
        </div>
        <div className="summary-favorite">
          <span>Tonight’s favorite</span>
          <b>{s.served ? popular.name : "A quiet rainy evening"}</b>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            void audio.start();
            s.nextShift();
          }}
        >
          Another little evening <Icon name="moon" size={17} />
        </button>
        <button
          className="text-button"
          onClick={() => useGame.setState({ phase: "title" })}
        >
          Back to the title
        </button>
        <small>Progress saved. The café will be here.</small>
      </section>
    </div>
  );
}
export function PauseScreen() {
  return (
    <div className="modal-backdrop">
      <section className="pause-panel">
        <Icon name="moon" size={30} />
        <span className="eyebrow">TAKE YOUR TIME</span>
        <h2>The coffee can wait.</h2>
        <p>Your evening is paused.</p>
        <button
          className="primary-button"
          onClick={() => useGame.setState({ paused: false })}
        >
          <Icon name="play" size={16} /> Back to the café
        </button>
        <button
          className="secondary-button"
          onClick={() => useGame.setState({ settingsOpen: true })}
        >
          <Icon name="settings" size={16} /> Settings
        </button>
        <button
          className="text-button"
          onClick={() =>
            useGame.setState({
              phase: "title",
              paused: false,
              phone: false,
              workstation: false,
            })
          }
        >
          Save & return to title
        </button>
      </section>
    </div>
  );
}
export function HelpScreen() {
  return (
    <div className="modal-backdrop">
      <section className="help-panel">
        <button
          className="icon-button modal-close"
          aria-label="Close guide"
          onClick={() => useGame.setState({ help: false })}
        >
          <Icon name="close" />
        </button>
        <span className="eyebrow">A FEW LITTLE RITUALS</span>
        <h2>Welcome to your café.</h2>
        <p>There’s no rush. Everyone is happy to wait.</p>
        <div className="help-controls">
          <span>
            <kbd>W A S D</kbd> Walk around your café
          </span>
          <span>
            <kbd>E</kbd> Use the machine, serve, say hello
          </span>
          <span>
            <kbd>F</kbd> Your phone & CafeGram
          </span>
          <span>
            <kbd>R</kbd> Café desk: stock, prices, goals & practice
          </span>
          <span>
            <kbd>Tab</kbd> Make the café yours in the shop
          </span>
          <span>
            <kbd>Q / Esc</kbd> Back, or take a break
          </span>
          <span>
            <kbd>Space</kbd> Hold to steam milk at the bar
          </span>
        </div>
        <ol>
          <li>Approach the espresso machine and press E.</li>
          <li>
            Choose the drink. Grind, distribute, tamp, lock the portafilter and
            start extraction. Guided mode helps with timing.
          </li>
          <li>
            For milk drinks, purge the wand, hold to texture milk and release
            around 55–65°C. Pour low and steady.
          </li>
          <li>Take your tray to the customer. Press E to serve.</li>
        </ol>
        <p className="help-small">
          Your first drink unlocks Latte; three unlock Cappuccino. Eight
          lifetime cups unlock Americano; fourteen unlock Flat white. Restock
          and track profit at the café desk. Practice uses free supplies and
          pauses the night. Buy the café for $500 to stop paying rent. Progress
          saves automatically.
        </p>
        <button
          className="primary-button"
          onClick={() => useGame.setState({ help: false })}
        >
          Put the kettle on
        </button>
      </section>
    </div>
  );
}
function Confirm({
  title,
  description,
  action,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  action: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-backdrop confirmation">
      <section className="confirm-panel" role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <p>{description}</p>
        <button className="primary-button" onClick={onConfirm}>
          {action}
        </button>
        <button className="secondary-button" onClick={onCancel}>
          Keep my café
        </button>
      </section>
    </div>
  );
}
