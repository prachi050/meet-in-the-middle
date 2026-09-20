import { useEffect, useMemo, useRef, useState } from "react";
import { FRIEND_COLORS } from "../lib/lines.js";

const LAT0 = 40.7;
const LON0 = -73.95;
const K = 1000;
const COS = Math.cos((LAT0 * Math.PI) / 180);
const project = (s) => ({ x: (s.lon - LON0) * COS * K, y: -(s.lat - LAT0) * K });

const short = (name, max = 18) => (name.length > max ? name.slice(0, max - 1).trimEnd() + "…" : name);

function viewFor(points, minWidth, pad) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY);
  const w = Math.max(span * pad, minWidth);
  return { x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - w / 2, w };
}

// A schematic map: every station is a dot placed by its real latitude and longitude. No map tiles needed.
export default function NetworkMap({ stations, friends, spots, activeSpot }) {
  const projected = useMemo(() => stations.map((s) => ({ s, ...project(s) })), [stations]);
  const whole = useMemo(() => viewFor(projected, 0, 1.06), [projected]);

  const active = spots[activeSpot];
  const target = useMemo(() => {
    const pts = friends.map((f) => project(f.station));
    if (active) pts.push(project(active.station));
    return pts.length ? viewFor(pts, 46, 2.3) : whole;
  }, [friends, active, whole]);

  const [view, setView] = useState(whole);
  const current = useRef(whole);

  // Ease the view toward the new target whenever the selection changes.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = current.current;
    if (reduce) {
      current.current = target;
      setView(target);
      return;
    }
    let raf;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 480, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const next = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
      };
      current.current = next;
      setView(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const u = view.w / 100; // one "unit" is 1% of the visible width
  const zoomed = friends.length > 0;
  const activePt = active ? project(active.station) : null;

  return (
    <svg
      className="map"
      viewBox={`${view.x} ${view.y} ${view.w} ${view.w}`}
      role="img"
      aria-label={
        active
          ? `Map showing each friend's station and the suggested meeting station, ${active.station.name}`
          : "Map of every subway station in New York City"
      }
    >
      <g fill={zoomed ? "#D6D6D6" : "#B9B9B9"}>
        {projected.map(({ s, x, y }) => (
          <circle key={s.id} cx={x} cy={y} r={zoomed ? 0.32 * u : 0.3 * u} />
        ))}
      </g>

      {activePt &&
        friends.map((f) => {
          const p = project(f.station);
          return (
            <line
              key={f.idx}
              x1={p.x}
              y1={p.y}
              x2={activePt.x}
              y2={activePt.y}
              stroke={FRIEND_COLORS[f.idx]}
              strokeWidth={1 * u}
              strokeLinecap="round"
            />
          );
        })}

      {spots.map((sp, i) => {
        if (i === activeSpot) return null;
        const p = project(sp.station);
        return (
          <g key={sp.station.id}>
            <circle cx={p.x} cy={p.y} r={1.8 * u} fill="#fff" stroke="#000" strokeWidth={0.5 * u} />
            <text x={p.x} y={p.y} className="map-num" fontSize={2.2 * u} textAnchor="middle" dominantBaseline="central">
              {i + 1}
            </text>
          </g>
        );
      })}

      {friends.map((f) => {
        const p = project(f.station);
        const size = 5 * u;
        return (
          <g key={f.idx}>
            <rect x={p.x - size / 2} y={p.y - size / 2} width={size} height={size} rx={1.1 * u} fill={FRIEND_COLORS[f.idx]} stroke="#fff" strokeWidth={0.6 * u} />
            <g transform={`translate(${p.x - size * 0.31} ${p.y - size * 0.31}) scale(${(size * 0.62) / 24})`} fill="#fff">
              <circle cx="12" cy="8" r="4.2" />
              <path d="M3.5 21c0-4.7 3.8-8.3 8.5-8.3s8.5 3.6 8.5 8.3z" />
            </g>
            <text x={p.x} y={p.y + size / 2 + 3.2 * u} className="map-label" fontSize={2.9 * u} textAnchor="middle" strokeWidth={0.9 * u}>
              {short(f.station.name)}
            </text>
          </g>
        );
      })}

      {activePt && (
        <g>
          <circle cx={activePt.x} cy={activePt.y} r={2.8 * u} fill="#000" stroke="#fff" strokeWidth={0.7 * u} />
          <text x={activePt.x} y={activePt.y} className="map-num-active" fontSize={2.8 * u} textAnchor="middle" dominantBaseline="central">
            {activeSpot + 1}
          </text>
          <text x={activePt.x} y={activePt.y - 4.4 * u} className="map-label map-label-strong" fontSize={3.4 * u} textAnchor="middle" strokeWidth={1.1 * u}>
            {short(active.station.name, 24)}
          </text>
        </g>
      )}
    </svg>
  );
}
