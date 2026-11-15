import { useId } from 'react';
import { tone } from './tones.js';

const W = 900;
const H = 430;
const M = { left: 70, right: 24, top: 64, bottom: 34 };

/** Catmull-Rom spline through the points, as an SVG path. */
function smoothPath(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/**
 * Oscilloscope-style plot. Time runs left to right in equal slots (one per bit, symbol or sample).
 * `show` says how many slots of each progressive trace are revealed; `slot` is the one in focus.
 */
export function ScopeStage({ scope, show, slot, band, preview }) {
  const clipId = useId().replace(/:/g, '');
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const sw = plotW / scope.slots;
  const X = (t) => M.left + t * sw;
  const Y = (v) => M.top + ((scope.y.max - v) / (scope.y.max - scope.y.min)) * plotH;
  const shown = (id, progressive) => (preview || !progressive ? scope.slots : show?.[id] ?? 0);
  const noise = band ?? scope.band;
  const wave = scope.traces.find((t) => t.type === 'step');
  const labelCount = shown('top', scope.top.progressive);
  const dense = scope.slots > 10;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`h-full w-full ${preview ? 'opacity-60' : ''}`} role="img" aria-label="Signal plot">
      {/* focus slot */}
      {slot != null && !preview ? <rect x={X(slot)} y={M.top - 34} width={sw} height={plotH + 34 + 22} rx="8" className="fill-emerald/10" /> : null}

      {/* slot grid */}
      {Array.from({ length: scope.slots + 1 }, (_, i) => (
        <line key={i} x1={X(i)} x2={X(i)} y1={M.top - 6} y2={M.top + plotH} className="stroke-line" strokeDasharray="2 5" />
      ))}
      {scope.y.ticks.map((t) => (
        <g key={t.v}>
          <line x1={M.left} x2={W - M.right} y1={Y(t.v)} y2={Y(t.v)} className={t.v === 0 ? 'stroke-line-strong' : 'stroke-line'} />
          <text x={M.left - 12} y={Y(t.v) + 4} textAnchor="end" className="fill-muted font-mono text-[11px]">{t.label}</text>
        </g>
      ))}

      {/* top labels: the bits, symbols or codes */}
      <text x={M.left - 12} y={M.top - 16} textAnchor="end" className="fill-faint font-mono text-[9.5px] uppercase tracking-[0.12em]">{scope.top.caption}</text>
      {scope.top.labels.map((text, i) =>
        i < labelCount ? (
          <text
            key={i}
            x={X(i + 0.5)} y={M.top - 15}
            textAnchor="middle"
            className={`font-mono font-semibold ${dense || text.length > 2 ? 'text-[11.5px]' : 'text-[15px]'} ${slot === i && !preview ? 'fill-emerald-bright' : 'fill-ink'}`}
          >
            {text}
          </text>
        ) : null,
      )}
      {Array.from({ length: scope.slots }, (_, i) => (
        <text key={i} x={X(i + 0.5)} y={H - 12} textAnchor="middle" className="fill-faint font-mono text-[9.5px]">{i + 1}</text>
      ))}

      {/* noise band around each flat piece of the signal */}
      {noise && wave
        ? wave.values.map((v, i) => (
            <rect
              key={i}
              x={X(i / wave.perSlot)} width={sw / wave.perSlot}
              y={Y(v + noise)} height={Y(v - noise) - Y(v + noise)}
              className="fill-warn/25 transition-all duration-500"
            />
          ))
        : null}

      {scope.traces.map((t) => {
        const n = shown(t.id, t.progressive);
        if (t.type === 'curve') {
          const pts = t.points.map(([a, b]) => [X(a), Y(b)]);
          const d = t.smooth ? smoothPath(pts) : `M${pts.map((p) => p.join(' ')).join(' L')}`;
          return <path key={t.id} d={d} fill="none" className="stroke-muted" strokeWidth="2" strokeLinecap="round" />;
        }
        if (t.type === 'stems') {
          return (
            <g key={t.id}>
              {t.points.slice(0, n).map(([a, b], i) => (
                <g key={i} className="dcp-fade">
                  <line x1={X(a)} x2={X(a)} y1={Y(scope.y.min)} y2={Y(b)} className="stroke-info/50" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx={X(a)} cy={Y(b)} r="4.5" className="fill-info stroke-canvas" strokeWidth="2" />
                </g>
              ))}
            </g>
          );
        }
        // step trace: flat pieces joined by vertical edges, revealed left to right through a clip
        const piece = sw / t.perSlot;
        let d = '';
        t.values.forEach((v, i) => {
          d += `${i === 0 ? 'M' : 'L'}${X(i / t.perSlot)} ${Y(v)} L${X(i / t.perSlot) + piece} ${Y(v)} `;
        });
        return (
          <g key={t.id}>
            <clipPath id={`${clipId}-${t.id}`}>
              <rect
                x={M.left - 4} y="0" width={plotW + 8} height={H}
                style={{ transform: `scaleX(${n / scope.slots})`, transformOrigin: `${M.left - 4}px 0px`, transition: 'transform 520ms cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </clipPath>
            <path d={d} fill="none" clipPath={`url(#${clipId}-${t.id})`} className={tone(t.tone).stroke} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        );
      })}

      {/* substitution marks (V / B) above their pulses */}
      {wave
        ? scope.marks.map((m) =>
            m.slot < shown(wave.id, wave.progressive) ? (
              <g key={m.slot} transform={`translate(${X(m.slot + 0.5)}, ${M.top + plotH + 2})`} className="dcp-fade">
                <rect x="-10" y="-22" width="20" height="18" rx="5" className="fill-warn/15 stroke-warn/60" />
                <text y="-9" textAnchor="middle" className="fill-warn font-mono text-[11px] font-bold">{m.text}</text>
              </g>
            ) : null,
          )
        : null}
    </svg>
  );
}
