# Coffee Craft expansion — validation

Validated in Chrome on Windows, 8 October 2026.

## Completed checks

- Strict TypeScript compilation and Vite production build passed.
- All 20 Vitest tests passed. Coverage includes service and single payments, wrong recipes, recipe unlocks, milk quality, purchases, regulars/posts, closing, pause, saves, grind direction and feedback, dose/inventory consumption, discarded-cup costs, restock cash accounting, free practice, practice-save isolation, quoted prices, pastry margin, single goal rewards, supplier credit with negative balances, operating profit, ownership and rent, and manual/robot table cleanup.
- A browser playthrough used actual UI actions to grind, distribute, tamp, lock, extract and serve Espresso to Minho through WASD movement and proximity E. The $5 sale, consumed beans, $0.80 ingredient cost, XP and Latte unlock were verified.
- Browser UI checks covered the café desk, paused desk clock, pricing, pastries, restocking, live café/apron/cup/wall customization, Latte and Americano practice, wand purging, milk release, rosetta selection, practice logging, early closing, charged costs, another evening and reload. Practice preserved cash, inventory, café time and XP.
- A separate compiled-build playthrough repeated the full espresso ritual, movement/service, inventory delivery, phone/shop, pause and save/reload without source imports or debug controls. Sixteen requests remained on the local origin; there were no runtime page or console errors.
- The final readability pass gave desk buttons a clear contrast and kept the brewing action pinned inside a scrollable panel. The café desk and brewing panels, including their main actions, were verified at 1366×768, 1920×1080, 2560×1440 and 390×844. Desktop remains the primary target.
- Title, café, phone, brewing, management and closing screenshots are included. Later-shift screenshots use representative test fixtures; no cheat UI is included in the game.

## Performance and limits

Static sun shadows are cached. Render resolution adapts toward a 60 FPS frame budget, while CSS interface text remains at native display resolution. Light mode lowers rain density and disables sun shadows. The available test GPU is an NVIDIA GeForce GT 430; results on this older device are not a universal performance guarantee.

Coffee flow, puck quality, milk and art are game abstractions. The journal identifies recipe values as starting points and links to primary coffee equipment guidance. Sound is synthesized with WebAudio, including continuous machine loops and layered interaction effects. Browser playback begins on the opening click; volume is adjustable.

Saves are local to the browser and origin. Local and hosted saves do not synchronize. A private hosted release is verified by Sites deployment status. Multiplayer, Steam packaging, a physical fluid simulator and a staff system are outside this browser build.
