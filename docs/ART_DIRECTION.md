# A living miniature café · visual overhaul

The supplied Cozy Bean illustration guides proportions, rounded woodwork, sage paint, cream ceramic tile, warm oak, plants and architectural composition. The wider gameplay reference guides the right-hand kitchen, attached stockroom, outside drive-through, customers and robots. The workstation reference guides readable machinery and compact contextual controls. The world is functioning 3D geometry; no reference image is used as a background or gameplay substitute.

## Floor plan

- Left: arched windows, books, sage sofa, three round seating arrangements with six customer places, plants, pendant lights, and the front entrance.
- Right: an organized back coffee counter, public handoff/display island, side oven bay, trash, and Bomi's dock.
- Behind the kitchen: printed stock boxes on wooden shelves, dough preparation, and a clear staff doorway.
- Outside the kitchen wall: approach arrows, an order speaker, a shaded sliding pickup window, queue spacing, and an exit. A driver stops at the same window the player approaches from inside.

Geometry, collision, equipment focus, seats, shelf slots, the spawn, and robot routes share `src/data/layout.ts` and `src/game/navigation.ts`. Rendered equipment reads those same locations. The movement grid tests check reachability and every segment of Bomi's table routes. Cars stay on the exterior lane; their existing order/arrival/payment/departure states remain authoritative.

## Art and lighting

Rounded geometry follows actual object dimensions rather than stretching a generic bevel. Shared geometry and materials support satin sage cabinetry, warmer wood grain, cream tiles, soft ceramic, terracotta, gentle metal highlights, upholstery, and leaves. Arched framing, striped awnings, cabinet panels, spindle chairs, door depth, shelving and plants establish the miniature architecture.

The coffee machine has a working hopper, visible beans, a connected milk vessel/tube, shrinking cup stack, physical controls, actual pouring, fill and steam. The oven exposes the tray and cookies through glass and warms while baking. Supply boxes have printed illustrated labels derived from their real supply type and remaining quantity. Cars have rounded bodies, windows, drivers, wheels and lights. The serving robot displays the products it carries.

Warm pendant and counter lighting contrasts with the cooler wet exterior and rain. A small procedural environment supplies controlled highlights without remote HDR assets. Contact grounding, bounded shadows, reused props, instanced floors/tiles/rain, adaptive DPR and Light graphics control rendering cost.

The 3.1 palette adds richer sage, forest green, terracotta and honey wood. Neutral tone mapping preserves color, warm key lighting establishes depth, and cool fill keeps the shadows readable. A tiny local dusk gradient replaces the solid background. The surroundings are a living pastel neighborhood with blossom trees, lit windows, swaying foliage, passing cars, umbrella walkers and soft billboard lamp glows. These are scenery outside the café's playable boundaries and do not replace drive-through traffic or create business transactions.

The distant town uses five instanced batches with baked face shading, without extra shadow maps or postprocessing. Potted leaves and stems are instanced; rounded props use fewer bevel subdivisions. Light graphics reduces neighborhood trees, walkers and traffic. Ambient neighborhood motion respects the browser's reduced-motion preference. The renderer no longer preserves the drawing buffer unnecessarily.

## Presentation

The default camera frames the café and outside lane with mild perspective. The mouse wheel offers a small zoom range. Camera-facing walls cut down in the diorama; first person restores full walls and a ceiling. Looking through the nearby pickup window smoothly lowers the eye position to the driver. Both modes use one player and the same inventory/order simulation.

First-person screen-right now follows the rendered camera's right axis. The old strafe basis was mirrored while its forward basis was correct. Unit checks derive the expected axes from a real Three.js camera; browser checks exercise real WASD at five angles, arrow strafing, pointer lock and menu release.

Cream cards, sage keycaps, brown type, illustrated drink/cookie icons, compact order bubbles, and restrained transitions replace the previous dark HUD. Equipment quantities appear contextually instead of permanent floating boards. The five phone apps keep their real transactions, purchases, prices and progression.

## Saves

The browser save payload advances to version 3; the storage key remains unchanged. Layout metadata distinguishes the old room from this one. Old shelf boxes relocate without changing quantities. Unsafe old player/dropped-item positions move to reachable locations. Active serving routes are rebuilt for the new seating paths. Cash, equipment, recipes, carries, shipments and payment history remain part of the same save.

## Personal acceptance checklist

1. Open a fresh evening and inspect the kitchen/seating separation; scroll to zoom.
2. Take an order and follow the guest to their seat before serving.
3. Brew a drink; inspect the spouts, liquid, milk level and steam.
4. Walk through the kitchen doorway, collect a printed stock box, and refill the matching station.
5. Prepare dough, load the oven, bake and transfer cookies into the display.
6. Order supplies on the phone and collect the boxes outside the entrance.
7. Load Bomi with a prepared drink and watch the trip to the table and return.
8. Approach the drive-through from inside; switch to first person and look at the car through the open window.
9. Complete a multi-item drive order, close, reload, and begin another evening.

## Scope

The references are polished illustrations. This release interprets their shapes, palette and composition in a stylized procedural WebGL world; it does not reproduce their offline-rendered detail or photorealism. Desktop keyboard/mouse is the primary experience. Broad hardware/mobile playtesting and a longer campaign remain future work.
