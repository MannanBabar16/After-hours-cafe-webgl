import { useGame } from "../store/game";
import { customerById, recipeById, clockText } from "../data/content";
import { Icon } from "./Icon";
import { audio } from "../game/audio";
import { keys, interact } from "../game/controls";
import { level, shiftProfit } from "../game/business";
export function HUD() {
  const s = useGame();
  const orders = s.visitors.filter(
    (v) => !v.paid && ["ordering", "waiting"].includes(v.phase),
  );
  const hint =
    s.served === 0
      ? "Your first little ritual"
      : s.purchased.length === 0
        ? "Make it feel like home"
        : s.lifetimeEarned < 30
          ? "Get to know your people"
          : !s.purchased.includes("mochi")
            ? "A tiny helping hand"
            : "A place that knows your name";
  const detail =
    s.served === 0
      ? "Make an espresso, then take it to your guest."
      : s.purchased.length === 0
        ? "Open your phone and bring home your first decoration."
        : s.lifetimeEarned < 30
          ? "Good coffee turns new faces into familiar ones."
          : !s.purchased.includes("mochi")
            ? "Mochi is waiting in your phone’s shop."
            : "Keep the coffee flowing. Enjoy the rain.";
  return (
    <div className="hud">
      <header className="hud-header">
        <div className="cafe-brand">
          <span>
            <Icon name="coffee" size={23} />
          </span>
          <div>
            <b>{s.business.name}</b>
            <small>EVENING {String(s.shift).padStart(2, "0")}</small>
          </div>
        </div>
        <div className="hud-stats">
          <div className="hud-time">
            <Icon name="moon" size={18} />
            <b>{clockText(s.elapsed)}</b>
            <span>
              <Icon name="rain" size={14} />{" "}
              {s.event === "rain" ? "Heavy rain" : "Light rain"}
            </span>
          </div>
          <div className="hud-money">
            <span>IN THE TILL</span>
            <b>${s.money.toFixed(2)}</b>
          </div>
          <button
            className="icon-button"
            aria-label="Open settings"
            onClick={() => useGame.setState({ settingsOpen: true })}
          >
            <Icon name="settings" />
          </button>
        </div>
      </header>
      {!s.workstation && (
        <>
          <section className="orders" aria-label="Customer orders">
            {orders.length > 0 && (
              <span className="eyebrow">
                A LITTLE SOMETHING WARM · {orders.length}
              </span>
            )}
            {orders.map((v) => {
              const customer = customerById(v.id);
              const ready = s.tray?.recipe === v.recipe;
              return (
                <div
                  key={v.uid}
                  className={`order-card ${ready ? "ready" : ""}`}
                >
                  <span
                    className="avatar"
                    style={{ background: customer.palette }}
                  >
                    {customer.name[0]}
                  </span>
                  <div>
                    <span>
                      {customer.name}
                      {(s.familiarity[v.id] ?? 0) >= 3 && (
                        <Icon name="heart" size={10} />
                      )}
                    </span>
                    <b>
                      {!v.accepted ? "The usual?" : recipeById(v.recipe).name}
                      {v.pastry ? " + croissant" : ""}
                    </b>
                  </div>
                  <span className="order-status">
                    {ready ? (
                      <Icon name="check" size={16} />
                    ) : (
                      <Icon name="coffee" size={17} />
                    )}
                  </span>
                </div>
              );
            })}
          </section>
          {s.tray && (
            <div className="tray-card">
              <div>
                <Icon name="coffee" size={22} />
                <span>
                  <small>ON YOUR TRAY</small>
                  <b>
                    {recipeById(s.tray.recipe).name}
                    <em>
                      {s.tray.quality === "perfect" ? " · made perfectly" : ""}
                    </em>
                  </b>
                </span>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  useGame.setState({ tray: null });
                  s.notify(
                    "For the house",
                    "A little coffee for you. Your tray is ready again.",
                  );
                  audio.play("cup");
                }}
              >
                Set aside
              </button>
            </div>
          )}
          <div className="journey-hint">
            <span className="hint-line" />
            <div>
              <span className="eyebrow">{hint}</span>
              <p>{detail}</p>
            </div>
          </div>
          <div className="business-strip">
            <span>LV {level(s.business.xp)}</span>
            <b>{s.served} cups served</b>
            <span
              className={
                shiftProfit(s.revenue, s.business) >= 0 ? "profitable" : ""
              }
            >
              ${shiftProfit(s.revenue, s.business).toFixed(2)} profit
            </span>
            <button
              onClick={() =>
                useGame.setState({
                  managementOpen: true,
                  managementTab: "today",
                })
              }
            >
              <Icon name="store" size={15} /> Café desk <kbd>R</kbd>
            </button>
          </div>
          <div className="hud-footer">
            <div className="control-hints">
              <span>
                <kbd>WASD</kbd> Move
              </span>
              <span>
                <kbd>E</kbd> Interact
              </span>
              <button onClick={() => s.togglePhone()}>
                <kbd>F</kbd> Phone
              </button>
              <span>
                <kbd>Esc</kbd> Pause
              </span>
            </div>
            <div className="footer-actions">
              <button
                className="ambience-toggle"
                onClick={() => {
                  if (s.settings.master > 0) s.updateSettings({ master: 0 });
                  else {
                    void audio.start();
                    s.updateSettings({ master: 0.65 });
                  }
                }}
                aria-label={s.settings.master ? "Mute sound" : "Enable sound"}
              >
                <Icon name={s.settings.master ? "sound" : "mute"} size={16} />
                <span>Rain & soft keys</span>
              </button>
              <button
                className="icon-button"
                aria-label="How to play"
                onClick={() => useGame.setState({ help: true })}
              >
                <Icon name="help" size={17} />
              </button>
              <button
                className="phone-shortcut"
                onClick={() => s.togglePhone()}
              >
                <Icon name="phone" size={17} />
                <span>{s.followers} followers</span>
              </button>
            </div>
          </div>
          <div className="touch-controls">
            {["w", "a", "s", "d"].map((k) => (
              <button
                key={k}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  keys.add(k);
                }}
                onPointerUp={() => keys.delete(k)}
                onPointerCancel={() => keys.delete(k)}
              >
                {k === "w" ? "↑" : k === "a" ? "←" : k === "s" ? "↓" : "→"}
              </button>
            ))}
            <button onClick={interact}>E</button>
          </div>
        </>
      )}
      {s.phase === "closing" && (
        <div className="closing-notice">
          <Icon name="moon" />
          <span>One last goodnight.</span>
          <small>The café is closing.</small>
        </div>
      )}
    </div>
  );
}
export function Notifications() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="notifications" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`notification ${t.type} ${t.age > 5.7 ? "leaving" : ""}`}
        >
          <span className="notification-icon">
            <Icon
              name={
                t.type === "social"
                  ? "camera"
                  : t.type === "money"
                    ? "bank"
                    : t.type === "upgrade"
                      ? "sparkle"
                      : "coffee"
              }
              size={18}
            />
          </span>
          <div>
            <b>{t.title}</b>
            <p>{t.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
