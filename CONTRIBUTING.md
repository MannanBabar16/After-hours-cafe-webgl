# Working on After Hours Café

Use Node.js 22.12 or newer. No API keys or environment variables are needed.

```sh
npm ci
npm run dev
```

Run `npm test`, `npm run typecheck`, and `npm run build` before submitting changes. Play the affected flow with `npm run preview` so production behavior is checked too. Include a desktop screenshot and narrow-layout check for UI changes.

Protect actual game invariants: conservation of box/container quantities, no stock creation on upgrade, partial receipts paid once, robot reservations, quoted menu prices, quality discounts, and overhead applied once. Persistence changes should check old saves, malformed values, active production, and a second evening. Avoid tests that merely mirror UI labels.

The backtick development panel changes the real simulation and offers stock, money, indoor/drive customers, bakery, current oven completion, rain, equipment, camera and closing fixtures. It is excluded from production. Fixtures shorten a targeted test; record them when reporting a browser playthrough.

See [Architecture](docs/ARCHITECTURE.md), [Game design](GAME_DESIGN.md), and [Validation](VALIDATION.md). Central balancing data is in `src/data/operations.ts`. Preserve one shared player, inventory, order service, and till across both cameras and customer channels.

GitHub Actions installs locked dependencies, tests game rules, builds, and uploads `dist/`. Account-level Actions restrictions can prevent a cloud job from starting even when these commands pass locally. Serve a downloaded production artifact over HTTP to play.
