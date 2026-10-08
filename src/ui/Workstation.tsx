import { useGame } from "../store/game";
import { recipes, recipeById, customerById } from "../data/content";
import { roasts, tampNeedle, milkTemperature } from "../game/craft";
import type { BrewStage } from "../game/craft";
import { sellingPrice, ingredientCost } from "../game/business";
import { Icon } from "./Icon";

const lessons: Record<BrewStage, [string, string, string]> = {
  empty: [
    "Start with fresh beans.",
    "Our house recipe starts at 18g in, 36g out. Keep one variable steady while you learn.",
    "Grind the beans",
  ],
  grinding: [
    "Listen to the grinder.",
    "A fine, even grind gives water resistance. Too coarse flows quickly; too fine can choke the shot.",
    "Grinding…",
  ],
  dosed: [
    "Make an even bed.",
    "Break up clumps and spread the grounds to the edges. This helps water travel evenly through the puck.",
    "Distribute the grounds",
  ],
  distributed: [
    "Tamp level and steady.",
    "A flat puck matters more than extreme force. Guided mode helps you apply an even tamp.",
    "Tamp the coffee",
  ],
  tamping: [
    "Find a level press.",
    "Press again when the needle enters the green band. This timing exercise represents a level, consistent tamp.",
    "Finish the tamp",
  ],
  locked: [
    "Lock in. Warm the cup.",
    "A clean rim seals the portafilter. A warm cup preserves the coffee’s temperature.",
    "Lock portafilter & place cup",
  ],
  placed: [
    "Watch the dose and yield.",
    "Aim for about 1:2 by mass. 18g dry coffee → 36g espresso. Time helps you judge the grind.",
    "Start extraction",
  ],
  extracting: [
    "Follow the flow.",
    "Coffee time runs 5× faster here. Guided mode stops at 1:2; hands-on mode lets you stop the shot yourself.",
    "Stop the shot",
  ],
  purge: [
    "Purge before you steam.",
    "Clear condensed water from the wand before it touches your cold milk. Use a clean pitcher.",
    "Purge the steam wand",
  ],
  milk: [
    "A little air. Then a whirlpool.",
    "Keep the tip near the surface briefly to add air, then deeper to swirl. Hold to heat; release around 55–65°C.",
    "Hold to texture milk",
  ],
  steaming: [
    "Listen for a soft hiss.",
    "First stretch, then swirl. The green band is warm and sweet. Too much heat dulls sweetness and foam.",
    "Release in the green band",
  ],
  pour: [
    "Pour low, slow and steady.",
    "Start higher to integrate milk. Lower the pitcher near the surface to lay a pattern. Choose your signature.",
    "Pour the milk",
  ],
  foam: [
    "A soft cap of microfoam.",
    "Cappuccino has a thicker foam cap. Fine bubbles feel silky; big bubbles feel airy and dry.",
    "Finish the cappuccino",
  ],
  water: [
    "Open up the espresso.",
    "For this café’s Americano, add 90ml hot water to your double shot. The ratio is a preference, not a rule.",
    "Add hot water",
  ],
  ready: [
    "Taste what you learned.",
    "Each cup is a small experiment. Check the feedback, then change one variable on your next shot.",
    "Take to the tray",
  ],
  cleaning: [
    "A clean bar, a sweeter cup.",
    "Flush the group, wipe the wand and clear the drip tray. Good coffee starts with clean equipment.",
    "Cleaning…",
  ],
};
export function Workstation() {
  const s = useGame();
  const b = s.brew;
  const r = recipeById(b.recipe);
  const next = s.visitors.find((v) => v.phase === "waiting" && !v.paid);
  const instruction = lessons[b.stage];
  const stepIndex = ["empty", "grinding", "dosed"].includes(b.stage)
    ? 0
    : ["distributed", "tamping", "locked"].includes(b.stage)
      ? 1
      : ["placed", "extracting"].includes(b.stage)
        ? 2
        : ["purge", "milk", "steaming", "water"].includes(b.stage)
          ? 3
          : 4;
  const temper = milkTemperature(b.milk);
  const price = sellingPrice(b.recipe, s.business.pricing);
  const cost = ingredientCost(b.recipe, b.dose);
  return (
    <div className="workstation-ui craft-ui">
      <button className="back-control" onClick={s.back}>
        <Icon name="back" size={16} />
        <kbd>Q</kbd> Back to your café
      </button>
      <div className="workstation-caption">
        <span className="eyebrow">
          {b.practice ? "THE BARISTA LAB · CLOCK PAUSED" : "THE COFFEE RITUAL"}
        </span>
        <h2>
          {b.practice
            ? "Room to experiment."
            : "Craft your little masterpiece."}
        </h2>
        <p>
          {b.practice
            ? "All recipes. Free supplies. Learn one thing at a time."
            : "A better cup. A familiar face. A café of your own."}
        </p>
      </div>
      <section
        className="brew-panel craft-panel"
        aria-label="Coffee workstation"
      >
        <div className="brew-panel-heading">
          <Icon name="coffee" size={25} />
          <span className="eyebrow">
            {b.practice ? "PRACTICE · NO SUPPLIES USED" : "AT THE ESPRESSO BAR"}
          </span>
          <button
            className="text-button"
            onClick={() =>
              useGame.setState({
                managementOpen: true,
                managementTab: "journal",
              })
            }
          >
            Recipe book
          </button>
        </div>
        <div className="recipe-tabs">
          {recipes.map((recipe, i) => (
            <button
              key={recipe.id}
              className={b.recipe === recipe.id ? "active" : ""}
              disabled={
                (!s.unlocked.includes(recipe.id) && !b.practice) ||
                b.stage !== "empty"
              }
              onClick={() => s.selectRecipe(recipe.id)}
            >
              <span>{recipe.name}</span>
              {!s.unlocked.includes(recipe.id) && !b.practice && (
                <small>{[0, 1, 3, 8, 14][i]} cups to unlock</small>
              )}
            </button>
          ))}
        </div>
        <div className="craft-title">
          <h3>{r.name}</h3>
          <label>
            <input
              type="checkbox"
              checked={s.business.guided}
              onChange={(e) => s.setBusiness({ guided: e.target.checked })}
            />{" "}
            Guided
          </label>
        </div>
        <p className="recipe-note">
          {r.note}{" "}
          {r.id === "flatwhite"
            ? "Use about 100ml milk with a thin foam layer."
            : r.id === "latte"
              ? "Use about 150ml milk with a thin foam layer."
              : r.id === "cappuccino"
                ? "Use about 100ml milk with a thicker foam cap."
                : ""}
        </p>
        <div className="brew-steps">
          {[
            "Grind",
            "Prepare",
            "Extract",
            r.milk ? "Milk" : "Finish",
            "Taste",
          ].map((step, i) => (
            <div
              key={step}
              className={
                i < stepIndex ? "done" : i === stepIndex ? "current" : ""
              }
            >
              <span>
                {i < stepIndex ? <Icon name="check" size={11} /> : i + 1}
              </span>
              <small>{step}</small>
            </div>
          ))}
        </div>
        <div className="brew-instruction" aria-live="polite">
          <h4>{instruction[0]}</h4>
          <p>{instruction[1]}</p>
        </div>
        {b.stage === "empty" && (
          <>
            <div className="bean-choice">
              <label>
                Beans
                <select
                  aria-label="Coffee beans"
                  value={b.roast}
                  onChange={(e) => {
                    const roast = e.target.value as keyof typeof roasts;
                    s.configureBrew({ roast, grind: roasts[roast].grind });
                  }}
                >
                  {Object.entries(roasts).map(([id, roast]) => (
                    <option value={id} key={id}>
                      {roast.name}
                    </option>
                  ))}
                </select>
              </label>
              <small>{roasts[b.roast].notes}</small>
            </div>
            <details className="dial-controls">
              <summary>
                Dial in your shot{" "}
                <span>
                  {b.dose}g · grind {b.grind}
                </span>
              </summary>
              <label>
                Grind <b>{b.grind} / 9</b>
                <input
                  aria-label="Grind setting"
                  type="range"
                  min="1"
                  max="9"
                  step="1"
                  value={b.grind}
                  onChange={(e) => s.configureBrew({ grind: +e.target.value })}
                />
                <small>
                  Fine ← → Coarse · starting point {roasts[b.roast].grind}
                </small>
              </label>
              <label>
                Dose <b>{b.dose}g</b>
                <input
                  aria-label="Coffee dose"
                  type="range"
                  min="16"
                  max="22"
                  step=".5"
                  value={b.dose}
                  onChange={(e) => s.configureBrew({ dose: +e.target.value })}
                />
                <small>
                  Target yield {(b.dose * 2).toFixed(0)}g · change one variable
                  at a time
                </small>
              </label>
            </details>
          </>
        )}
        {b.stage === "grinding" && (
          <div className="craft-gauge">
            <div className="progress">
              <i style={{ width: `${b.progress * 100}%` }} />
            </div>
            <span>
              {b.ground.toFixed(1)}g / {b.dose}g · freshly ground
            </span>
          </div>
        )}
        {b.stage === "tamping" && (
          <div className="craft-gauge tamp-gauge">
            <div className="progress">
              <span
                className="target-zone"
                style={{ left: "70%", width: "30%" }}
              />
              <i style={{ width: `${tampNeedle(b.tampTime)}%` }} />
            </div>
            <span>Uneven ← → Level & consistent</span>
          </div>
        )}
        {[
          "placed",
          "extracting",
          "purge",
          "milk",
          "steaming",
          "pour",
          "foam",
          "water",
          "ready",
        ].includes(b.stage) && (
          <div className="shot-readout">
            <div>
              <b>
                {b.dose.toFixed(1)}
                <small>g</small>
              </b>
              <span>Dose in</span>
            </div>
            <div>
              <b>
                {b.yield.toFixed(1)}
                <small>g</small>
              </b>
              <span>Yield out</span>
            </div>
            <div>
              <b>
                {b.shotTime.toFixed(0)}
                <small>s</small>
              </b>
              <span>Shot time</span>
            </div>
          </div>
        )}
        {b.stage === "extracting" && (
          <div className="craft-gauge">
            <div className="progress">
              <i style={{ width: `${b.progress * 100}%` }} />
            </div>
            <span>
              Target {b.dose * 2}g · about {roasts[b.roast].seconds}s for these
              beans
            </span>
          </div>
        )}
        {["milk", "steaming"].includes(b.stage) && (
          <div className="craft-gauge temperature-gauge">
            <div className="progress">
              <span
                className="target-zone"
                style={{ left: "63.6%", width: "18.2%" }}
              />
              <i style={{ width: `${b.milk * 100}%` }} />
            </div>
            <span>
              <b>{temper}°C</b> ·{" "}
              {temper < 32
                ? "Add a little air"
                : temper < 55
                  ? "Swirl into a smooth whirlpool"
                  : temper <= 65
                    ? "Silky & sweet · release now"
                    : "Too hot · release earlier next time"}
            </span>
          </div>
        )}
        {["pour", "foam"].includes(b.stage) && (
          <div className="pour-controls">
            <div className="art-choices">
              {(["heart", "rosetta", "none"] as const).map((art) => (
                <button
                  className={b.art === art ? "selected" : ""}
                  key={art}
                  onClick={() => s.configureBrew({ art })}
                >
                  {art === "heart"
                    ? "♡ Heart"
                    : art === "rosetta"
                      ? "❧ Rosetta"
                      : "Simple"}
                </button>
              ))}
            </div>
            <label>
              Pour control{" "}
              <b>
                {b.pour < 35
                  ? "Too hesitant"
                  : b.pour > 80
                    ? "Too fast"
                    : "Low & steady"}
              </b>
              <input
                aria-label="Pour control"
                type="range"
                min="0"
                max="100"
                value={b.pour}
                onChange={(e) => s.configureBrew({ pour: +e.target.value })}
              />
            </label>
          </div>
        )}
        {b.stage === "ready" && (
          <div className="tasting-card">
            <div>
              <Icon name="star" size={17} />
              <b>
                {b.score}/100 ·{" "}
                {b.quality === "perfect"
                  ? "Beautifully balanced"
                  : "A cup to learn from"}
              </b>
            </div>
            <p>{b.feedback}</p>
            {!b.practice && (
              <small>
                ${price.toFixed(2)} menu price − ${cost.toFixed(2)} ingredients
                = ${(price - cost).toFixed(2)} contribution before tips &
                overhead
              </small>
            )}
          </div>
        )}
        {["milk", "steaming"].includes(b.stage) ? (
          <button
            className={`primary-button brew-action hold-button ${b.stage === "steaming" ? "held" : ""}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              s.steam(true);
            }}
            onPointerUp={() => s.steam(false)}
            onPointerCancel={() => s.steam(false)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !e.repeat)
                s.steam(true);
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " ") s.steam(false);
            }}
          >
            <Icon name="rain" />
            {instruction[2]} <kbd>Space</kbd>
          </button>
        ) : (
          <button
            className="primary-button brew-action"
            disabled={["grinding", "cleaning"].includes(b.stage)}
            onClick={s.craftStep}
          >
            <Icon name={b.stage === "ready" ? "check" : "coffee"} />
            {b.stage === "ready" && b.practice
              ? "Log practice cup"
              : instruction[2]}{" "}
            <kbd>E</kbd>
          </button>
        )}
        {next && !b.practice && (
          <div className="waiting-for">
            <span
              className="avatar"
              style={{ background: customerById(next.id).palette }}
            >
              {customerById(next.id).name[0]}
            </span>
            <div>
              <small>
                Next order{next.pastry ? " · with a croissant" : ""}
              </small>
              <b>
                {customerById(next.id).name} · {recipeById(next.recipe).name}
              </b>
            </div>
          </div>
        )}
        <div className="craft-footer">
          {b.stage === "empty" ? (
            <button className="text-button" onClick={s.cleanBar}>
              Flush & wipe · bar {s.business.cleanliness}% clean
            </button>
          ) : (
            <button
              className="text-button"
              disabled={b.stage === "cleaning"}
              onClick={s.restartBrew}
            >
              Restart this cup
            </button>
          )}
          <small>
            {b.practice
              ? "Experiment freely"
              : `${Math.floor(s.business.beans)} shots · ${s.business.milk} pitchers left`}
          </small>
        </div>
      </section>
    </div>
  );
}
