import { useEffect, useId, useRef, useState } from 'react';
import { useChartColors } from '../../lib/theme.js';

/** Stats derived purely from the encoder's returned levels (no invented data). */
export function signalStats(levels) {
  if (!levels?.length) return null;
  let transitions = 0;
  for (let i = 1; i < levels.length; i += 1) if (levels[i] !== levels[i - 1]) transitions += 1;
  const dc = levels.reduce((a, b) => a + b, 0) / levels.length;
  const distinct = new Set(levels).size;
  return { transitions, dc, distinct, elements: levels.length };
}

const fmtLevel = (v) => (v > 0 ? '+V' : v < 0 ? '−V' : '0');

/* Layout constants (px, in SVG user space — the SVG is rendered 1:1 so text stays crisp). */
const PAD_L = 52;
const PAD_R = 18;
const PAD_T = 38;
const PAD_B = 30;
const PLOT_H = 130;
const AMP = PLOT_H / 2 - 16;

const SCOPE_CSS = `
@keyframes scope-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes scope-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes scope-scan { from { transform: translateX(0); } to { transform: translateX(100%); } }
.scope-trace { stroke-dasharray: 1; stroke-dashoffset: 0; animation: scope-draw 900ms cubic-bezier(.3,.7,.2,1) both; }
.scope-glow { animation: scope-fade 900ms ease-out both; }
.scope-screen {
  background:
    radial-gradient(ellipse 80% 90% at 50% 45%, rgb(var(--c-elevated) / .55), transparent 75%),
    rgb(var(--c-canvas) / .75);
  box-shadow: inset 0 0 0 1px rgb(var(--c-line) / .6), inset 0 18px 40px -26px rgb(var(--c-brand) / .35), inset 0 -24px 48px -34px rgb(0 0 0 / .45);
}
:root[data-theme='light'] .scope-screen {
  background: radial-gradient(ellipse 80% 90% at 50% 45%, rgb(var(--c-surface)), rgb(var(--c-elevated) / .8));
  box-shadow: inset 0 0 0 1px rgb(var(--c-line) / .7), inset 0 14px 30px -24px rgb(var(--c-brand) / .35);
}
`;

/**
 * Oscilloscope-style channel display.
 * levels: 2 samples per bit (first/second half). bits: array of 0/1.
 */
export function Scope({
  channel = 'CH1',
  tone = 'brand',
  title,
  convention,
  levels,
  bits,
  activeBit = null,
  onSelectBit,
  substitutions = [],
  runKey = 0,
}) {
  const c = useChartColors();
  const uid = useId().replace(/:/g, '');
  const wrapRef = useRef(null);
  const [wrapW, setWrapW] = useState(720);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWrapW(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    setWrapW(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const color = tone === 'accent' ? c.accent : c.brand;
  const hasData = Boolean(levels?.length);
  const n = hasData ? Math.max(1, Math.round(levels.length / 2)) : 8;
  const bitW = Math.max(38, Math.min(160, Math.floor((wrapW - PAD_L - PAD_R) / n)));
  const width = Math.max(wrapW, PAD_L + PAD_R + n * bitW);
  const height = PAD_T + PLOT_H + PAD_B;
  const yMid = PAD_T + PLOT_H / 2;
  const yOf = (v) => yMid - v * AMP;
  const xOf = (i) => PAD_L + i * bitW;
  const half = bitW / 2;

  let d = '';
  if (hasData) {
    levels.forEach((lvl, i) => {
      const x0 = PAD_L + i * half;
      const x1 = PAD_L + (i + 1) * half;
      const y = yOf(lvl);
      d += `${i === 0 ? 'M' : 'L'}${x0},${y} L${x1},${y} `;
    });
    d = d.trim();
  }

  const showEvery = bitW < 30 ? 2 : 1;
  const ticks = [];
  for (let i = 0; i <= n * 4; i += 1) ticks.push(i);

  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-canvas/40">
      <style>{SCOPE_CSS}</style>

      {/* instrument header strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/80 bg-elevated/50 px-3.5 py-2">
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider"
          style={{ background: `${color}26`, color, boxShadow: `inset 0 0 0 1px ${color}55` }}
        >
          {channel}
        </span>
        <span className="font-display text-[13.5px] font-semibold tracking-tight text-ink">{title}</span>
        {convention ? <span className="min-w-0 truncate font-mono text-[11px] text-muted">{convention}</span> : null}
        <span className="ml-auto hidden font-mono text-[10.5px] uppercase tracking-wider text-faint sm:inline">
          1 bit/div · 2 elements/bit · {n} div
        </span>
      </div>

      <div ref={wrapRef} className="scope-screen overflow-x-auto">
        <svg
          key={runKey}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title} encoded waveform${hasData ? '' : ' (no signal)'}`}
          className="block"
        >
          <defs>
            <filter id={`glow${uid}`} x="-5%" y="-30%" width="110%" height="160%">
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
          </defs>

          {/* graticule: horizontal divisions */}
          {[1, 0.5, 0, -0.5, -1].map((v) => (
            <line
              key={v}
              x1={PAD_L}
              x2={PAD_L + n * bitW}
              y1={yOf(v)}
              y2={yOf(v)}
              stroke={c.grid}
              strokeWidth={v === 0 ? 1.4 : 1}
              strokeDasharray={Math.abs(v) === 0.5 ? '2 5' : v === 0 ? undefined : '5 4'}
            />
          ))}

          {/* active bit band */}
          {activeBit != null && hasData && activeBit < n ? (
            <g>
              <rect x={xOf(activeBit)} y={PAD_T - 6} width={bitW} height={PLOT_H + 12} fill={color} opacity="0.12" />
              <line x1={xOf(activeBit)} x2={xOf(activeBit + 1)} y1={PAD_T - 6} y2={PAD_T - 6} stroke={color} strokeWidth="2" />
            </g>
          ) : null}

          {/* substitution bands */}
          {substitutions.map((s, i) => (
            <g key={i}>
              <rect
                x={xOf(s.startBit) + 1}
                y={PAD_T - 2}
                width={(s.length || 4) * bitW - 2}
                height={PLOT_H + 4}
                fill={c.violet}
                opacity="0.13"
                stroke={c.violet}
                strokeOpacity="0.55"
                strokeDasharray="4 3"
                rx="4"
              />
              <text x={xOf(s.startBit) + 7} y={PAD_T + PLOT_H - 6} fill={c.violet} fontSize="9.5" fontWeight="600" fontFamily="inherit">
                {String(s.rule).split(/\s+/)[0]}
              </text>
            </g>
          ))}

          {/* bit-cell dividers + mid-bit dotted */}
          {Array.from({ length: n + 1 }).map((_, i) => (
            <line key={`b${i}`} x1={xOf(i)} x2={xOf(i)} y1={PAD_T - 6} y2={PAD_T + PLOT_H + 6} stroke={c.grid} strokeWidth="1" strokeDasharray="3 4" />
          ))}
          {Array.from({ length: n }).map((_, i) => (
            <line key={`m${i}`} x1={xOf(i) + half} x2={xOf(i) + half} y1={PAD_T} y2={PAD_T + PLOT_H} stroke={c.grid} strokeWidth="1" strokeDasharray="1 5" />
          ))}

          {/* centre-line scope ticks */}
          {ticks.map((i) => (
            <line key={`t${i}`} x1={PAD_L + (i * bitW) / 4} x2={PAD_L + (i * bitW) / 4} y1={yMid - (i % 4 === 0 ? 5 : 3)} y2={yMid + (i % 4 === 0 ? 5 : 3)} stroke={c.axis} strokeWidth="1" opacity="0.5" />
          ))}

          {/* voltage axis */}
          {[1, 0, -1].map((v) => (
            <g key={v}>
              <text x={PAD_L - 12} y={yOf(v) + 3.5} textAnchor="end" fill={c.axis} fontSize="11" fontFamily="inherit">
                {fmtLevel(v)}
              </text>
              <line x1={PAD_L - 7} x2={PAD_L} y1={yOf(v)} y2={yOf(v)} stroke={c.axis} opacity="0.7" />
            </g>
          ))}

          {/* bit values (top) + bit index (bottom) */}
          {hasData
            ? bits.map((b, i) => {
                const active = i === activeBit;
                return (
                  <g key={i}>
                    <text
                      x={xOf(i) + bitW / 2}
                      y={PAD_T - 14}
                      textAnchor="middle"
                      fontFamily="inherit"
                      fontSize={active ? 15 : 13.5}
                      fontWeight={active ? 700 : 500}
                      fill={active ? color : c.text}
                      opacity={active ? 1 : 0.85}
                    >
                      {b}
                    </text>
                    {i % showEvery === 0 ? (
                      <text x={xOf(i) + bitW / 2} y={PAD_T + PLOT_H + 20} textAnchor="middle" fontFamily="inherit" fontSize="10" fill={active ? color : c.axis}>
                        {i}
                      </text>
                    ) : null}
                  </g>
                );
              })
            : null}
          <text x={PAD_L - 12} y={PAD_T + PLOT_H + 20} textAnchor="end" fontFamily="inherit" fontSize="9.5" fill={c.axis} opacity="0.8">
            bit
          </text>

          {/* trace: soft glow underlay + crisp line */}
          {hasData ? (
            <g key={`${runKey}-${d.length}`}>
              <path className="scope-glow" d={d} fill="none" stroke={color} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" opacity="0.5" filter={`url(#glow${uid})`} />
              <path className="scope-trace" pathLength="1" d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <line x1={PAD_L} x2={PAD_L + n * bitW} y1={yMid} y2={yMid} stroke={c.axis} strokeDasharray="6 6" opacity="0.5" />
              <text x={PAD_L + (n * bitW) / 2} y={yMid - 14} textAnchor="middle" fill={c.axis} fontSize="12" fontFamily="inherit" letterSpacing="0.18em">
                NO SIGNAL
              </text>
            </g>
          )}

          {/* click targets per bit cell */}
          {hasData && onSelectBit
            ? Array.from({ length: n }).map((_, i) => (
                <rect
                  key={i}
                  x={xOf(i)}
                  y={PAD_T - 22}
                  width={bitW}
                  height={PLOT_H + 28}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectBit(i)}
                >
                  <title>{`Bit ${i}: ${bits[i]} → ${fmtLevel(levels[i * 2])}, ${fmtLevel(levels[i * 2 + 1])}`}</title>
                </rect>
              ))
            : null}
        </svg>
      </div>
    </div>
  );
}
