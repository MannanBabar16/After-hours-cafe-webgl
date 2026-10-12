import { useEffect, useState } from "react";
import { useGame } from "../store/game";
import {
  useFocus,
  keys,
  interact,
  capturePointer,
  releasePointer,
} from "../game/controls";
import { products, supplyCatalog, moneyText } from "../data/operations";
import { customerById, clockText } from "../data/content";
import { totalOrder, itemsInHand } from "../store/operationsLogic";
import { Icon } from "./Icon";

export function HUD() {
  const s = useGame(),
    focus = useFocus((s) => s.focus),
    [locked, setLocked] = useState(!!document.pointerLockElement);
  useEffect(() => {
    const update = () => setLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", update);
    return () => document.removeEventListener("pointerlockchange", update);
  }, []);
  const active = s.ops.orders.filter(
    (o) => !o.paid && (o.channel === "indoor" || o.vehiclePhase === "waiting"),
  );
  const box =
    s.carry?.kind === "box"
      ? s.ops.boxes.find((b) => b.id === (s.carry as { boxId: number }).boxId)
      : undefined;
  const carryLabel = box
    ? `${supplyCatalog[box.supply].name} · ${box.quantity} ${supplyCatalog[box.supply].unit}`
    : s.carry?.kind === "cup"
      ? "Empty paper cup"
      : s.carry?.kind === "bakingTray"
        ? `${s.carry.quantity} ${s.carry.baked ? "warm cookies" : "dough portions"} · baking tray`
        : s.carry?.kind === "trash"
          ? s.carry.label
          : s.carry?.kind === "tray"
            ? `Serving tray · ${s.carry.items.length} item${s.carry.items.length === 1 ? "" : "s"}`
            : s.carry?.kind === "product"
              ? products[s.carry.item.product].name
              : "";
  const quest =
    !s.ops.open && s.phase !== "closing"
      ? "Prepare, then open your café."
      : s.business.lifetimeServed === 0
        ? "Take an order at the counter. A cup is waiting on the left."
        : s.business.lifetimeServed === 1
          ? "A first regular. Try a delivery, or answer the drive-through."
          : s.business.lifetimeServed < 4
            ? "The bakery is yours now. Bake a small batch while coffee brews."
            : s.ops.levels.robot === 0
              ? "Choose an upgrade that makes your next evening easier."
              : "A capable little café. Find your own rhythm.";
  return (
    <>
      <header className="operations-top">
        <div className="cafe-brand">
          <span className="brand-mark">
            <Icon name="coffee" size={24} />
          </span>
          <div>
            <h1>{s.business.name}</h1>
            <small>
              EVENING {String(s.shift).padStart(2, "0")} <i />{" "}
              {s.phase === "closing"
                ? "LAST ORDERS"
                : s.ops.open
                  ? "OPEN · WELCOME IN"
                  : "PREPARING THE CAFÉ"}
            </small>
          </div>
        </div>
        <div className="top-details">
          <div>
            <b>
              <Icon name="moon" />
              {clockText(s.elapsed)}
            </b>
            <small>
              <Icon name="rain" size={13} />
              {s.event === "rain"
                ? "Rain at the windows"
                : "A soft rainy evening"}
            </small>
          </div>
          <div className="till">
            <small>IN YOUR TILL</small>
            <strong>{moneyText(s.money)}</strong>
          </div>
          <button
            className="hud-round"
            aria-label="Settings"
            onClick={() => {
              releasePointer();
              useGame.setState({ settingsOpen: true });
            }}
          >
            <Icon name="settings" />
          </button>
        </div>
      </header>
      {!s.phone && !s.workstation && (
        <aside className="operations-orders">
          <div className="tiny-heading">
            A LITTLE SOMETHING WARM <span>{active.length} ORDERS</span>
          </div>
          {active.slice(0, 4).map((order) => (
            <article className={`order-ticket ${order.channel}`} key={order.id}>
              <div className="ticket-name">
                <Icon
                  name={order.channel === "drive" ? "car" : "users"}
                  size={16}
                />
                <b>
                  {order.channel === "drive"
                    ? `Drive-through · ${order.customer}`
                    : customerById(order.customer).name}
                </b>
                <small>{order.accepted ? "TAKEN" : "E TO TAKE"}</small>
              </div>
              {order.lines.map((line) => (
                <div
                  key={line.product}
                  className={
                    line.delivered === line.quantity
                      ? "fulfilled"
                      : "ticket-item"
                  }
                >
                  <Icon
                    name={line.product === "cookie" ? "cookie" : "coffee"}
                    size={16}
                  />
                  <span>{products[line.product].name}</span>
                  <b>{line.quantity - line.delivered || "✓"}</b>
                </div>
              ))}
              <footer>
                <span>
                  {order.accepted
                    ? "Pay after all items"
                    : "Waiting comfortably"}
                </span>
                <b>{moneyText(totalOrder(order))}</b>
              </footer>
            </article>
          ))}
        </aside>
      )}
      <div className="shift-note">
        <div>
          <b>{s.served} orders served</b>
          <span>
            {moneyText(s.revenue - s.ops.ingredientCost - s.ops.overhead)}{" "}
            operating profit
          </span>
        </div>
        <p>{quest}</p>
        {!s.ops.open && s.phase === "playing" && (
          <button className="secondary-button compact" onClick={s.openCafe}>
            <Icon name="store" size={15} /> Open the café
          </button>
        )}
        {s.phase === "closing" && (
          <small>Finish accepted orders to review your shift.</small>
        )}
      </div>
      {s.carry && (
        <div className="carry-chip">
          <Icon
            name={
              s.carry.kind === "box"
                ? "box"
                : s.carry.kind === "trash"
                  ? "trash"
                  : s.carry.kind === "bakingTray"
                    ? "cookie"
                    : s.carry.kind === "tray"
                      ? "tray"
                      : "coffee"
            }
            size={18}
          />
          <span>{carryLabel}</span>
          <kbd>G</kbd>
          <small>PUT DOWN</small>
          {itemsInHand(s.carry).length > 1 && (
            <b>{itemsInHand(s.carry).length}</b>
          )}
        </div>
      )}
      {s.cameraMode === "first" && !s.phone && !s.workstation && (
        <>
          <div className="first-crosshair" />
          {!locked && !s.paused && !s.settingsOpen && (
            <button
              className="look-button"
              onClick={() => void capturePointer()}
            >
              Click to look around <span>V returns to the diorama</span>
            </button>
          )}
          {focus && (
            <button className="first-interact" onClick={interact}>
              <kbd>E</kbd>
              {focus.label}
            </button>
          )}
        </>
      )}
      <footer className="operations-controls">
        <span>
          <kbd>WASD</kbd> Walk
        </span>
        <span>
          <kbd>E</kbd> Interact
        </span>
        <button
          onClick={() => {
            s.toggleCamera();
            if (s.cameraMode === "isometric") void capturePointer();
            else releasePointer();
          }}
        >
          <kbd>V</kbd>
          {s.cameraMode === "first" ? "First person" : "Diorama"}
        </button>
        <button
          onClick={() => {
            releasePointer();
            s.togglePhone();
          }}
        >
          <kbd>F</kbd> Phone
        </button>
        <button onClick={() => useGame.setState({ paused: true })}>
          <kbd>Esc</kbd> Pause
        </button>
      </footer>
      <div className="touch-movement">
        {["w", "a", "s", "d"].map((key) => (
          <button
            key={key}
            aria-label={`Walk ${key}`}
            onPointerDown={() => keys.add(key)}
            onPointerUp={() => keys.delete(key)}
            onPointerLeave={() => keys.delete(key)}
          >
            {key === "w" ? "↑" : key === "a" ? "←" : key === "s" ? "↓" : "→"}
          </button>
        ))}
        <button onClick={interact}>E</button>
      </div>
    </>
  );
}
export function Notifications() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`notification ${t.type}`}>
          <Icon
            name={
              t.type === "money"
                ? "bank"
                : t.type === "upgrade"
                  ? "sparkle"
                  : t.type === "social"
                    ? "heart"
                    : "coffee"
            }
            size={18}
          />
          <div>
            <b>{t.title}</b>
            <p>{t.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
