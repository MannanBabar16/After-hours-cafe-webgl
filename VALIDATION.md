# Validation · 3.1 vibrant evening and first-person controls

Verified locally in Chrome on Windows, 12 October 2026. Browser reports are in `docs/qa/`.

## 3.1 verification

- All 53 tests and strict TypeScript / production build passed. Five new camera-derived tests cover WASD at cardinal and diagonal viewing angles.
- Real browser keyboard checks exercised W/A/S/D at five camera angles, checking travel against the rendered camera matrix, plus arrow strafing, trusted mouse movement, pointer lock and phone release.
- The new neighborhood's cars and walkers moved over time, stopped under the browser's reduced-motion preference, and rendered successfully with Light graphics.
- The compiled release separately passed real WASD and arrow movement, mouse look, phone pointer release and a 390-pixel phone layout without overflow or page errors. Development controls remain excluded from production. Its storage-based observations wait for the existing 900 ms save flush rather than reading stale positions.
- A controlled comparison loaded the exact 3.0 commit and 3.1 in separate localhost origins, at 1366×768 with fresh closed cafés, the same camera and High graphics. After warm-up, the median draw-call sample of eight frames was 1,186 → 799; triangles were 254,238 → 167,052. That is approximately 33% fewer draw calls and 34% fewer triangles including the neighborhood. This measures rendering work, not FPS or universal device performance.
- The new run reported no page errors. The final gallery was captured from the real 3D game at 1600×900 using the previously documented showcase fixtures. See `docs/qa/v3.1-vibrant.json`, `docs/qa/v3.1-production.json` and `docs/qa/v3.1-gallery.json`.

The new scenery uses small local procedural textures and five instanced scenery batches, without postprocessing or additional shadow maps. Instanced café foliage and fewer bevel subdivisions reduce foreground rendering work. The existing café simulation, economy and save format are unchanged by this visual/control update.

## Prior 3.0 gameplay verification

## Automated checks

- Strict TypeScript and Vite production build passed.
- 48 Vitest tests passed before the 3.1 camera tests were added: actual stock transfers, repeated brew, insufficient stock, partial/wrong/duplicate orders, deliveries, baking/grace/overflow, drive-through spacing, Bomi reservations and handoffs, upgrades, safe drops, Mochi, bounded credit, menu quotes, closing, reload, old-save relocation, seated service, first-person focus, station/shelf/delivery reachability and clear robot routes.
- Dependency inputs are unchanged from the 2.0 audit, which reported zero known production vulnerabilities. No fresh vulnerability claim is made for 3.0.

## Browser playthroughs

| Check | What was exercised |
| --- | --- |
| Indoor coffee | Actual movement and E: accept Minho's espresso, cup dispenser, machine menu, brew, collect, serve, final payment |
| Camera and carry | Box pickup, V to first person, phone, V back, same position/box; G drop and retrieval |
| Physical supplies | Phone checkout, visible delivery, outside box pickup, matching refill, remainder preserved |
| Baking | Prepare real dough tray, carry to oven, load/start, wait, collect, transfer four cookies into display |
| Equipment | Purchase Bomi and larger milk tank through phone; milk stock remains eight while capacity increases to sixteen |
| Robot | Prepare actual latte, load Bomi, wait for travel/delivery, receive one shared sale |
| Drive-through | Accept espresso plus two cookies; coffee and first cookie leave receipt unpaid, second cookie completes payment; car departs |
| Closing and next shift | Close through Manager, inspect report, reload/Continue report without double overhead, begin evening two with cash/stock/upgrades preserved |
| First-person controls | Real pointer lock and mouse look; E cup pickup, strafe, machine interaction, brewing and collecting; menus release mouse; coffee survives return to diorama |

Development fixtures were used to unlock the bakery early, fund two equipment purchases, and create known indoor/drive receipts plus display cookies for the service test. The bakery check separately produced cookies from dough. The extended playthrough resumed browser checkpoints while correcting movement automation and observed issues; these are targeted checks, not a claim that two natural twelve-minute shifts were played end to end. Physical shelf pickup, partial milk refills, the first espresso sale, bakery, prepared robot products, payment, closing and reload exercised the actual controls/store actions.

The compiled build passed an actual espresso sale ($89.62 after its first payment), development-reference/panel exclusion, a 390-pixel supply checkout without horizontal overflow, and reload/Continue preserving cash and the completed order. Its phone measured a 30-pixel status bar and 544-pixel usable scrolling area at 390×844. Both browser runs reported no page errors. See `docs/qa/v3-gameplay.json`, `docs/qa/v3-production.json` and `docs/qa/v3-gallery.json`.

The gallery is captured from the actual 3D game with a documented showcase fixture: funded third shift, equipment/décor, known receipts, waiting car, stocked cookie display and a robot delivery. First-person views use camera-position/angle fixtures; the workstation coffee is actually brewed. Bakery/report captures come from the gameplay checks. Final visual review compares the supplied references with the real seating, kitchen, stockroom, outside car, machinery, characters and cream phone UI. It also corrected cached moving shadows, seated guests returning to their table twice, and driver visibility through the service window.

The extended run recorded 1,213 draw calls, 259,480 triangles, 635 geometries and 43 textures at one development scene snapshot. This is a rendering-cost observation, not a frame-rate benchmark or universal performance claim. Light graphics and adaptive resolution remain available.

## Manual acceptance checklist

- [ ] Start with a fresh save, open, complete the first order.
- [ ] Purchase stock, carry boxes, refill matching equipment, recycle empty packaging.
- [ ] Brew while cookies bake; transfer and serve the cookies.
- [ ] Complete an indoor receipt and a multi-item drive receipt exactly once.
- [ ] Buy capacity and confirm it adds no stock; load prepared items onto Bomi.
- [ ] Switch cameras carrying a drink; open/close menus and resume mouse look.
- [ ] Close, reload, start another evening with equipment and remaining stock.
- [ ] Check a slow device with Light graphics and reduced volume.

## Practical limitations

A stylized browser prototype, primarily for desktop keyboard and mouse. Touch movement and responsive phone controls are provided; full mobile gameplay ergonomics and broad device coverage need further playtesting. Adaptive resolution and bounded simulation reduce cost, but no universal frame-rate claim is made.

There is one automatic coffee machine, one oven, one serving robot, and one cleaning robot. The serving robot carries prepared products only and serves indoor customers. There is no multiplayer, server economy, cloud save, Steam integration, photorealistic café, or manual espresso extraction. An overbaked batch uses one quality value, including when mixed into an existing display batch. Saves remain browser/origin-specific.

GitHub Actions is configured to repeat the local checks. A cloud run can be prevented by account-level billing or runner restrictions; local verification and public Sites hosting do not depend on an Actions runner.
