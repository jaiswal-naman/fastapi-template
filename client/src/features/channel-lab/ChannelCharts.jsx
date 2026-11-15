import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useChartColors } from '../../lib/theme.js';

/* ───────────────────────── helpers ───────────────────────── */

export function formatRate(bps) {
  if (!Number.isFinite(bps)) return { value: '—', unit: 'bps' };
  const abs = Math.abs(bps);
  if (abs >= 1e9) return { value: (bps / 1e9).toFixed(3), unit: 'Gbps' };
  if (abs >= 1e6) return { value: (bps / 1e6).toFixed(3), unit: 'Mbps' };
  if (abs >= 1e3) return { value: (bps / 1e3).toFixed(2), unit: 'kbps' };
  return { value: bps.toFixed(2), unit: 'bps' };
}

const shortRate = (bps) => {
  const abs = Math.abs(bps);
  if (abs >= 1e9) return `${+(bps / 1e9).toFixed(2)}G`;
  if (abs >= 1e6) return `${+(bps / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${+(bps / 1e3).toFixed(1)}k`;
  return `${+bps.toFixed(0)}`;
};

function niceTicks(max, count = 4) {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const out = [];
  for (let v = 0; v <= max + step * 0.5; v += step) out.push(+v.toFixed(10));
  return out;
}

function useWidth(initial = 560) {
  const ref = useRef(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.floor(e.contentRect.width))));
    ro.observe(el);
    setW(Math.max(260, Math.floor(el.clientWidth)));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const CHART_CSS = `
@keyframes cc-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes cc-fade { from { opacity: 0; } to { opacity: 1; } }
.cc-line { stroke-dasharray: 1; animation: cc-draw 1000ms cubic-bezier(.3,.7,.2,1) both; }
.cc-fade { animation: cc-fade 700ms ease-out both; }
@keyframes cc-pulse { 0% { r: 6; opacity: .55; } 100% { r: 16; opacity: 0; } }
.cc-pulse { animation: cc-pulse 1.8s ease-out infinite; }
`;

function ChartFrame({ title, badge, children, legend }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-canvas/40">
      <style>{CHART_CSS}</style>
      <div className="flex flex-wrap items-center gap-2 border-b border-line/80 bg-elevated/50 px-3.5 py-2">
        <span className="font-display text-[13px] font-semibold tracking-tight text-ink">{title}</span>
        {badge ? <span className="font-mono text-[10.5px] text-faint">{badge}</span> : null}
        {legend ? <div className="ml-auto flex flex-wrap items-center gap-3 font-mono text-[10.5px] text-muted">{legend}</div> : null}
      </div>
      <div className="scope-screen-lite p-1" style={{ background: 'radial-gradient(ellipse 80% 90% at 50% 40%, rgb(var(--c-elevated) / .5), transparent 75%)' }}>
        {children}
      </div>
    </div>
  );
}

const LegendDot = ({ color, label, dashed }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="inline-block h-0.5 w-4 rounded" style={{ background: dashed ? 'transparent' : color, borderTop: dashed ? `2px dashed ${color}` : undefined }} />
    {label}
  </span>
);

/* ───────────────────── Nyquist / Shannon curve ───────────────────── */

export function CapacityChart({ kind, bandwidthHz, levels, snrDb, capacityBps }) {
  const c = useChartColors();
  const uid = useId().replace(/:/g, '');
  const [ref, width] = useWidth();
  const H = 270;
  const P = { l: 58, r: 22, t: 20, b: 44 };
  const iw = width - P.l - P.r;
  const ih = H - P.t - P.b;

  const isNy = kind === 'nyquist';
  const mNow = Math.max(2, levels || 2);
  const xLo = isNy ? 2 : Math.min(-10, Math.floor(snrDb ?? 0));
  const xHi = isNy ? Math.max(32, 2 ** (Math.ceil(Math.log2(mNow)) + 1)) : Math.max(60, Math.ceil(snrDb ?? 0));
  const xNow = isNy ? mNow : snrDb;
  const f = (x) => (isNy ? 2 * bandwidthHz * Math.log2(x) : bandwidthHz * Math.log2(1 + 10 ** (x / 10)));

  const pts = [];
  const N = 90;
  for (let i = 0; i <= N; i += 1) {
    const x = xLo + ((xHi - xLo) * i) / N;
    pts.push([x, f(x)]);
  }
  const yMax = Math.max(pts[pts.length - 1][1], capacityBps || 0) * 1.08;
  const yTicks = niceTicks(yMax, 4);
  const yTop = yTicks[yTicks.length - 1];
  const X = (x) => P.l + ((x - xLo) / (xHi - xLo)) * iw;
  const Y = (y) => P.t + ih - (y / yTop) * ih;

  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');
  const area = `${line} L${X(xHi)},${Y(0)} L${X(xLo)},${Y(0)} Z`;

  const xTicks = [];
  if (isNy) {
    const step = niceTicks(xHi, 4)[1] || 8;
    for (let v = step; v <= xHi; v += step) xTicks.push(v);
    if (xTicks[0] > 2) xTicks.unshift(2);
  } else for (let v = Math.ceil(xLo / 10) * 10; v <= xHi; v += 10) xTicks.push(v);

  const mx = X(xNow);
  const my = Y(capacityBps ?? f(xNow));
  const flip = mx > width - 150; // keep the callout inside the plot

  return (
    <ChartFrame
      title={isNy ? 'Capacity vs. signal levels' : 'Capacity vs. SNR'}
      badge="formula curve · marker = server result"
      legend={
        <>
          <LegendDot color={c.brand} label={isNy ? `C = 2·${shortRate(bandwidthHz)}Hz·log₂M` : `B = ${shortRate(bandwidthHz)}Hz`} />
        </>
      }
    >
      <div ref={ref}>
        <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={isNy ? 'Nyquist capacity versus number of levels' : 'Shannon capacity versus SNR'} className="block">
          <defs>
            <linearGradient id={`area${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={c.brand} stopOpacity="0.32" />
              <stop offset="1" stopColor={c.brand} stopOpacity="0" />
            </linearGradient>
            <filter id={`glow${uid}`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>

          {yTicks.map((t) => (
            <g key={t}>
              <line x1={P.l} x2={P.l + iw} y1={Y(t)} y2={Y(t)} stroke={c.grid} strokeDasharray={t === 0 ? undefined : '4 5'} />
              <text x={P.l - 9} y={Y(t) + 3.5} textAnchor="end" fontSize="10.5" fill={c.axis}>{shortRate(t)}</text>
            </g>
          ))}
          {xTicks.map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={P.t} y2={P.t + ih} stroke={c.grid} strokeDasharray="2 6" />
              <text x={X(t)} y={P.t + ih + 16} textAnchor="middle" fontSize="10.5" fill={c.axis}>{t}</text>
            </g>
          ))}
          <text x={P.l + iw / 2} y={H - 8} textAnchor="middle" fontSize="10.5" fill={c.axis} letterSpacing="0.1em">
            {isNy ? 'SIGNAL LEVELS  M' : 'SNR  (dB)'}
          </text>
          <text transform={`translate(13 ${P.t + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="10.5" fill={c.axis} letterSpacing="0.1em">
            CAPACITY (bps)
          </text>

          <path className="cc-fade" d={area} fill={`url(#area${uid})`} />
          <path className="cc-fade" d={line} fill="none" stroke={c.brand} strokeWidth="6" opacity="0.4" filter={`url(#glow${uid})`} />
          <path className="cc-line" pathLength="1" d={line} fill="none" stroke={c.brand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

          {/* marker + guides */}
          <g className="cc-fade">
            <line x1={mx} x2={mx} y1={my} y2={P.t + ih} stroke={c.accent} strokeDasharray="4 4" />
            <line x1={P.l} x2={mx} y1={my} y2={my} stroke={c.accent} strokeDasharray="4 4" />
            <circle className="cc-pulse" cx={mx} cy={my} r="6" fill={c.accent} />
            <circle cx={mx} cy={my} r="5.5" fill={c.nodeBg} stroke={c.accent} strokeWidth="2.5" />
            <g transform={`translate(${flip ? mx - 14 : mx + 14} ${Math.min(P.t + ih - 40, my + 10)})`}>
              <rect x={flip ? -112 : 0} y="-14" width="112" height="38" rx="7" fill={c.tooltipBg} stroke={c.accent} strokeOpacity="0.6" />
              <text x={flip ? -102 : 10} y="1" fontSize="11.5" fontWeight="600" fill={c.accent}>
                {formatRate(capacityBps ?? 0).value} {formatRate(capacityBps ?? 0).unit}
              </text>
              <text x={flip ? -102 : 10} y="16" fontSize="10" fill={c.axis}>
                {isNy ? `M = ${levels}` : `SNR = ${snrDb} dB`}
              </text>
            </g>
          </g>
        </svg>
      </div>
    </ChartFrame>
  );
}

/* ───────────────────── Delta modulation ───────────────────── */

export function DeltaChart({ result }) {
  const c = useChartColors();
  const [ref, width] = useWidth();
  const input = result.inputSamples || [];
  const rec = result.reconstruction || [];
  const bitsArr = result.bitstream || [];
  const n = Math.max(input.length, rec.length);
  const H = 260;
  const P = { l: 46, r: 20, t: 18, b: 12 };
  const BIT_H = 52;
  const iw = width - P.l - P.r;
  const ih = H - P.t - P.b;

  const all = [...input, ...rec];
  const lo = Math.min(...all) - (result.stepSize || 1);
  const hi = Math.max(...all) + (result.stepSize || 1);
  const X = (i) => P.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const Y = (v) => P.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const ticks = niceTicks(hi - lo, 4).map((t) => lo + t).filter((v) => v <= hi + 1e-9);

  let stairs = '';
  rec.forEach((v, i) => {
    if (i === 0) stairs += `M${X(0)},${Y(v)}`;
    else stairs += ` H${X(i)} V${Y(v)}`;
  });
  stairs += ` H${X(Math.max(0, n - 1))}`;
  const inLine = input.map((v, i) => `${i ? 'L' : 'M'}${X(i)},${Y(v)}`).join(' ');
  const cellW = Math.min(44, iw / Math.max(1, n));

  return (
    <ChartFrame
      title="Staircase reconstruction"
      badge={`step Δ = ${result.stepSize}`}
      legend={
        <>
          <LegendDot color={c.accent} label="input x[k]" />
          <LegendDot color={c.brand} label="reconstruction x̂[k]" />
        </>
      }
    >
      <div ref={ref}>
        <svg width={width} height={H + BIT_H} viewBox={`0 0 ${width} ${H + BIT_H}`} role="img" aria-label="Delta modulation input and staircase reconstruction" className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={P.l} x2={P.l + iw} y1={Y(t)} y2={Y(t)} stroke={c.grid} strokeDasharray="4 5" />
              <text x={P.l - 8} y={Y(t) + 3.5} textAnchor="end" fontSize="10.5" fill={c.axis}>{+t.toFixed(2)}</text>
            </g>
          ))}
          {input.map((_, i) => (
            <line key={i} x1={X(i)} x2={X(i)} y1={P.t} y2={P.t + ih} stroke={c.grid} strokeDasharray="1 6" />
          ))}

          <path className="cc-line" pathLength="1" d={stairs} fill="none" stroke={c.brand} strokeWidth="2.4" strokeLinejoin="round" />
          <path className="cc-fade" d={inLine} fill="none" stroke={c.accent} strokeWidth="1.6" strokeDasharray="5 4" opacity="0.9" />
          {input.map((v, i) => (
            <circle key={i} className="cc-fade" cx={X(i)} cy={Y(v)} r="3.6" fill={c.nodeBg} stroke={c.accent} strokeWidth="2" />
          ))}

          {/* bitstream row */}
          <line x1={P.l} x2={P.l + iw} y1={H + 2} y2={H + 2} stroke={c.grid} />
          <text x={P.l - 8} y={H + 32} textAnchor="end" fontSize="10" fill={c.axis}>bits</text>
          {bitsArr.map((b, i) => {
            const cx = X(i + 1);
            const up = b === 1;
            return (
              <g key={i}>
                <rect x={cx - cellW / 2 + 2} y={H + 10} width={cellW - 4} height={34} rx="6" fill={up ? c.brand : c.danger} opacity="0.14" stroke={up ? c.brand : c.danger} strokeOpacity="0.45" />
                <text x={cx} y={H + 25} textAnchor="middle" fontSize="12" fontWeight="700" fill={up ? c.brand : c.danger}>{up ? '▲' : '▼'}</text>
                <text x={cx} y={H + 39} textAnchor="middle" fontSize="10.5" fill={c.text}>{b}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </ChartFrame>
  );
}

/* ───────────────────── PCM pipeline ───────────────────── */

export function PcmDiagram({ bitsPerSample, sampleRateHz, bitRateBps }) {
  const c = useChartColors();
  const [ref, width] = useWidth();
  const n = bitsPerSample;
  const levelsTotal = 2 ** Math.min(n, 30);
  const shown = 2 ** Math.min(n, 4);
  const H = 190;
  const P = { l: 14, r: 14, t: 14, b: 14 };
  const iw = width - P.l - P.r;
  const ih = H - P.t - P.b;
  const cycles = 2;
  const S = 24; // illustrative samples
  const Y = (v) => P.t + ih / 2 - (v * (ih / 2 - 6));
  const X = (t) => P.l + t * iw;
  const sine = Array.from({ length: 160 }, (_, i) => {
    const t = i / 159;
    return `${i ? 'L' : 'M'}${X(t).toFixed(1)},${Y(Math.sin(2 * Math.PI * cycles * t)).toFixed(1)}`;
  }).join(' ');
  const quant = (v) => {
    const step = 2 / (shown - 1);
    return Math.round((v + 1) / step) * step - 1;
  };
  const levelLines = Array.from({ length: shown }, (_, i) => -1 + (2 * i) / (shown - 1));

  const stages = [
    { k: 'Sample', v: `${sampleRateHz.toLocaleString()} Hz`, d: 'samples per second', tone: c.accent },
    { k: 'Quantise', v: `2^${n} = ${levelsTotal.toLocaleString()}`, d: 'amplitude levels', tone: c.violet },
    { k: 'Encode', v: `${n} bits`, d: 'per sample', tone: c.brand },
  ];

  return (
    <ChartFrame title="PCM pipeline" badge="analogue → samples → levels → bits">
      <div ref={ref}>
        <div className="flex flex-wrap items-stretch gap-2 px-3 pb-1 pt-3 sm:flex-nowrap">
          {stages.map((s, i) => (
            <div key={s.k} className="flex flex-1 items-center gap-2">
              <div className="min-w-0 flex-1 rounded-lg border bg-elevated/50 px-3 py-2" style={{ borderColor: `${s.tone}55` }}>
                <div className="font-mono text-[9.5px] uppercase tracking-[0.16em]" style={{ color: s.tone }}>{i + 1} · {s.k}</div>
                <div className="font-display tabular mt-0.5 truncate text-[15px] font-semibold text-ink">{s.v}</div>
                <div className="truncate text-[10.5px] text-muted">{s.d}</div>
              </div>
              <ArrowRight size={14} className="hidden shrink-0 text-faint sm:block" />
            </div>
          ))}
          <div className="flex-1 rounded-lg border border-emerald/50 bg-emerald/10 px-3 py-2">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-emerald-bright">Bit rate</div>
            <div className="font-display tabular mt-0.5 truncate text-[15px] font-semibold text-ink">{formatRate(bitRateBps).value} {formatRate(bitRateBps).unit}</div>
            <div className="truncate text-[10.5px] text-muted">R = n × fs</div>
          </div>
        </div>

        <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label="Illustration of sampling and quantisation" className="block">
          {levelLines.map((v, i) => (
            <line key={i} x1={P.l} x2={P.l + iw} y1={Y(v)} y2={Y(v)} stroke={c.violet} strokeOpacity="0.28" strokeDasharray="3 5" />
          ))}
          <line x1={P.l} x2={P.l + iw} y1={Y(0)} y2={Y(0)} stroke={c.grid} />
          <path d={sine} fill="none" stroke={c.accent} strokeWidth="1.6" opacity="0.85" />
          {Array.from({ length: S }, (_, i) => {
            const t = (i + 0.5) / S;
            const v = Math.sin(2 * Math.PI * cycles * t);
            const q = quant(v);
            return (
              <g key={i} className="cc-fade">
                <line x1={X(t)} x2={X(t)} y1={Y(0)} y2={Y(q)} stroke={c.brand} strokeWidth="1.6" />
                <circle cx={X(t)} cy={Y(q)} r="3.4" fill={c.brand} />
                <circle cx={X(t)} cy={Y(v)} r="2" fill={c.nodeBg} stroke={c.accent} strokeWidth="1.2" />
              </g>
            );
          })}
        </svg>
        <p className="px-3.5 pb-2.5 font-mono text-[10.5px] text-faint">
          Illustration only · {shown} of {levelsTotal.toLocaleString()} levels drawn · cyan = analogue, green = quantised samples
        </p>
      </div>
    </ChartFrame>
  );
}
