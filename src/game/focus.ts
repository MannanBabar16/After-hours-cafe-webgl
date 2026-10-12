import type { Carry, Order } from "../store/operationTypes";

export function orderFocusBias(order: Order, carry: Carry | null) {
  const items =
    carry?.kind === "product"
      ? [carry.item]
      : carry?.kind === "tray"
        ? carry.items
        : [];
  if (!items.length) return 0;
  if (!order.accepted) return 0.5;
  const matching = items.some((item) =>
    order.lines.some(
      (line) => line.product === item.product && line.delivered < line.quantity,
    ),
  );
  return matching ? -0.85 : 0.25;
}
