# After Hours Café — portable project context

Updated 12 October 2026. This is the useful working context from the original development chat, not a full chat export. Read the current code and Git history if this document later becomes stale.

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
- There is no unfinished implementation request at this handoff. The user is preparing to continue on another computer.

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
