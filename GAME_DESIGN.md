# After Hours Café · operations notebook

The central mechanic is a connected business: stock arrives, the player makes products, customers receive them, and one shared till funds the next improvement. Keep the next physical action clear. Complexity unfolds through play rather than a wall of tutorials.

## The first evening

Start with $85, a loaded bean hopper, milk tank and cup dispenser, eight dough portions, and reserve boxes on the shelves. Open the café when ready. The first customer requests espresso. Take the order at the public counter. The guest returns to a seat. Take a cup, place it, choose the recipe, collect, serve the seated guest, and hear the till.

After one lifetime order, drive-through customers become available. After two, cookie production opens. After six, vanilla and flat white join the menu. First-night rewards at two and six orders help the player afford upgrades. Each open shift lasts twelve minutes; accepted orders may finish after closing. Untaken orders leave when closing begins.

## Coffee

| Drink | Beans | Milk | Syrup | Base seconds | Base price |
| --- | ---: | ---: | ---: | ---: | ---: |
| Espresso | 1 | 0 | 0 | 3.5 | $4 |
| Americano | 1 | 0 | 0 | 4 | $5 |
| Latte | 1 | 2 | 0 | 5 | $6 |
| Cappuccino | 1 | 1 | 0 | 5.5 | $6 |
| Flat white | 1 | 1 | 0 | 4.5 | $6.50 |
| Vanilla latte | 1 | 2 | 1 | 5.5 | $7.50 |

Each drink consumes one dispenser cup before brewing. Ingredients are consumed exactly once at brew start. A ready drink remains until collected. Wrong orders leave the product in the player's hand. Empty stock produces a readable prompt; it never invents ingredients.

The machine runs automatically. Visual grinding, flow, milk, steam, and ingredient notes explain the sequence. This version deliberately replaces manual distribution/tamping/extraction/latte-art controls with a readable bean-to-cup operation.

## Stock and conservation

Supply checkout charges the shared till and creates an order. After twelve seconds the truck approaches; four seconds later it unloads labeled boxes outside. Carry a box to a matching station and use E. Only free capacity transfers. Any remainder stays in that same box. Shelves, delivery frontage, carried boxes, and dropped boxes are locations of the same inventory object.

| Pack | Quantity | Cost |
| --- | ---: | ---: |
| Beans | 20 | $7 |
| Milk | 12 | $5 |
| Paper cups | 25 | $3 |
| Cookie dough | 16 | $6 |
| Vanilla syrup | 10 | $5 |

Empty packaging can go in the bin; full boxes cannot. Pending orders count toward the forty-box world limit. A bounded emergency credit purchase helps recover when key stock is low; it still charges the till and sends physical stock.

## Baking and orders

Prepare a tray from real dough, carry it to the oven, load it, close the door and start. A base batch is four cookies and takes twenty seconds. While it bakes, brew or serve. Collect the finished tray and transfer cookies to the display. Overflow remains on the carried baking tray. After a generous 120-second grace period, overbaked cookies become darker and receive a quality discount when sold.

Indoor and drive-through customers use the same receipt schema. Every line stores a quoted unit price, requested quantity, delivered quantity, and any quality discount. Partial fulfillment reduces remaining quantities. Final fulfillment records one sale and one tip. Later menu price changes preserve existing quotes. Coffee-plus-two-cookie drive orders remain unpaid until all three products arrive.

Bomi carries only prepared products assigned to an accepted indoor order. Reservations prevent simultaneous manual delivery of those same required items. The robot travels to the customer, uses the shared fulfillment rule, and returns. It neither produces drinks nor serves the drive-through. Mochi separately visits and removes actual spills.

## Investment and money

| Equipment | Capacity / effect progression |
| --- | --- |
| Hopper | 10 → 20 → 35 bean portions |
| Milk tank | 8 → 16 → 30 milk portions |
| Cup dispenser | 10 → 20 → 40 cups |
| Coffee machine | 1× → 1.35× → 1.7× speed |
| Oven | 4 → 6 → 8 cookies; faster batches |
| Display | 12 → 24 → 40 cookies |
| Serving tray | 1 → 2 → 3 products |
| Bomi | Unowned → 1 → 2 → 3 products |
| Shelves | 8 → 14 → 22 boxes |

Capacity purchases never create stock. Supply purchases and investment immediately reduce cash. Operating profit counts sales/tips minus ingredients actually consumed and closing overhead; it is different from cash, because unopened supply boxes and equipment are investments. The Bank app lists the real transactions. Café ownership costs $500 and lowers closing overhead from $8 to $3.

Prices, recipe ingredients, stock costs, demand, time, and equipment prices belong in `src/data/operations.ts` or shared simulation rules. Phone screens and meshes display that state; they do not create a second economy.

## Presentation and future work

Warm wood, cream walls, sage machines, plants, books, quiet rain, disposable cups, and small robots retain the rainy café identity. Projected receipts, a single next-action hint, and a small cash display guide play. Growing liquid, shrinking stock, oven states, cars, and sounds carry production feedback.

The reference images guide palette and spatial detail. The procedural browser art remains stylized; it does not reproduce photorealistic equipment. Future Steam work could expand drink personalities, customer conversations, machine maintenance, richer bakery recipes, accessibility, and a longer balanced campaign. Keep each new system attached to the same inventory and order rules.
