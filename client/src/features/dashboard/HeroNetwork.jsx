import { useEffect, useState } from 'react';
import { Cloud, Monitor, Network, Router, Server } from 'lucide-react';

/** Animated mini network used in the Overview hero. Packets ride the links via SMIL. */
const NODES = {
  pcA: { x: 62, y: 66, label: 'PC-1', icon: Monitor, tone: 'muted' },
  pcB: { x: 62, y: 234, label: 'PC-2', icon: Monitor, tone: 'muted' },
  sw: { x: 190, y: 150, label: 'SW-1', icon: Network, tone: 'brand' },
  rt: { x: 330, y: 150, label: 'R-1', icon: Router, tone: 'brand' },
  net: { x: 460, y: 70, label: 'Internet', icon: Cloud, tone: 'accent' },
  srv: { x: 460, y: 230, label: 'SRV-1', icon: Server, tone: 'accent' },
};

const LINKS = [['pcA', 'sw'], ['pcB', 'sw'], ['sw', 'rt'], ['rt', 'net'], ['rt', 'srv']];

const ROUTES = [
  { path: ['pcA', 'sw', 'rt', 'srv'], dur: 4.2, begin: 0, color: 'fill-emerald-bright' },
  { path: ['net', 'rt', 'sw', 'pcB'], dur: 4.6, begin: 1.4, color: 'fill-accent' },
  { path: ['pcB', 'sw', 'rt', 'net'], dur: 5.0, begin: 2.8, color: 'fill-violet' },
];

const toneClass = {
  brand: 'text-emerald-bright',
  accent: 'text-accent',
  muted: 'text-muted',
};

const d = (keys) => keys.map((k, i) => `${i ? 'L' : 'M'}${NODES[k].x} ${NODES[k].y}`).join(' ');

export function HeroNetwork() {
  const [still, setStill] = useState(false);
  useEffect(() => {
    setStill(Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  }, []);

  return (
    <svg viewBox="0 0 520 300" className="h-full w-full" role="img" aria-label="Animated diagram of packets travelling across a small network">
      <defs>
        <radialGradient id="hn-pulse">
          <stop offset="0" stopColor="rgb(var(--c-brand))" stopOpacity="0.35" />
          <stop offset="1" stopColor="rgb(var(--c-brand))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* links */}
      <g strokeLinecap="round">
        {LINKS.map(([a, b]) => (
          <g key={a + b}>
            <line x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} className="stroke-line-strong" strokeWidth="1.5" />
            <line x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} className="stroke-emerald/50" strokeWidth="1.5" strokeDasharray="2 9" />
          </g>
        ))}
      </g>

      {/* router halo */}
      <circle cx={NODES.rt.x} cy={NODES.rt.y} r="54" fill="url(#hn-pulse)" />
      {!still ? (
        <circle cx={NODES.rt.x} cy={NODES.rt.y} r="30" className="fill-none stroke-emerald/50" strokeWidth="1">
          <animate attributeName="r" values="30;58" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0" dur="3s" repeatCount="indefinite" />
        </circle>
      ) : null}

      {/* nodes */}
      {Object.entries(NODES).map(([k, n]) => {
        const Icon = n.icon;
        return (
          <g key={k}>
            <rect x={n.x - 23} y={n.y - 23} width="46" height="46" rx="13" className="fill-surface stroke-line-strong" strokeWidth="1.5" />
            <rect x={n.x - 23} y={n.y - 23} width="46" height="46" rx="13" className="fill-emerald/5" />
            <Icon x={n.x - 11} y={n.y - 11} size={22} strokeWidth={1.8} className={toneClass[n.tone]} />
            <text x={n.x} y={n.y + 41} textAnchor="middle" className="fill-muted font-mono" fontSize="10.5" letterSpacing="0.06em">
              {n.label}
            </text>
          </g>
        );
      })}

      {/* packets */}
      {!still
        ? ROUTES.map((r, i) => (
            <g key={i} opacity="0">
              <animateMotion dur={`${r.dur}s`} begin={`${r.begin}s`} repeatCount="indefinite" path={d(r.path)} />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.06;0.94;1"
                dur={`${r.dur}s`}
                begin={`${r.begin}s`}
                repeatCount="indefinite"
              />
              <circle r="9" fillOpacity="0.25" className={r.color} />
              <circle r="4" className={r.color} />
            </g>
          ))
        : null}
    </svg>
  );
}
