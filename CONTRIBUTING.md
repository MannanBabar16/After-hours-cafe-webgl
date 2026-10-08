# Working on After Hours Café

Use Node.js 22.12 or newer. With nvm, run `nvm use`; on Windows, use `nvm install 22` and `nvm use 22` if you use nvm-windows. No environment variables or API keys are needed to play or develop.

```sh
npm ci
npm run dev
```

Keep changes focused on one player experience. Open a feature issue for larger mechanics so progression and UI complexity can be discussed before implementation.

## Before a pull request

```sh
npm test
npm run build
npm run preview
```

Play the affected flow in the compiled preview. UI changes should include a screenshot at a desktop size and a narrow layout check. For financial changes, check cash, ingredient cost, waste, and repeated clicks. For persistence changes, check a reload and an older save with missing fields.

Tests should protect meaningful game rules. Practice must remain free and paused; goal rewards and closing charges must happen once; menu price changes must preserve existing quotes. Prefer changing the rule in `src/game/` or the store before adding presentation logic.

## Where to work

See [Architecture](docs/ARCHITECTURE.md) for the module map. [Game design](GAME_DESIGN.md) explains the learning and pacing decisions. [Validation](VALIDATION.md) records the browser checks and current limitations.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development with hot reload |
| `npm run typecheck` | Strict TypeScript check |
| `npm test` | Game-rule regression tests |
| `npm run test:watch` | Rerun tests while editing |
| `npm run build` | Typecheck and create `dist/` |
| `npm run preview` | Serve the compiled build locally |

GitHub Actions runs the tests and production build on main and pull requests. Successful runs include a downloadable `after-hours-cafe-webgl` build artifact. Extract it and serve the directory over HTTP to play; opening the HTML as a local file will not load the module graph correctly.
