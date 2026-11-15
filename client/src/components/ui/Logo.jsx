import { useId } from 'react';

/** DataComPredia mark: four hops joined by a path, with a packet travelling along it. */
export function LogoMark({ size = 36, animated = true }) {
  const id = useId().replace(/:/g, '');
  const path = 'M7 24 L15 11 L20 18 L29 7';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--c-elevated))" />
          <stop offset="1" stopColor="rgb(var(--c-surface))" />
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="34.5" height="34.5" rx="10" fill={`url(#b${id})`} stroke="rgb(var(--c-line-strong))" strokeWidth="1.5" />
      <path d={path} stroke={`url(#g${id})`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {[[7, 24], [15, 11], [20, 18], [29, 7]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.7" fill={i > 1 ? '#22d3ee' : '#34d399'} />
      ))}
      {animated ? (
        <circle r="2" fill="#fff">
          <animateMotion dur="2.8s" repeatCount="indefinite" path={path} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.8s" repeatCount="indefinite" />
        </circle>
      ) : null}
    </svg>
  );
}

export function Wordmark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      {compact ? null : (
        <div className="leading-none">
          <div className="font-display text-[17px] font-bold tracking-tight text-ink">
            DataCom<span className="gradient-text">Predia</span>
          </div>
          <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">Networking Lab</div>
        </div>
      )}
    </div>
  );
}
