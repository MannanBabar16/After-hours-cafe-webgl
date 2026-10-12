# Architecture · version 3

React 19 + strict TypeScript provide the interface; Three.js, React Three Fiber and Drei render the world. Zustand stores one authoritative game. Vite builds self-contained browser assets. All graphics and audio are generated locally.

| Module | Responsibility |
| --- | --- |
| `src/data/layout.ts` | Shared floor plan, station anchors, seating, shelf slots, vehicle lane and robot routes |
| `src/data/operations.ts` | Products, supply packs, costs, capacities, timings, station locations |
| `src/data/content.ts` | Regulars, dialogue, seats, décor, world identity |
| `src/store/operationTypes.ts` | Physical inventory, carries, receipts, shipments, machine/oven/robot state |
| `src/store/game.ts` | Player actions, stock transfers, equipment, customization, closing and progression |
| `src/store/operationsLogic.ts` | Shared fulfillment/payment and simulation timers for every channel |
| `src/store/persistence.ts` | Validated versioned saves, legacy portion migration, throttled local storage |
| `src/game/Scene.tsx` | Camera modes, movement, interaction focus, atmosphere, game clock |
| `src/game/controls.ts` | Keyboard, pointer lock, shared interaction dispatcher |
| `src/game/focus.ts` | Prioritize carried products for accepted matching receipts |
| `src/game/navigation.ts` | Shared collision checks for walking and safe drops |
| `src/game/Environment.tsx` / `Diorama.tsx` | Cutaway architecture, first-person enclosure, furniture, windows, counters and exterior |
| `src/game/art.tsx` / `SupplyPrint.tsx` | Shared rounded geometry/materials, procedural wood/highlights and illustrated inventory labels |
| `src/game/OperationsProps.tsx` | Real carried objects, automatic brewer, bakery and stock indicators |
| `src/game/OperationsWorld.tsx` | Stockroom, boxes, spills, traffic, delivery truck, Bomi |
| `src/game/Characters.tsx` | Customer movement, shared player motion, Milo, Mochi |
| `src/game/audio.ts` | Procedural music, ambient rain, machine loops and Foley |
| `src/ui/Phone.tsx` | Supply, Equipment, Bank, Café Manager, CafeGram |
| `src/ui/HUD.tsx` | Minimal cash/order/action UI and touch buttons |
| `src/ui/Workstation.tsx` | Automatic drink selection and recipe learning |
| `src/ui/Screens.tsx` | Title, pause, settings, help, closing report, development panel |

## Invariants

1. A supply box has one ID, quantity, and location. Refill moves only available quantity to available capacity.
2. A prepared product has a unique ID. Handoff, carry, and robot ownership transfer the actual object.
3. Every customer channel uses the same receipt and fulfillment/payment function.
4. Product reservations prevent Bomi and the player from satisfying the same outstanding quantity twice.
5. A capacity upgrade spends money but never fills the equipment.
6. A paid receipt and paid-order ledger prevent a repeated payout. Closing overhead is applied once.
7. Camera changes only presentation and movement basis. The same carry, position, orders, machine, oven, and stock survive.
8. Production builds exclude the development panel and browser debugging reference.

## Persistence

Storage key remains `after-hours-cafe-v1` to find existing player saves; its payload version is 3. Merge explicitly whitelists values and validates types/ranges instead of spreading arbitrary saved fields into actions. Old bean/milk **portions** transfer into containers and surplus boxes once; money, café identity, ownership, regulars and valid décor remain. Menus reset on reload, while camera preference and active production persist.

Writes are throttled and flushed on page exit/visibility change. Saves are local to this browser and origin, with no cloud synchronization. Restricted storage does not crash the game. Hidden tabs stop timers rather than catch up on returning.

## Rendering and time

The simulation ticks at 10 Hz with bounded delta; frame animations render separately. Shared primitive geometry/materials, instanced floor/rain, static cached environment shadows, bounded queues/boxes, adaptive DPR, and the Light graphics setting control cost. This is an optimization strategy, not a guarantee of a particular FPS on all hardware.

When extending content, add a product definition and shared stock/fulfillment rules first. Render the resulting state and reuse those definitions in the phone. Keep simulation logic out of render callbacks except visual interpolation and movement.
