# After Hours Café — portable project context

Updated 20 October 2026. This is the useful working context from the original development chat, not a full chat export. Read the current code and Git history if this document later becomes stale.

## Continue on another computer

Install Git and Node.js 22.12 or newer, then:

```sh
git clone https://github.com/MannanBabar16/After-hours-cafe-webgl.git
cd After-hours-cafe-webgl
npm ci
npm run dev
```

Open this repository as the working folder in Codex or another coding assistant. Use this prompt:

> Read AGENTS.md and HANDOFF.md, then inspect the project and relevant design/validation notes. Continue After Hours Café from its current state, preserving the implemented gameplay, vibrant cozy art direction, browser performance, saves and public hosting. My next request is: [describe the change].

The root `AGENTS.md` points Codex to this handoff. A new chat still needs access to the cloned files; GitHub does not include the original chat, local tool sessions or account connections. Sign in to GitHub to push changes and reconnect the owner's hosting account when publication is needed. No API keys or service accounts are needed to run the game locally. Browser gameplay saves do not automatically follow the player to another device or origin.

## Owner and product direction

- Personal repository: `MannanBabar16/After-hours-cafe-webgl`, owned by Abdul Mannan. Use personal repositories, not an organization.
- Original Unity project: `MannanBabar16/AFTER-HOURS-CAFE`. This WebGL project is separate; preserve the Unity repository.
- The user wants a proper, enjoyable café game with the clarity and appeal associated with cozy Steam games, rather than an overwhelming collection of management panels.
- Coffee-making workflow and recipe learning are central. Money should feel meaningful: real sales, ingredient costs, stock purchases, capacity upgrades, ownership and closing reports.
- Additions should create useful ideas for the user's original game. Keep features connected to the actual simulation and introduce them gradually.
- Visual references: a miniature Cozy Bean café with sage woodwork, cream walls, warm oak, rounded details, plants and clean composition; wider references include a stockroom, serving robot and exterior drive-through. Current screenshots and `docs/ART_DIRECTION.md` preserve that direction; the original pasted prompts and attachments are not bundled here.
- Latest feedback: eliminate the dull empty surroundings, use more vibrant cozy colors and better lighting, optimize for browsers, and fix mirrored first-person strafing. Those changes are implemented in 3.1.
- Procedural sound effects and gentle music are important. The live game must be public and accessible to friends without a game login.

## Current shipped state

Game version **3.1.0**. Latest gameplay implementation commit before this documentation handoff: `f73e504a8867bfaea9637391c1e90094eca251d7`.

- Public game: https://after-hours-cafe.upbeat-badge-4829.chatgpt.site
- Release/source/build ZIP: https://github.com/MannanBabar16/After-hours-cafe-webgl/releases/tag/v3.1.0
- Sites identity is tracked in `.openai/hosting.json`. Reuse its exact project ID and preserve the public audience. The last verified hosting publication is saved Site version 4, containing game 3.1.0.
- Source, screenshots, setup, design notes and validation reports are committed. `node_modules/` and `dist/` are ignored; regenerate with `npm ci` and `npm run build`. The release ZIP also contains the compiled build.
- An additional public Vercel deployment and a player-feedback kit are now prepared; see the launch update below. The gameplay release remains 3.1.0.

## Analytics update — 20 October 2026

The owner requested future visitor/gameplay analytics and an interactive live dashboard while preserving the game. The earlier audit found no collector; old traffic cannot be recovered. The simulation's NPC visitor/follower counters must never be reported as website analytics.

- Owner dashboard: **https://after-hours-cafe-webgl.vercel.app/stats/**. Game: **https://after-hours-cafe-webgl.vercel.app**. Public game access is unchanged. The original Sites publication remains the previous gameplay build; it does not collect these analytics.
- Own first-party collector, not Vercel's paid custom-event analytics: visits, anonymous browsers, play sessions, foreground play time, completed coffee/cookies/orders/shifts, upgrades, supplies, feature discoveries, referrer hostnames and coarse device/browser. All definitions and free-tier limits are in `docs/ANALYTICS.md`.
- `src/analytics/` passively observes the store, with no changes to game actions, save schemas, controls, camera, lighting or economy. Telemetry is deferred (~2 KB gzip), bounded and optional; it cannot block play. Privacy opt-out and DNT/GPC are supported.
- Two serverless routes under `api/analytics/`; shared validation/aggregation/private Blob access under `server/`. Immutable batches plus event-ID deduplication avoid replay and concurrent counter loss. Test cohorts are isolated from the default live view. Missing storage returns unavailable/partial, never made-up zeros.
- Reuses personal Vercel project `prj_TCg3dnxeeIfiFs7rEYK347V3SFCl` and new private Blob store `store_BanACjof4WCh1WFJ`. Server-only `BLOB_READ_WRITE_TOKEN`, `ANALYTICS_ADMIN_KEY`, `ANALYTICS_HASH_KEY`, `ANALYTICS_STARTED_AT` are configured in Vercel. No paid plan was enabled. Game development still needs no credentials.
- Dashboard data requires a high-entropy owner key; do not publish it or add it to browser bundles. The owner's access note is outside this repository. On another system, obtain/rotate it through the owner account; do not expect it in Git. Feedback answers remain privately in the existing Google spreadsheet.
- Checks: all 65 tests, strict TypeScript and production build pass. Local compiled-browser QA confirmed real observer events, preserved saves, bad-key rejection, chart interactions, CSV, mobile layout, logout, opt-out and DNT. Local dashboard API responses were explicitly mocked from captured QA events. Verify the production end-to-end report in `docs/qa/analytics-live.json` for publication status; do not treat local fixture results as production proof.
- Small-prototype limits: one-minute batches/refresh; 25-second warm list cache; bounded 5,000-batch scan marked partial if capped. Hobby Blob quotas can stop tracking; gameplay continues. Move to a database/rollups if traffic grows. No automatic retention cleanup yet.
- Published and verified: production deployment `dpl_3cFKHT8xv9rxahKjnLuEyEPaWVMY` is READY at the stable alias from code commit `18b5e03dacbe3d497700d279e87a208434604d9e`. Fresh-browser production checks confirmed actual stored events, retry deduplication, authenticated aggregate reads, chart/export/mobile, opt-out, save continuation and play during blocked tracking. All generated traffic used the test cohort; the default live totals remained zero at verification. The production report is `docs/qa/analytics-live.json`.

## Mechanics to preserve

Cup pickup → placement beneath the machine → recipe selection → brewing/fill/steam → collection → serving. The current automatic machine teaches ingredients/workflow; it does not simulate manual espresso extraction.

Physical deliveries and labeled supply boxes, partial refills with conserved leftovers, bean/milk/cup capacity, dough trays, baking and cookie display, indoor seated service, multi-item drive-through receipts, payment exactly once, real equipment purchases, Bomi delivering prepared items, Mochi cleaning spills, Milo the cat, customization, progression, bank transactions, five business phone apps, closing reports and another evening. See `GAME_DESIGN.md` for details.

One authoritative Zustand simulation powers both cameras. Saves retain the key `after-hours-cafe-v1` with payload version 3 and validated migration. Visual changes must not reset paid stock, cash, equipment or carried objects.

## Important implementation decisions

| Area | Where / decision |
| --- | --- |
| Floor plan | `src/data/layout.ts`: left seating/entrance, right kitchen, connected rear stockroom, exterior drive lane. Shared positions/routes also feed collision and focus. |
| Economy and gameplay | `src/data/operations.ts`, `src/store/game.ts`, `operationsLogic.ts`, `operationTypes.ts`, `persistence.ts`. Preserve stock/product ownership and one-time payment invariants. |
| World and style | `src/game/Diorama.tsx`, `art.tsx`, `OperationsProps.tsx`, `OperationsWorld.tsx`, `Characters.tsx`; cream/sage UI in `src/styles/miniature.css`. |
| Living surroundings | `src/game/Neighborhood.tsx`: local dusk texture, five instanced scenery batches, baked face shading, blossom trees, lit windows, passing cars and umbrella walkers. Ambient actors are scenery, not business customers. Reduced-motion and Light graphics are supported. |
| Lighting/performance | Neutral tone mapping, warm key/cool fill, cached static shadows, instanced potted foliage, reduced bevel subdivisions, adaptive DPR, no extra neighborhood shadow maps/postprocessing. Drawing-buffer preservation is disabled. |
| FPS controller | `src/game/movement.ts` fixes the mirrored right axis; `Scene.tsx` uses it. Arrow keys alias WASD in `controls.ts`. Forward is `(sin(yaw), cos(yaw))`; right is `(-cos(yaw), sin(yaw))`. Do not revert this sign convention. |
| Cameras/interactions | `Scene.tsx`: shared player/carry, mild diorama zoom, complete first-person enclosure, nearby pickup-window eye lowering, contextual quantities, visual equipment anchors for forward-facing focus. Menus release pointer lock. |
| Existing service fixes | Paid seated guests transition from receiving to activity without a second walk. Queue positions use queue index. Animated cars/robots avoid cached shadow ghosts. |

## Validation and limits

```sh
npm test
npm run typecheck
npm run build
```

The latest implementation passed **53 tests**, strict TypeScript and production build. Browser checks confirmed actual WASD at five viewing angles, arrow strafing, trusted mouse look, pointer lock/menu release, ambient motion, reduced motion, Light graphics and the compiled release's controls/mobile phone layout without page errors. Reports are in `docs/qa/v3.1-*.json`.

A controlled fresh-game 1366×768 comparison against the exact 3.0 commit recorded 1,186 → 799 draw calls and 254,238 → 167,052 triangles, including the neighborhood. These measure rendering work, not universal FPS. Previous gameplay checks covered coffee sales, supplies/refills, baking, robot delivery, partial drive orders, closing and reload; some used documented fixtures/checkpoint resumes. Showcase screenshots are staged states of the actual 3D game.

Desktop keyboard/mouse is the primary experience. Broad mobile/hardware playtesting, a longer campaign, cloud saves, multiplayer, manual espresso extraction and Steam integration remain outside the shipped prototype. GitHub cloud checks have failed; an earlier inspected run was blocked by the owner's account billing lock. Diagnose the current run before attributing a new failure. Local validation and public hosting succeeded independently.

See `VALIDATION.md`, `docs/ART_DIRECTION.md` and `docs/ARCHITECTURE.md` for deeper evidence, layout reasoning and acceptance checks. New changes should update this handoff so the project context keeps traveling with the repository.

## LinkedIn launch and feedback update — 13 October 2026

- The user requested actual 4K screenshots, main-UI thumbnail options, a Vercel link for LinkedIn, a short themed Google feedback form, and a casual caption about testing ideas for a future PC/Steam game. Do not describe the browser prototype as a released Steam game or claim it was built without AI assistance.
- Public Vercel game: https://after-hours-cafe-webgl.vercel.app. Existing project reused: `prj_TCg3dnxeeIfiFs7rEYK347V3SFCl`, under `mannanbabar16's projects`. Login protection was disabled as requested. Node 22.x, Vite, `npm ci`, `npm run build`, `dist`; tracked configuration is `vercel.json`. Existing Sites publication remains available.
- Verified Vercel deployment `dpl_HEj9L7cAR3tUVWA4z5p652xnsDmK` reached READY from source commit `fa48f130ba65d2a0f35405137ac4983ecfbef783`. A fresh unsigned-in browser returned HTTP 200, rendered the main HUD and started/opened a shift without browser errors or failed requests. Its social-preview image also returned 200. `docs/qa/vercel-public-launch.json` records this check. These hosting changes did not change gameplay rules.
- `public/social-preview.jpg` is an actual in-engine main-UI shot. HTML has social metadata with the absolute Vercel image URL. The owner's personal GitHub repository contains the same deployment setup and feedback source. Further docs commits need no game rebuild if runtime inputs do not change.
- `docs/feedback/form-spec.json` centrally defines questions, branch mapping and theme. Run `node scripts/prepare-feedback.mjs` to regenerate the ready-to-paste Apps Script builder and standalone design preview. `SETUP.md` explains Google account execution, theme/header, public responder access and signed-out verification.
- The owner has now published the Google Form and supplied its public responder URL: https://docs.google.com/forms/d/e/1FAIpQLSdX1oLnKoee8dOPirDG1TEcgjdKUUTwxdzktdDolkFt-2Wicw/viewform?usp=header. A fresh unsigned-in browser returned HTTP 200. All three routes reached the shared final section and exposed Submit without login. No test responses were submitted, so private spreadsheet storage is not verified. Never label the local design preview as collecting feedback.
- Three routes separate actual players, people blocked from playing, and screenshot-only viewers. Each sees three short sections. Played route has six required choices; other routes three. Device, PC genre familiarity and one comment are optional. A private linked Sheet includes response storage and an empty decision log. No email collection, mandatory writing or public results.
- Preview checks passed all three routes, required entry validation and 390px mobile overflow check, with no page errors. The live Google form also passed all three branch paths and the 390px mobile overflow check; see `docs/qa/google-feedback-public.json`. Its optional save-progress sign-in prompt does not block answering. The live form still has the default purple theme and no custom header; the owner must finish the theme in the Google editor using the supplied PNG and sage #35664f. No authenticated Google editor tool is connected here.
- `docs/feedback/LinkedIn-Caption.txt` and `LinkedIn-Caption-Ready-Now.txt` now include the real Vercel and Google Form links with no placeholders. `published-form.json` stores public launch URLs only. The local `outputs/After-Hours-Cafe-LinkedIn-Caption.txt` and feedback ZIP were refreshed too.
- Screenshots and the ready-to-share feedback ZIP also exist outside the source repository in the local workspace `outputs/` directory. They are not assumed to follow a Git clone. Browser saves on the Sites origin do not transfer automatically to Vercel.
