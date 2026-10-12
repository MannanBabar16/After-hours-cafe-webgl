import type { ProductId } from "../data/operations";
export function ProductIcon({
  product,
  size = 32,
}: {
  product: ProductId;
  size?: number;
}) {
  if (product === "cookie")
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <ellipse cx="20" cy="34" rx="14" ry="3" fill="#74533e" opacity=".13" />
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="#cea064"
          stroke="#9c7248"
          strokeWidth="1.3"
        />
        <path
          d="M9 15c4-8 12-10 19-5"
          fill="none"
          stroke="#e9c392"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        {[
          [13, 15],
          [25, 11],
          [29, 23],
          [18, 27],
          [11, 25],
          [21, 19],
        ].map(([x, y]) => (
          <ellipse
            key={x}
            cx={x}
            cy={y}
            rx="2.4"
            ry="2"
            fill="#694631"
            transform={`rotate(${x} ${x} ${y})`}
          />
        ))}
      </svg>
    );
  const dark = product === "espresso" || product === "americano",
    foam = !dark;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <ellipse cx="19" cy="34" rx="15" ry="3.4" fill="#bba27d" />
      <ellipse cx="19" cy="32.7" rx="13.5" ry="2.8" fill="#f2e4ce" />
      <path
        d="M29 15h3c7 0 6 11 0 11h-4"
        stroke="#bdae8e"
        strokeWidth="3.6"
        fill="none"
      />
      <path
        d="M7 13h24l-2.5 15c-1 6-18 6-19 0z"
        fill={dark ? "#beac87" : "#ecdfc8"}
        stroke="#a48b66"
        strokeWidth="1.1"
      />
      <ellipse
        cx="19"
        cy="13"
        rx="12"
        ry="5.5"
        fill="#f7ead3"
        stroke="#bda783"
        strokeWidth="1"
      />
      <ellipse
        cx="19"
        cy="13"
        rx="9.5"
        ry="3.7"
        fill={dark ? "#674531" : "#b58657"}
      />
      {foam && <path d="M19 15c-9-4-6-7-1-4 5-4 11 0 1 4" fill="#fff0d6" />}
      <path
        d="M13 6c-2-2 2-3 1-5M23 6c-2-2 2-3 1-5"
        stroke="#b59b76"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
        opacity=".6"
      />
    </svg>
  );
}
