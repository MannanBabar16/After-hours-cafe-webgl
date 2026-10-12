# Validation · 2.0 operations upgrade

Verified locally in Chrome on Windows, 12 October 2026. Browser reports are in `docs/qa/`.

## Automated checks

- Strict TypeScript and Vite production build passed.
- 42 Vitest tests passed: actual stock transfers, repeated brew, insufficient stock, partial/wrong/duplicate orders, deliveries, baking/grace/overflow, drive-through spacing, Bomi reservations and handoffs, upgrades, safe drops, Mochi, bounded credit, menu quotes, closing, reload and old-save migration.
- Production dependency audit reported zero known vulnerabilities at verification time.

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

Development fixtures were used to unlock the bakery early, lower milk for a refill test, fund two equipment purchases, and create known indoor/drive receipts plus display cookies for the service test. The earlier bakery test separately produced those cookies from dough. These are targeted browser checks, not a claim that two natural twelve-minute shifts were played end to end.

The compiled build passed an actual espresso sale ($89.62 after its first payment), development-reference/panel exclusion, a 390-pixel supply checkout without horizontal overflow, and reload/Continue preserving cash and the completed order. Final screenshot review also verified the production phone with a 30-pixel status bar and 546-pixel usable scrolling area at 390×844, plus the production first-person camera. Screenshots reflect playable local builds; the first-person showcase uses a camera-position/angle fixture with an actually brewed latte, and the service/bakery/report screenshots include the documented fixtures.

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
