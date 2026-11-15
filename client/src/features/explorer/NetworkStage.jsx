import { useMemo } from 'react';
import { Monitor, Network, Router, Server, Waypoints } from 'lucide-react';
import { tone } from './tones.js';

const TILE = 60;

const DEVICE = {
  pc: { icon: Monitor, tile: 'fill-info/10 stroke-info/50', ink: 'text-info' },
  server: { icon: Server, tile: 'fill-violet/10 stroke-violet/50', ink: 'text-violet' },
  switch: { icon: Network, tile: 'fill-emerald/10 stroke-emerald/50', ink: 'text-emerald-bright' },
  router: { icon: Router, tile: 'fill-accent/10 stroke-accent/50', ink: 'text-accent' },
  hub: { icon: Waypoints, tile: 'fill-warn/10 stroke-warn/50', ink: 'text-warn' },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Spread the saved positions out to suit the wide stage, so labels have room. */
function useLayout(topology) {
  return useMemo(() => {
    const span = (vals) => Math.max(...vals) - Math.min(...vals);
    // The stage is wide, so a drawing that is taller than it is wide is turned on its side.
    const tall = span(topology.nodes.map((n) => n.position.y)) > span(topology.nodes.map((n) => n.position.x)) * 1.15;
    const raw = topology.nodes.map((n) => [n.id, tall ? { x: n.position.y, y: -n.position.x } : n.position]);
    const sx = clamp(640 / (span(raw.map(([, p]) => p.x)) || 640), 1, 1.6);
    const sy = clamp(330 / (span(raw.map(([, p]) => p.y)) || 330), 1, 1.5);
    const at = new Map(raw.map(([id, p]) => [id, { x: p.x * sx, y: p.y * sy }]));
    const xs = [...at.values()].map((p) => p.x);
    const ys = [...at.values()].map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2 + 14;
    const w = Math.max(span(xs) + 210, 640);
    const h = Math.max(span(ys) + 190, 370);
    const varied = new Set(topology.links.map((l) => `${l.bandwidthMbps}/${l.distanceKm}`)).size > 1;
    const centre = { x: xs.reduce((a, b) => a + b, 0) / xs.length, y: ys.reduce((a, b) => a + b, 0) / ys.length };
    return { viewBox: `${cx - w / 2} ${cy - h / 2} ${w} ${h}`, at, varied, centre };
  }, [topology]);
}

/** Where a cable's label goes: beside its midpoint, on the side facing away from the middle of the drawing. */
function labelSpot(a, b, centre) {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  let n = { x: -(b.y - a.y) / d, y: (b.x - a.x) / d };
  const outward = n.x * (mid.x - centre.x) + n.y * (mid.y - centre.y);
  // Cables that point straight at the middle have no "outer" side: go above, clear of the device names.
  if (Math.abs(outward) < 30 ? n.y > 0 : outward < 0) n = { x: -n.x, y: -n.y };
  return {
    x: mid.x + n.x * 13,
    y: mid.y + n.y * 13 + (n.y > 0.3 ? 8 : n.y < -0.3 ? -1 : 3),
    anchor: n.x > 0.35 ? 'start' : n.x < -0.35 ? 'end' : 'middle',
  };
}

/** Point `gap` pixels away from `a` on the way to `b`, so packets start and stop at the tile edge. */
function edge(a, b, gap) {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: a.x + ((b.x - a.x) / d) * gap, y: a.y + ((b.y - a.y) / d) * gap };
}

function Packet({ hop, at, duration, frameKey }) {
  const a = at.get(hop.from);
  const b = at.get(hop.to);
  const p0 = edge(a, b, TILE * 0.7);
  const p1 = edge(b, a, TILE * 0.7);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const t = tone(hop.tone);
  const width = 18 + hop.kind.length * 6.6;
  return (
    <>
      <g
        key={frameKey}
        className={hop.lost ? 'dcp-fly-lost' : 'dcp-fly'}
        style={{
          '--x0': `${p0.x}px`, '--y0': `${p0.y}px`,
          '--x1': `${p1.x}px`, '--y1': `${p1.y}px`,
          '--xm': `${mid.x}px`, '--ym': `${mid.y}px`,
          '--dur': `${duration}ms`,
        }}
      >
        <rect x={-width / 2} y={-12} width={width} height={24} rx={12} className={`${t.fill} stroke-canvas`} strokeWidth="2.5" />
        <text textAnchor="middle" y="3.6" className="fill-canvas font-mono text-[10.5px] font-bold">{hop.kind}</text>
      </g>
      {hop.lost ? (
        <g key={`x${frameKey}`} className="dcp-pop" style={{ '--delay': `${duration * 0.72}ms`, transform: `translate(${mid.x}px, ${mid.y}px)` }}>
          <circle r="15" className="fill-canvas stroke-danger" strokeWidth="2" />
          <path d="M-5.5 -5.5 5.5 5.5 M5.5 -5.5 -5.5 5.5" className="stroke-danger" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      ) : null}
    </>
  );
}

/** Topology drawing with the current frame's hop animated along its cable. */
export function NetworkStage({ topology, frame, frameKey, duration }) {
  const { viewBox, at, varied, centre } = useLayout(topology);
  const route = new Set(frame?.route ?? []);
  const failed = new Set(frame?.failed ?? []);
  const lossy = new Map((frame?.lossy ?? []).map((l) => [l.id, l.percent]));
  const candidate = new Map();
  for (const c of frame?.candidates ?? []) for (const id of c.linkIds) if (!candidate.has(id)) candidate.set(id, c);
  const hop = frame?.hop;
  const lit = new Set([frame?.at, hop?.from, hop?.to].filter(Boolean));

  return (
    <svg viewBox={viewBox} className="h-full w-full" role="img" aria-label="Network diagram">
      {topology.links.map((l) => {
        const a = at.get(l.source);
        const b = at.get(l.target);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const spot = labelSpot(a, b, centre);
        const isFailed = failed.has(l.id);
        const isLossy = lossy.has(l.id) && !isFailed;
        const cand = candidate.get(l.id);
        const onRoute = route.has(l.id);
        let cls = 'stroke-line-strong';
        if (isFailed) cls = 'stroke-danger/70';
        else if (isLossy) cls = 'stroke-warn';
        else if (cand) cls = tone(cand.tone).stroke;
        else if (onRoute) cls = 'stroke-emerald';
        const label = isFailed ? 'cut' : isLossy ? `${lossy.get(l.id)}% loss` : varied ? `${l.bandwidthMbps} Mbps, ${l.distanceKm} km` : null;
        return (
          <g key={l.id}>
            <line
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              className={`${cls} transition-[stroke] duration-300`}
              strokeWidth={onRoute || cand ? 3 : 2}
              strokeDasharray={isFailed ? '3 9' : isLossy ? '9 6' : undefined}
              strokeLinecap="round"
            />
            {label ? (
              <text
                x={spot.x}
                y={spot.y}
                textAnchor={spot.anchor}
                className={`dcp-halo font-mono text-[10px] ${isFailed ? 'fill-danger' : isLossy ? 'fill-warn' : 'fill-muted'}`}
              >
                {label}
              </text>
            ) : null}
            {cand && l.id === cand.linkIds[Math.floor(cand.linkIds.length / 2)] ? (
              <g transform={`translate(${mid.x}, ${mid.y})`}>
                <circle r="11" className={`fill-canvas ${tone(cand.tone).stroke}`} strokeWidth="2" />
                <text textAnchor="middle" y="3.8" className={`font-mono text-[11px] font-bold ${tone(cand.tone).fill}`}>{cand.label}</text>
              </g>
            ) : null}
          </g>
        );
      })}

      {topology.nodes.map((n) => {
        const d = DEVICE[n.type] || DEVICE.pc;
        const Icon = d.icon;
        const p = at.get(n.id);
        const on = lit.has(n.id);
        return (
          <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
            {frame?.at === n.id ? <circle r={TILE * 0.62} className="dcp-ring fill-none stroke-emerald" strokeWidth="2" /> : null}
            <rect x={-TILE / 2} y={-TILE / 2} width={TILE} height={TILE} rx="16" className="fill-surface" />
            <rect
              x={-TILE / 2} y={-TILE / 2} width={TILE} height={TILE} rx="16"
              className={`${d.tile} transition-all duration-300`}
              strokeWidth={on ? 2.6 : 1.4}
            />
            <Icon x={-13} y={-13} width={26} height={26} strokeWidth={1.7} className={d.ink} aria-hidden />
            <text y={TILE / 2 + 18} textAnchor="middle" className="dcp-halo fill-ink text-[13px] font-semibold">{n.label}</text>
            {n.ip ? <text y={TILE / 2 + 32} textAnchor="middle" className="dcp-halo fill-faint font-mono text-[9.5px]">{n.ip}</text> : null}
          </g>
        );
      })}

      {hop ? <Packet hop={hop} at={at} duration={duration} frameKey={frameKey} /> : null}
    </svg>
  );
}
