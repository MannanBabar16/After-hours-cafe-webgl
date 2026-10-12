import { useState } from "react";
import { useGame, familiarityLabel } from "../store/game";
import {
  supplyCatalog,
  supplyIds,
  equipment,
  equipmentIds,
  caps,
  products,
  moneyText,
} from "../data/operations";
import type { SupplyId, ProductId } from "../data/operations";
import { customers, upgrades, customerById } from "../data/content";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

const apps = [
  { id: "Supply", label: "Supply shop", icon: "box", color: "#dde7d7" },
  { id: "Equipment", label: "Equipment", icon: "gauge", color: "#eadbc0" },
  { id: "Bank", label: "Your bank", icon: "bank", color: "#d7e2e1" },
  { id: "Café", label: "Café manager", icon: "store", color: "#e5dacc" },
  { id: "CafeGram", label: "CafeGram", icon: "heart", color: "#e9d5cc" },
] as const;
function SupplyShop() {
  const s = useGame(),
    [cart, setCart] = useState<Partial<Record<SupplyId, number>>>({});
  const total = supplyIds.reduce(
    (sum, id) => sum + (cart[id] ?? 0) * supplyCatalog[id].price,
    0,
  );
  return (
    <>
      <div className="phone-intro">
        <span>MOON DELIVERY</span>
        <h3>Good things, in small boxes.</h3>
        <p>
          Order now. Carry the boxes inside, then refill the equipment yourself.
        </p>
      </div>
      {supplyIds.map((id) => {
        const p = supplyCatalog[id];
        return (
          <article className="supply-row" key={id}>
            <div className="pack-icon" style={{ background: p.color }}>
              <Icon name={p.icon as IconName} size={24} />
            </div>
            <div>
              <b>{p.name}</b>
              <small>
                {p.pack} {p.unit} · {moneyText(p.price)}
              </small>
            </div>
            <div className="quantity-picker">
              <button
                aria-label={`Remove ${p.name}`}
                onClick={() =>
                  setCart({ ...cart, [id]: Math.max(0, (cart[id] ?? 0) - 1) })
                }
              >
                −
              </button>
              <span>{cart[id] ?? 0}</span>
              <button
                aria-label={`Add ${p.name}`}
                onClick={() =>
                  setCart({ ...cart, [id]: Math.min(5, (cart[id] ?? 0) + 1) })
                }
              >
                +
              </button>
            </div>
          </article>
        );
      })}
      <button
        className="primary-button full-width checkout"
        disabled={!total}
        onClick={() => {
          const before = s.ops.shipments.length;
          s.orderSupplies(cart);
          if (useGame.getState().ops.shipments.length > before) setCart({});
        }}
      >
        <Icon name="truck" size={18} /> Order delivery <b>{moneyText(total)}</b>
      </button>
      {s.ops.shipments.length > 0 && (
        <div className="delivery-card">
          <Icon name="truck" />
          <div>
            <b>
              {s.ops.truck.stage === "parked"
                ? "Truck outside · boxes ready"
                : "Your delivery is on its way"}
            </b>
            <p>
              {s.ops.shipments
                .map((sh) =>
                  sh.items
                    .map((i) => `${i.packs} ${supplyCatalog[i.supply].name}`)
                    .join(" · "),
                )
                .join(" / ")}
            </p>
          </div>
        </div>
      )}
      <p className="phone-footnote">
        No instant stock. The truck takes about 12 seconds to arrive. Small
        emergency orders can use supplier credit when a key container is empty.
      </p>
    </>
  );
}
function EquipmentShop() {
  const s = useGame();
  return (
    <>
      <div className="phone-intro">
        <span>A LITTLE MORE CAPABLE</span>
        <h3>Make the work your own.</h3>
        <p>
          Every upgrade changes your equipment. Capacity never adds free
          ingredients.
        </p>
      </div>
      {equipmentIds.map((id) => {
        const p = equipment[id],
          level = s.ops.levels[id],
          price = p.prices[level];
        return (
          <article key={id} className="equipment-row">
            <div>
              <Icon name={p.icon as IconName} size={23} />
              <div>
                <b>{p.name}</b>
                <small>
                  {caps(s.ops.levels, id)} {p.unit}
                  {price !== undefined
                    ? ` → ${p.values[level + 1]} ${p.unit}`
                    : " · fully upgraded"}
                </small>
              </div>
            </div>
            <p>{p.detail}</p>
            <button
              className="secondary-button compact"
              disabled={price === undefined || s.money < (price ?? 0)}
              onClick={() => s.buyEquipment(id)}
            >
              {price === undefined ? (
                <>
                  <Icon name="check" size={14} /> Yours
                </>
              ) : (
                <>
                  Upgrade <b>{moneyText(price)}</b>
                </>
              )}
            </button>
          </article>
        );
      })}
    </>
  );
}
function Bank() {
  const s = useGame();
  return (
    <>
      <div className="bank-hero">
        <span>YOUR WORK, ADDING UP</span>
        <strong>{moneyText(s.money)}</strong>
        <small>Available balance</small>
      </div>
      <div className="bank-grid">
        <div>
          <span>Orders & tips</span>
          <b>{moneyText(s.revenue)}</b>
        </div>
        <div>
          <span>Supply purchases</span>
          <b>−{moneyText(s.ops.supplySpend)}</b>
        </div>
        <div>
          <span>Equipment & décor</span>
          <b>−{moneyText(s.ops.upgradeSpend)}</b>
        </div>
        <div>
          <span>Cash from trading</span>
          <b>
            {moneyText(
              s.revenue -
                s.ops.supplySpend -
                s.ops.upgradeSpend -
                s.ops.overhead,
            )}
          </b>
        </div>
      </div>
      <div className="profit-note">
        <b>
          {moneyText(s.revenue - s.ops.ingredientCost - s.ops.overhead)}{" "}
          operating profit
        </b>
        <p>
          Sales less ingredients used and shift costs. Buying unopened stock
          changes cash first; it becomes an ingredient cost when used.
        </p>
      </div>
      <h4>Recent transactions</h4>
      {s.ops.transactions.length ? (
        s.ops.transactions.map((t) => (
          <div className="transaction" key={t.id}>
            <div>
              <b>{t.label}</b>
              <small>
                {t.time} · {t.kind}
              </small>
            </div>
            <strong className={t.amount >= 0 ? "positive" : ""}>
              {t.amount >= 0 ? "+" : ""}
              {moneyText(t.amount)}
            </strong>
          </div>
        ))
      ) : (
        <p className="empty-note">
          Your first customer will make the first entry.
        </p>
      )}
    </>
  );
}
function Manager() {
  const s = useGame();
  return (
    <>
      <div className="phone-intro">
        <span>YOUR CAFÉ / EVENING {s.shift}</span>
        <h3>A place with your name on it.</h3>
        <p>
          {s.event === "rain"
            ? "Rain brings the study crowd in."
            : s.event === "viral"
              ? "CafeGram is bringing a few more visitors."
              : "A gentle evening: indoor tables and coffee to go."}
        </p>
      </div>
      <div className="manager-metrics">
        <span>
          <b>{s.served}</b> orders served
        </span>
        <span>
          <b>{Math.round(s.reputation)}</b> reputation
        </span>
        <span>
          <b>{s.followers}</b> followers
        </span>
      </div>
      <h4>Tonight’s menu</h4>
      {[
        ...s.unlocked,
        ...(s.business.lifetimeServed >= 2 ? ["cookie" as const] : []),
      ].map((id) => (
        <label className="price-row" key={id}>
          <span>
            <Icon name={id === "cookie" ? "cookie" : "coffee"} size={16} />
            {products[id].name}
          </span>
          <span>
            $
            <input
              aria-label={`${products[id].name} price`}
              type="number"
              min="1"
              max="12"
              step=".5"
              value={s.ops.menuPrices[id] ?? products[id].price}
              onChange={(e) =>
                s.setMenuPrice(id as ProductId, Number(e.target.value))
              }
            />
          </span>
        </label>
      ))}
      <p className="phone-footnote">
        Prices are quoted when orders arrive. Existing orders keep their
        original price.
      </p>
      <h4>Equipment at a glance</h4>
      <div className="equipment-levels">
        {[
          ["Beans", s.ops.containers.beans, caps(s.ops.levels, "hopper")],
          ["Milk", s.ops.containers.milk, caps(s.ops.levels, "milkTank")],
          ["Cups", s.ops.containers.cups, caps(s.ops.levels, "cupDispenser")],
          ["Dough", s.ops.containers.dough, 24],
          ["Cookies", s.ops.display.quantity, caps(s.ops.levels, "display")],
        ].map(([name, amount, max]) => (
          <div key={name}>
            <span>{name}</span>
            <b>
              {amount}/{max}
            </b>
            <i style={{ width: `${(Number(amount) / Number(max)) * 100}%` }} />
          </div>
        ))}
      </div>
      <h4>Make it yours</h4>
      <label className="custom-name">
        <span>Café name</span>
        <input
          maxLength={28}
          value={s.business.name}
          onChange={(e) => s.setBusiness({ name: e.target.value })}
        />
      </label>
      <div className="custom-colors">
        {(["apron", "cup"] as const).map((key) => (
          <label key={key}>
            {key === "apron" ? "Apron" : "Cup sleeve"}
            <input
              type="color"
              value={s.business[key]}
              onChange={(e) => s.setBusiness({ [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="segmented">
        {(["sage", "rose", "midnight"] as const).map((theme) => (
          <button
            key={theme}
            className={s.business.theme === theme ? "active" : ""}
            onClick={() => s.setBusiness({ theme })}
          >
            {theme}
          </button>
        ))}
      </div>
      <h4>Little additions</h4>
      {upgrades
        .filter((u) => u.id !== "machine")
        .map((u) => (
          <div className="decor-row" key={u.id}>
            <Icon name={u.icon as IconName} />
            <div>
              <b>{u.name}</b>
              <small>{u.description}</small>
            </div>
            <button
              disabled={s.purchased.includes(u.id) || s.money < u.price}
              onClick={() => s.buy(u.id)}
            >
              {s.purchased.includes(u.id) ? "✓" : moneyText(u.price)}
            </button>
          </div>
        ))}
      <div className="ownership">
        <b>
          {s.business.owned
            ? "This café is yours."
            : "One day, your own little café."}
        </b>
        <p>
          {s.business.owned
            ? "Only utilities remain at closing."
            : "Save $500 to remove nightly rent."}
        </p>
        <button
          className="secondary-button compact"
          disabled={s.business.owned || s.money < 500}
          onClick={s.buyCafe}
        >
          {s.business.owned ? "Owned" : "Buy the café · $500"}
        </button>
      </div>
      <button
        className="secondary-button full-width"
        onClick={() => {
          s.closeCafe();
          useGame.setState({ phone: false });
        }}
      >
        Close after current orders
      </button>
    </>
  );
}
function CafeGram() {
  const s = useGame();
  return (
    <>
      <div className="phone-intro">
        <span>CAFEGRAM / A LITTLE COMMUNITY</span>
        <h3>Familiar faces. New stories.</h3>
        <p>{s.followers} people follow your little corner of the night.</p>
      </div>
      {s.posts.length ? (
        s.posts.map((post) => (
          <article className="social-post" key={post.id}>
            <header>
              <span style={{ background: customerById(post.customer).palette }}>
                {customerById(post.customer).name[0]}
              </span>
              <div>
                <b>{customerById(post.customer).handle}</b>
                <small>
                  {post.time} · at {s.business.name}
                </small>
              </div>
            </header>
            <div className="social-art">
              <Icon name="coffee" size={42} />
              <Icon name="rain" size={25} />
              {post.text.includes("cookies") && (
                <Icon name="cookie" size={29} />
              )}
            </div>
            <p>{post.text}</p>
            <small>
              <Icon name="heart" size={13} /> {post.likes} little appreciations
            </small>
          </article>
        ))
      ) : (
        <p className="empty-note">
          Serve someone a warm drink. Their next little post may be about you.
        </p>
      )}
      <h4>Your regulars</h4>
      {customers.map((c) => (
        <div className="regular-row" key={c.id}>
          <span style={{ background: c.palette }}>{c.name[0]}</span>
          <div>
            <b>{c.name}</b>
            <small>{c.tag}</small>
          </div>
          <em>{familiarityLabel(s.familiarity[c.id] ?? 0)}</em>
        </div>
      ))}
    </>
  );
}
export function Phone() {
  const open = useGame((s) => s.phone),
    app = useGame((s) => s.phoneApp),
    money = useGame((s) => s.money);
  if (!open) return null;
  return (
    <div className="phone-layer">
      <section className="business-phone" aria-label="Business phone">
        <div className="phone-statusbar">
          <span>20:08</span>
          <i />
          <span>● ▰</span>
        </div>
        <header className="phone-app-header">
          <div>
            <span>AFTER HOURS</span>
            <h2>{apps.find((a) => a.id === app)?.label}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close phone"
            onClick={() => useGame.setState({ phone: false })}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="phone-balance">
          <Icon name="bank" size={15} /> Your till <b>{moneyText(money)}</b>
        </div>
        <div className="phone-scroll">
          {app === "Supply" ? (
            <SupplyShop />
          ) : app === "Equipment" ? (
            <EquipmentShop />
          ) : app === "Bank" ? (
            <Bank />
          ) : app === "Café" ? (
            <Manager />
          ) : (
            <CafeGram />
          )}
        </div>
        <nav className="phone-apps">
          {apps.map((a) => (
            <button
              key={a.id}
              className={app === a.id ? "active" : ""}
              aria-label={a.label}
              onClick={() => useGame.setState({ phoneApp: a.id })}
            >
              <Icon name={a.icon} size={19} />
              <span>
                {a.id === "CafeGram"
                  ? "Social"
                  : a.id === "Café"
                    ? "Manager"
                    : a.id}
              </span>
            </button>
          ))}
        </nav>
        <div className="phone-home-indicator" />
      </section>
    </div>
  );
}
