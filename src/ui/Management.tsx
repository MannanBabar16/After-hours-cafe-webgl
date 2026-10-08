import { useState } from "react";
import { useGame } from "../store/game";
import { recipes, SHIFT_SECONDS } from "../data/content";
import {
  baristaTitle,
  dailyGoals,
  ingredientCost,
  level,
  overhead,
  sellingPrice,
  shiftProfit,
  supplies,
  needsCredit,
} from "../game/business";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { audio } from "../game/audio";
const tabs: {
  id: "today" | "supplies" | "menu" | "studio" | "journal";
  name: string;
  icon: IconName;
}[] = [
  { id: "today", name: "Tonight", icon: "moon" },
  { id: "supplies", name: "Supplies", icon: "shop" },
  { id: "menu", name: "The menu", icon: "coffee" },
  { id: "studio", name: "Make it yours", icon: "plant" },
  { id: "journal", name: "Barista journal", icon: "book" },
];
export function Management() {
  const s = useGame();
  const b = s.business;
  const [closing, setClosing] = useState(false);
  const [name, setName] = useState(b.name);
  return (
    <div className="modal-backdrop management-backdrop">
      <section
        className="cafe-desk"
        aria-label="Café management desk"
        role="dialog"
        aria-modal="true"
      >
        <aside className="desk-sidebar">
          <div className="desk-logo">
            <Icon name="coffee" size={30} />
            <span>YOUR CAFÉ DESK</span>
            <h2>{b.name}</h2>
            <small>Evening {s.shift} · clock paused</small>
          </div>
          <nav aria-label="Café desk sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={s.managementTab === tab.id ? "active" : ""}
                onClick={() => {
                  useGame.setState({ managementTab: tab.id });
                  audio.play("paper");
                }}
              >
                <Icon name={tab.icon} size={17} />
                {tab.name}
              </button>
            ))}
          </nav>
          <div className="desk-balance">
            <span>AVAILABLE CASH</span>
            <b>${s.money.toFixed(2)}</b>
            <small>Sales build your next evening.</small>
          </div>
        </aside>
        <div className="desk-main">
          <header className="desk-header">
            <div>
              <span className="eyebrow">ONE GOOD CUP AT A TIME</span>
              <h2>{tabs.find((t) => t.id === s.managementTab)?.name}</h2>
            </div>
            <button
              className="icon-button"
              aria-label="Close café desk"
              onClick={() => useGame.setState({ managementOpen: false })}
            >
              <Icon name="close" />
            </button>
          </header>
          <div className="desk-content">
            {s.managementTab === "today" && (
              <>
                <div className="barista-banner">
                  <span className="level-badge">{level(b.xp)}</span>
                  <div>
                    <span className="eyebrow">BARISTA LEVEL {level(b.xp)}</span>
                    <h3>{baristaTitle(b.xp)}</h3>
                    <div className="progress">
                      <i style={{ width: `${((b.xp % 150) / 150) * 100}%` }} />
                    </div>
                    <small>
                      {b.xp % 150} / 150 XP to the next level ·{" "}
                      {b.lifetimeServed} lifetime cups
                    </small>
                  </div>
                  <Icon name="star" size={30} />
                </div>
                <div className="business-metrics">
                  <div>
                    <span>Sales & tips</span>
                    <b>${s.revenue.toFixed(2)}</b>
                    <small>{s.served} guests served</small>
                  </div>
                  <div>
                    <span>Operating profit</span>
                    <b
                      className={
                        shiftProfit(s.revenue, b) >= 0 ? "positive" : "negative"
                      }
                    >
                      ${shiftProfit(s.revenue, b).toFixed(2)}
                    </b>
                    <small>After ingredients & nightly costs</small>
                  </div>
                  <div>
                    <span>Goal rewards</span>
                    <b>+${b.rewards.toFixed(2)}</b>
                    <small>Extra cash, separate from sales</small>
                  </div>
                </div>
                <div className="desk-ledger">
                  <div>
                    <span>
                      Ingredients used{" "}
                      <small>
                        Brewed drinks, discarded cups & served pastries
                      </small>
                    </span>
                    <b>−${b.ingredientCost.toFixed(2)}</b>
                  </div>
                  <div>
                    <span>
                      {b.owned
                        ? "Your café · utilities only"
                        : "Rent $5 + utilities $3"}{" "}
                      <small>
                        {b.overheadPaid
                          ? "Paid at closing"
                          : "Reserved; paid at closing"}
                      </small>
                    </span>
                    <b>−${overhead(b).toFixed(2)}</b>
                  </div>
                  <div>
                    <span>Tips from your guests</span>
                    <b>+${b.tips.toFixed(2)}</b>
                  </div>
                </div>
                <h3 className="desk-section-title">Little goals for tonight</h3>
                <div className="daily-goals">
                  {dailyGoals(s.served, s.perfect, s.revenue).map((goal) => (
                    <article
                      key={goal.id}
                      className={b.claimed.includes(goal.id) ? "complete" : ""}
                    >
                      <div>
                        <Icon
                          name={
                            b.claimed.includes(goal.id) ? "check" : "sparkle"
                          }
                          size={18}
                        />
                        <b>{goal.title}</b>
                        <span>+${goal.reward}</span>
                      </div>
                      <p>
                        {goal.description} ·{" "}
                        {Math.min(goal.value, goal.target).toFixed(
                          goal.id === "trade" ? 2 : 0,
                        )}{" "}
                        / {goal.target}
                      </p>
                      <div className="progress">
                        <i
                          style={{
                            width: `${Math.min(100, (goal.value / goal.target) * 100)}%`,
                          }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
                <div className="desk-actions">
                  <button className="primary-button" onClick={s.startPractice}>
                    <Icon name="coffee" size={17} /> Visit the practice bar
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => setClosing(!closing)}
                  >
                    Close early
                  </button>
                </div>
                {closing && (
                  <div className="close-evening-card">
                    <p>
                      Close the door and finish this evening. Unserved guests
                      head home; tonight’s ${overhead(b)} operating costs are
                      paid.
                    </p>
                    <button
                      className="primary-button compact"
                      onClick={() => {
                        s.restartBrew();
                        useGame.setState({
                          elapsed: SHIFT_SECONDS,
                          managementOpen: false,
                          workstation: false,
                          tray: null,
                        });
                      }}
                    >
                      Finish this evening
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setClosing(false)}
                    >
                      Keep brewing
                    </button>
                  </div>
                )}
              </>
            )}
            {s.managementTab === "supplies" && (
              <>
                <p className="desk-intro">
                  A stocked shelf keeps the night moving. Starter supplies are
                  included; deliveries spend cash. Ingredients become costs when
                  you use them.
                </p>
                <div className="supply-cards">
                  {Object.entries(supplies).map(([id, item]) => {
                    const key = id as keyof typeof supplies;
                    return (
                      <article key={id}>
                        <Icon
                          name={
                            id === "beans"
                              ? "coffee"
                              : id === "milk"
                                ? "rain"
                                : "shop"
                          }
                          size={25}
                        />
                        <h3>{item.name}</h3>
                        <b>
                          {Math.floor(b[key])} <small>{item.unit} left</small>
                        </b>
                        <div className="progress">
                          <i
                            style={{
                              width: `${Math.min(100, (b[key] / 20) * 100)}%`,
                            }}
                          />
                        </div>
                        <p>
                          +{item.amount} {item.unit} · ${item.price}
                        </p>
                        <button
                          className="primary-button compact"
                          disabled={
                            b[key] > 90 ||
                            (s.money < item.price && !needsCredit(b, key))
                          }
                          onClick={() => s.restock(key)}
                        >
                          {s.money < item.price && needsCredit(b, key)
                            ? "Use supplier credit"
                            : "Order delivery"}
                        </button>
                      </article>
                    );
                  })}
                </div>
                <p className="desk-note">
                  If an ingredient runs out and cash is low, your supplier
                  extends interest-free credit. Your balance can go below zero;
                  the next sales pay it back.
                </p>
                <div className="care-card">
                  <div>
                    <Icon name="sparkle" />
                    <h3>A tidy place to return to</h3>
                    <p>
                      {b.dirtySeats.length} tables to clear · bar{" "}
                      {b.cleanliness}% clean. Untidy tables gently slow new
                      arrivals. Mochi clears a table every twelve seconds.
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    disabled={!b.dirtySeats.length}
                    onClick={s.busTables}
                  >
                    Clear & wipe tables
                  </button>
                </div>
                <div className="desk-ledger">
                  <div>
                    <span>Cash spent on deliveries tonight</span>
                    <b>${b.supplySpend.toFixed(2)}</b>
                  </div>
                  <div>
                    <span>Ingredients used tonight</span>
                    <b>${b.ingredientCost.toFixed(2)}</b>
                  </div>
                </div>
              </>
            )}
            {s.managementTab === "menu" && (
              <>
                <p className="desk-intro">
                  Choose the pace of your café. Friendly prices bring guests
                  sooner. Premium prices have better margins, but guests expect
                  a beautiful cup. Existing orders keep their quoted price.
                </p>
                <div className="pricing-options">
                  {(["friendly", "fair", "premium"] as const).map((price) => (
                    <button
                      className={b.pricing === price ? "selected" : ""}
                      key={price}
                      onClick={() => s.setBusiness({ pricing: price })}
                    >
                      <b>
                        {price === "friendly"
                          ? "Friendly"
                          : price === "fair"
                            ? "Neighborhood"
                            : "Premium"}
                      </b>
                      <small>
                        {price === "friendly"
                          ? "90% price · faster arrivals"
                          : price === "fair"
                            ? "100% price · steady pace"
                            : "125% price · slower arrivals"}
                      </small>
                    </button>
                  ))}
                </div>
                <div className="menu-table">
                  <div className="menu-table-head">
                    <span>Recipe</span>
                    <span>Price</span>
                    <span>Cost</span>
                    <span>Margin*</span>
                  </div>
                  {recipes.map((r, i) => (
                    <div key={r.id}>
                      <span>
                        <b>{r.name}</b>
                        <small>
                          {s.unlocked.includes(r.id)
                            ? "On your menu"
                            : `Unlock after ${[0, 1, 3, 8, 14][i]} cups`}
                        </small>
                      </span>
                      <b>${sellingPrice(r.id, b.pricing).toFixed(2)}</b>
                      <span>${ingredientCost(r.id).toFixed(2)}</span>
                      <b>
                        $
                        {(
                          sellingPrice(r.id, b.pricing) - ingredientCost(r.id)
                        ).toFixed(2)}
                      </b>
                    </div>
                  ))}
                </div>
                <p className="desk-note">
                  *Per cup before tips and operating costs, using an 18g dose.
                  The game uses simplified recipe costs.
                </p>
                <label className="pastry-toggle">
                  <span>
                    <Icon name="shop" />
                    <b>Coffee & a croissant</b>
                    <small>
                      $2.50 sale · $1.00 cost · automatically paired on some new
                      orders
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={b.pastryMenu}
                    onChange={(e) =>
                      s.setBusiness({ pastryMenu: e.target.checked })
                    }
                  />
                </label>
                <p className="desk-note">
                  You keep the coffee ritual. Your pastry shelf handles the
                  pairing. Out of pastries? Guests simply buy their coffee.
                </p>
              </>
            )}
            {s.managementTab === "studio" && (
              <>
                <p className="desk-intro">
                  Give your corner of the city a signature. These personal
                  touches are free. Furniture and equipment investments live in
                  your phone’s Shop.
                </p>
                <label className="studio-name">
                  Name above the door
                  <input
                    aria-label="Café name"
                    value={name}
                    maxLength={28}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <button
                    className="secondary-button compact"
                    onClick={() => s.setBusiness({ name })}
                  >
                    Paint the sign
                  </button>
                </label>
                <h3 className="desk-section-title">Your apron</h3>
                <div className="color-options">
                  {[
                    ["#5b7968", "Sage"],
                    ["#bb7d75", "Terracotta"],
                    ["#536582", "Midnight"],
                    ["#ad945e", "Honey"],
                    ["#423b3e", "Charcoal"],
                  ].map(([color, label]) => (
                    <button
                      key={color}
                      className={b.apron === color ? "selected" : ""}
                      onClick={() => s.setBusiness({ apron: color })}
                    >
                      <i style={{ background: color }} />
                      {label}
                    </button>
                  ))}
                </div>
                <h3 className="desk-section-title">Signature ceramics</h3>
                <div className="color-options">
                  {[
                    ["#ede5d1", "Oat"],
                    ["#8ca497", "Matcha"],
                    ["#c99790", "Rose"],
                    ["#87a4c1", "Rain blue"],
                    ["#61504c", "Espresso"],
                  ].map(([color, label]) => (
                    <button
                      key={color}
                      className={b.cup === color ? "selected" : ""}
                      onClick={() => s.setBusiness({ cup: color })}
                    >
                      <i style={{ background: color }} />
                      {label}
                    </button>
                  ))}
                </div>
                <h3 className="desk-section-title">A mood for your walls</h3>
                <div className="theme-options">
                  {(
                    [
                      ["sage", "Quiet sage", "#d6ccb1"],
                      ["rose", "Rose dusk", "#c9a9a0"],
                      ["midnight", "Midnight blue", "#899eab"],
                    ] as const
                  ).map(([theme, label, color]) => (
                    <button
                      key={theme}
                      className={b.theme === theme ? "selected" : ""}
                      onClick={() => s.setBusiness({ theme })}
                    >
                      <i style={{ background: color }} />
                      <b>{label}</b>
                    </button>
                  ))}
                </div>
                <button
                  className="secondary-button"
                  onClick={() => {
                    useGame.setState({ managementOpen: false });
                    s.togglePhone("Shop");
                  }}
                >
                  Browse furniture & equipment <Icon name="next" size={17} />
                </button>
              </>
            )}
            {s.managementTab === "journal" && (
              <>
                <div className="journal-invite">
                  <div>
                    <Icon name="book" size={28} />
                    <h3>Learn by making.</h3>
                    <p>
                      Practice pauses your café clock, uses free supplies and
                      opens every recipe. Switch off Guided to practice stopping
                      a shot and timing a level tamp.
                    </p>
                  </div>
                  <button className="primary-button" onClick={s.startPractice}>
                    Start a practice session
                  </button>
                </div>
                <div className="recipe-book">
                  {recipes.map((r) => (
                    <article key={r.id}>
                      <div>
                        <h3>{r.name}</h3>
                        <span>
                          {b.best[r.id]
                            ? `Best ${b.best[r.id]}/100`
                            : "A new ritual"}
                        </span>
                      </div>
                      <p>
                        {r.id === "espresso"
                          ? "18g coffee → 36g espresso. Begin around 25–35 seconds, then dial by taste."
                          : r.id === "americano"
                            ? "A double espresso + 90ml hot water in our house recipe. Add more or less water to taste."
                            : r.id === "flatwhite"
                              ? "Double espresso + about 100ml milk. Thin microfoam, small cup, strong coffee character."
                              : r.id === "cappuccino"
                                ? "Double espresso + about 100ml milk. A soft, thicker cap of fine microfoam."
                                : "Double espresso + about 150ml milk. A thin layer of silky microfoam and a gentle finish."}
                      </p>
                    </article>
                  ))}
                </div>
                <details className="coffee-notes">
                  <summary>A small dial-in guide</summary>
                  <p>
                    <b>Fast / sharp?</b> Try a finer grind. <b>Slow / dry?</b>{" "}
                    Try a coarser grind. Keep dose and yield steady so you can
                    judge one change. Distribute evenly and tamp level. These
                    are starting points; roast, equipment and taste change the
                    best recipe.
                  </p>
                  <p>
                    <b>Milk:</b> Add a little air, then create a whirlpool. Aim
                    around 55–65°C for this lesson, wipe and purge the wand
                    after use. Art timing and puck timing are playful
                    abstractions; this café’s recipe numbers vary in real cafés.
                  </p>
                  <p>
                    Inspired by{" "}
                    <a
                      href="https://www.lamarzocco.com/ie/en/using-espresso-brew-ratios/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      La Marzocco’s brew ratios
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://www.breville.com/content/dam/breville/gb/assets/miscellaneous/instruction-manual/espresso/BES875-instruction-manual.pdf"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Breville’s extraction & milk guide
                    </a>
                    .
                  </p>
                </details>
                <h3 className="desk-section-title">Your tasting notebook</h3>
                {!b.journal.length ? (
                  <p className="desk-note">
                    Your completed cups appear here. Make your first small
                    experiment.
                  </p>
                ) : (
                  b.journal.map((entry, i) => (
                    <p className="journal-entry" key={i}>
                      {entry}
                    </p>
                  ))
                )}
              </>
            )}
          </div>
          <footer className="desk-footer">
            <span>
              Progress saves automatically · <kbd>R</kbd> Café desk
            </span>
            <button
              className="secondary-button compact"
              onClick={() => useGame.setState({ managementOpen: false })}
            >
              Back to the night
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}
