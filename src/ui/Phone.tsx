import { useEffect, useState } from "react";
import { useGame, styleScores, familiarityLabel } from "../store/game";
import { customers, customerById, upgrades, clockText } from "../data/content";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { audio } from "../game/audio";
import { shiftProfit } from "../game/business";
const apps: { name: "CafeGram" | "Bank" | "Café" | "Shop"; icon: IconName }[] =
  [
    { name: "CafeGram", icon: "camera" },
    { name: "Bank", icon: "bank" },
    { name: "Café", icon: "store" },
    { name: "Shop", icon: "shop" },
  ];
export function Phone() {
  const open = useGame((s) => s.phone);
  const app = useGame((s) => s.phoneApp);
  const time = useGame((s) => s.elapsed);
  const [snapshot, setSnapshot] = useState("");
  useEffect(() => {
    if (!open) return;
    try {
      const source = document.querySelector("canvas");
      if (!source) return;
      const target = document.createElement("canvas");
      target.width = 560;
      target.height = 350;
      target.getContext("2d")?.drawImage(source, 0, 0, 560, 350);
      setSnapshot(target.toDataURL("image/jpeg", 0.8));
    } catch {
      /* Snapshots are decorative; social posts stay readable. */
    }
  }, [open]);
  return (
    <aside
      className={`phone ${open ? "is-open" : ""}`}
      aria-label="Player phone"
      aria-hidden={!open}
      inert={!open}
    >
      <div className="phone-hardware">
        <div className="phone-notch" />
        <div className="phone-status">
          <span>{clockText(time).split(" ")[0]}</span>
          <span>••• ▰</span>
        </div>
        <div className="phone-heading">
          <span className="eyebrow">YOUR LITTLE WORLD</span>
          <button
            className="icon-button"
            aria-label="Close phone"
            onClick={() => useGame.getState().togglePhone()}
          >
            <Icon name="close" />
          </button>
        </div>
        <nav className="phone-apps" aria-label="Phone apps">
          {apps.map((a) => (
            <button
              key={a.name}
              className={app === a.name ? "active" : ""}
              onClick={() => {
                useGame.setState({ phoneApp: a.name });
                audio.play("click");
              }}
            >
              <Icon name={a.icon} />
              <span>{a.name}</span>
            </button>
          ))}
        </nav>
        <div className="phone-body">
          {app === "CafeGram" ? (
            <CafeGram snapshot={snapshot} />
          ) : app === "Bank" ? (
            <Bank />
          ) : app === "Café" ? (
            <CafeStats />
          ) : (
            <Shop />
          )}
        </div>
        <div className="phone-home" />
      </div>
    </aside>
  );
}
function CafeGram({ snapshot }: { snapshot: string }) {
  const posts = useGame((s) => s.posts);
  const followers = useGame((s) => s.followers);
  const [liked, setLiked] = useState<number[]>([]);
  return (
    <>
      <div className="app-title">
        <h2>
          CafeGram<span>✦</span>
        </h2>
        <p>A little corner of the internet.</p>
      </div>
      <div className="social-profile">
        <div className="brand-avatar">
          <Icon name="coffee" size={25} />
        </div>
        <div>
          <b>@afterhours.cafe</b>
          <span>{followers.toLocaleString()} followers · open late</span>
        </div>
      </div>
      {!posts.length ? (
        <div className="phone-empty">
          <Icon name="camera" size={34} />
          <h3>The first page is yours.</h3>
          <p>
            Serve a little comfort. Your customers will share the moments they
            love.
          </p>
        </div>
      ) : (
        posts.map((post) => {
          const customer = customerById(post.customer);
          const heart = liked.includes(post.id);
          return (
            <article className="social-post" key={post.id}>
              <div className="post-author">
                <span
                  className="avatar"
                  style={{ background: customer.palette }}
                >
                  {customer.name[0]}
                </span>
                <div>
                  <b>@{customer.handle}</b>
                  <span>{post.time} · After Hours Café</span>
                </div>
                <span className="post-dots">···</span>
              </div>
              <div className={`post-photo ${post.theme}`}>
                {snapshot && (
                  <img
                    src={snapshot}
                    alt="A snapshot of the warm café on a rainy evening"
                  />
                )}
                <span>
                  <Icon
                    name={
                      post.theme === "cat"
                        ? "heart"
                        : post.theme === "rain"
                          ? "rain"
                          : "coffee"
                    }
                    size={15}
                  />{" "}
                  {post.theme === "cat"
                    ? "Milo’s corner"
                    : post.theme === "rain"
                      ? "Rainy night rituals"
                      : "Made with care"}
                </span>
              </div>
              <div className="post-like">
                <button
                  aria-label={heart ? "Unlike post" : "Like post"}
                  className={heart ? "liked" : ""}
                  onClick={() => {
                    setLiked(
                      heart
                        ? liked.filter((id) => id !== post.id)
                        : [...liked, post.id],
                    );
                    audio.play("click");
                  }}
                >
                  <Icon name="heart" />
                </button>
                <b>{(post.likes + (heart ? 1 : 0)).toLocaleString()} likes</b>
              </div>
              <p>{post.text}</p>
            </article>
          );
        })
      )}
    </>
  );
}
function Bank() {
  const business = useGame((s) => s.business);
  const money = useGame((s) => s.money);
  const revenue = useGame((s) => s.revenue);
  const lifetime = useGame((s) => s.lifetimeEarned);
  const purchased = useGame((s) => s.purchased);
  const shift = useGame((s) => s.shift);
  const spent = upgrades
    .filter((u) => purchased.includes(u.id))
    .reduce((sum, u) => sum + u.price, 0);
  return (
    <>
      <div className="app-title">
        <h2>Your balance</h2>
        <p>Little cups. Bigger dreams.</p>
      </div>
      <div className="bank-card">
        <span>AFTER HOURS · BUSINESS ACCOUNT</span>
        <h3>${money.toFixed(2)}</h3>
        <small>Available balance</small>
        <Icon name="coffee" size={28} />
      </div>
      <div className="stat-pair">
        <div>
          <span>Tonight’s income</span>
          <b>+${revenue.toFixed(2)}</b>
        </div>
        <div>
          <span>All-time income</span>
          <b>${lifetime.toFixed(2)}</b>
        </div>
      </div>
      <div className="ownership-card">
        <Icon name="store" />
        <span className="eyebrow">ONE DAY, ALL YOURS</span>
        <h3>{business.owned ? "The keys are yours." : "Own your café"}</h3>
        <p>
          {business.owned
            ? "No more rent. Only $3 utilities per evening."
            : "A $500 dream. Keep your profits, then buy the keys."}
        </p>
        <div className="progress">
          <i style={{ width: `${Math.min(100, (money / 500) * 100)}%` }} />
        </div>
        <b>
          ${money.toFixed(0)} <span>/ $500</span>
        </b>
      </div>
      {!business.owned && (
        <button
          className="primary-button compact"
          disabled={money < 500}
          onClick={() => useGame.getState().buyCafe()}
        >
          Buy the café · $500
        </button>
      )}
      <div className="stat-pair">
        <div>
          <span>Operating profit</span>
          <b>${shiftProfit(revenue, business).toFixed(2)}</b>
        </div>
        <div>
          <span>Ingredients used</span>
          <b>${business.ingredientCost.toFixed(2)}</b>
        </div>
      </div>
      <button
        className="secondary-button compact"
        onClick={() =>
          useGame.setState({
            phone: false,
            managementOpen: true,
            managementTab: "today",
          })
        }
      >
        Open the business desk
      </button>
      <h4 className="small-heading">YOUR LEDGER</h4>
      <div className="ledger-row">
        <Icon name="coffee" />
        <div>
          <b>Evening {shift}</b>
          <small>Coffee & little thank-you tips</small>
        </div>
        <strong>+${revenue.toFixed(2)}</strong>
      </div>
      <div className="ledger-row">
        <Icon name="shop" />
        <div>
          <b>Making it yours</b>
          <small>Furniture & upgrades, all time</small>
        </div>
        <strong>−${spent.toFixed(2)}</strong>
      </div>
    </>
  );
}
function CafeStats() {
  const reputation = useGame((s) => s.reputation);
  const served = useGame((s) => s.served);
  const purchased = useGame((s) => s.purchased);
  const familiarity = useGame((s) => s.familiarity);
  const styles = styleScores(purchased);
  return (
    <>
      <div className="app-title">
        <h2>Our little café</h2>
        <p>Make coffee. Build a place. Know your people.</p>
      </div>
      <div className="cafe-stat-banner">
        <div>
          <Icon name="star" />
          <b>{reputation}</b>
          <span>Reputation / 100</span>
        </div>
        <div>
          <Icon name="users" />
          <b>{served}</b>
          <span>Served tonight</span>
        </div>
      </div>
      <h4 className="small-heading">THE FEEL OF THE PLACE</h4>
      <div className="styles">
        {Object.entries(styles).map(([style, value]) => (
          <div key={style}>
            <span>{style}</span>
            <div className="progress">
              <i style={{ width: `${Math.min(100, value)}%` }} />
            </div>
            <b>{value}</b>
          </div>
        ))}
      </div>
      <h4 className="small-heading">YOUR PEOPLE</h4>
      <div className="regulars">
        {customers.map((c) => (
          <div className="regular-row" key={c.id}>
            <span className="avatar" style={{ background: c.palette }}>
              {c.name[0]}
            </span>
            <div>
              <b>{c.name}</b>
              <small>{c.tag}</small>
            </div>
            <span
              className={`familiarity ${(familiarity[c.id] ?? 0) >= 3 ? "regular" : ""}`}
            >
              {familiarityLabel(familiarity[c.id] ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
function Shop() {
  const money = useGame((s) => s.money);
  const purchased = useGame((s) => s.purchased);
  const earned = useGame((s) => s.lifetimeEarned);
  const [category, setCategory] = useState("All");
  return (
    <>
      <div className="app-title">
        <h2>A place of your own</h2>
        <p>Small changes. A little more you.</p>
      </div>
      <div className="shop-balance">
        <Icon name="bank" />
        <span>${money.toFixed(2)} available</span>
      </div>
      <div className="shop-filters">
        {["All", "Décor", "Company"].map((label) => (
          <button
            key={label}
            className={category === label ? "active" : ""}
            onClick={() => setCategory(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="shop-grid">
        {upgrades
          .filter(
            (u) =>
              category === "All" ||
              (category === "Company" ? u.id === "mochi" : u.id !== "mochi"),
          )
          .map((u) => {
            const owned = purchased.includes(u.id);
            const locked = !!u.earnings && earned < u.earnings;
            return (
              <article
                className={`shop-item ${owned ? "owned" : ""}`}
                key={u.id}
              >
                <div className={`shop-illustration ${u.icon}`}>
                  <Icon name={u.icon as IconName} size={34} />
                  {owned && (
                    <span>
                      <Icon name="check" size={13} />
                    </span>
                  )}
                </div>
                <h3>{u.name}</h3>
                <p>{u.description}</p>
                <span className="style-tag">
                  +{u.points} {u.style}
                </span>
                <button
                  disabled={owned || locked || money < u.price}
                  onClick={() => useGame.getState().buy(u.id)}
                >
                  {owned ? (
                    <>
                      <Icon name="check" size={13} /> At home
                    </>
                  ) : locked ? (
                    `Earn $${u.earnings} to unlock`
                  ) : (
                    `$${u.price} · Bring home`
                  )}
                </button>
              </article>
            );
          })}
      </div>
      <p className="phone-footnote">Every piece finds its own perfect spot.</p>
    </>
  );
}
