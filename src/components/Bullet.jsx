import { bulletColor, bulletText } from "../lib/lines.js";

// A subway line bullet, like the ones on station signs.
export function Bullet({ route, size = "md" }) {
  return (
    <span
      className={`bullet bullet-${size}${route.length > 1 ? " bullet-wide" : ""}`}
      style={{ background: bulletColor(route), color: bulletText(route) }}
      aria-label={`${route} ${route === "SIR" ? "railway" : "train"}`}
    >
      {route}
    </span>
  );
}

export function Bullets({ routes, size }) {
  return (
    <span className="bullets">
      {routes.map((r) => (
        <Bullet key={r} route={r} size={size} />
      ))}
    </span>
  );
}

// Rounded-square person badge. Each friend gets one color.
export function PersonBadge({ color, size = 28 }) {
  return (
    <span className="person" style={{ background: color, width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="#fff">
        <circle cx="12" cy="8" r="4.2" />
        <path d="M3.5 21c0-4.7 3.8-8.3 8.5-8.3s8.5 3.6 8.5 8.3z" />
      </svg>
    </span>
  );
}
