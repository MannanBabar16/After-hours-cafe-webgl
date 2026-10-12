import { useGame } from "../store/game";
import { products, caps } from "../data/operations";
import { Icon } from "./Icon";
export function Workstation() {
  const s = useGame();
  return (
    <section
      className="auto-machine-panel"
      aria-label="Automatic coffee machine"
    >
      <header>
        <span className="eyebrow">BEAN TO CUP / YOUR LITTLE RITUAL</span>
        <button
          className="hud-round"
          aria-label="Leave coffee machine"
          onClick={() => useGame.setState({ workstation: false })}
        >
          <Icon name="close" />
        </button>
      </header>
      <h2>A good cup. Simply.</h2>
      <p>
        The cup is in place. Choose the drink your guest asked for; the machine
        handles the grind, coffee, and milk.
      </p>
      <div className="machine-stock">
        <span>
          <Icon name="coffee" size={16} />
          {s.ops.containers.beans}/{caps(s.ops.levels, "hopper")} beans
        </span>
        <span>
          <Icon name="milk" size={16} />
          {s.ops.containers.milk}/{caps(s.ops.levels, "milkTank")} milk
        </span>
      </div>
      <div className="drink-buttons">
        {s.unlocked.map((id) => (
          <button
            key={id}
            onClick={() => s.startBrew(id)}
            disabled={
              s.ops.machine.stage !== "cup" ||
              s.ops.containers.beans < products[id].beans ||
              s.ops.containers.milk < products[id].milk ||
              s.ops.containers.syrup < products[id].syrup
            }
          >
            <span
              className="drink-icon"
              style={{ background: products[id].color }}
            >
              <Icon name="coffee" size={26} />
            </span>
            <div>
              <b>{products[id].name}</b>
              <small>
                {products[id].beans} beans{" "}
                {products[id].milk ? `· ${products[id].milk} milk` : ""}{" "}
                {products[id].syrup ? "· 1 vanilla" : ""}
              </small>
            </div>
            <Icon name="next" size={16} />
          </button>
        ))}
      </div>
      <div className="recipe-note">
        <Icon name="sparkle" size={17} />
        <p>
          Espresso is short and rich. Americano adds water. Latte uses more
          milk; cappuccino adds a foam finish.
        </p>
      </div>
      <small className="brew-footnote">
        Brews in about 3–6 seconds. You can work elsewhere while it runs.
      </small>
    </section>
  );
}
