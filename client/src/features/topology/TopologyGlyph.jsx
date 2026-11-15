/**
 * Theme-aware schematic of a starter topology. Colours come from Tailwind tokens
 * (stroke-* / fill-*), so it adapts to light and dark automatically.
 */
const LINK = 'stroke-line-strong';
const NODE = 'fill-emerald-bright';
const NODE_ALT = 'fill-accent';
const NODE_DIM = 'fill-muted';

function Frame({ children, className = 'h-full w-full' }) {
  return (
    <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden>
      {children}
    </svg>
  );
}

export function TopologyGlyph({ id, className }) {
  switch (id) {
    case 'star':
      return (
        <Frame className={className}>
          <g className={LINK} strokeWidth="1.6" strokeLinecap="round">
            <path d="M60 36 24 16M60 36 96 16M60 36 24 56M60 36 96 56" />
          </g>
          <circle cx="60" cy="36" r="10" className="fill-emerald/15 stroke-emerald" strokeWidth="1.2" />
          <circle cx="60" cy="36" r="5" className={NODE} />
          {[[24, 16], [96, 16], [24, 56], [96, 56]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.2" className={NODE_DIM} />
          ))}
        </Frame>
      );
    case 'bus':
      return (
        <Frame className={className}>
          <path d="M10 38H110" className={LINK} strokeWidth="2.4" strokeLinecap="round" />
          {[22, 46, 70, 94].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 38V${i % 2 ? 54 : 22}`} className={LINK} strokeWidth="1.6" strokeLinecap="round" />
              <circle cx={x} cy={i % 2 ? 56 : 20} r="4.2" className={i === 3 ? NODE_ALT : NODE_DIM} />
              <circle cx={x} cy="38" r="3" className={NODE} />
            </g>
          ))}
        </Frame>
      );
    case 'ring':
      return (
        <Frame className={className}>
          <circle cx="60" cy="36" r="22" className={LINK} strokeWidth="2" />
          <circle cx="60" cy="36" r="22" className="stroke-emerald" strokeWidth="2" strokeDasharray="14 124" strokeLinecap="round" />
          {[[60, 14], [82, 36], [60, 58], [38, 36]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.4" className={NODE} />
          ))}
          <circle cx="16" cy="36" r="3.6" className={NODE_DIM} />
          <circle cx="104" cy="36" r="3.6" className={NODE_DIM} />
          <path d="M19.6 36H34M86 36H100.4" className={LINK} strokeWidth="1.4" strokeLinecap="round" />
        </Frame>
      );
    case 'mesh':
      return (
        <Frame className={className}>
          <g className={LINK} strokeWidth="1.6" strokeLinecap="round">
            <path d="M28 18H92V54H28Z M28 18 92 54M92 18 28 54" />
          </g>
          {[[28, 18], [92, 18], [92, 54], [28, 54]].map(([x, y], i) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="5" className={i === 3 ? NODE : NODE_ALT} />
          ))}
        </Frame>
      );
    default:
      return (
        <Frame className={className}>
          <rect x="22" y="14" width="76" height="44" rx="8" className="stroke-line-strong" strokeWidth="1.5" strokeDasharray="4 5" />
          <path d="M60 28v16M52 36h16" className="stroke-faint" strokeWidth="2" strokeLinecap="round" />
        </Frame>
      );
  }
}
