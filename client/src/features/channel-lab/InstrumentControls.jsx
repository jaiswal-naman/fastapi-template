import { useId } from 'react';

/** Component-scoped styles for the instrument sliders (kept out of the global stylesheet). */
export const INSTRUMENT_CSS = `
.cl-range { -webkit-appearance: none; appearance: none; width: 100%; height: 24px; background: transparent; cursor: pointer; margin: 0; }
.cl-range:focus { outline: none; }
.cl-range::-webkit-slider-runnable-track {
  height: 6px; border-radius: 999px;
  background: linear-gradient(90deg, rgb(var(--c-brand)) 0, rgb(var(--c-accent)) var(--p, 50%), rgb(var(--c-line-strong)) var(--p, 50%));
  box-shadow: inset 0 1px 2px rgb(0 0 0 / .25);
}
.cl-range::-moz-range-track {
  height: 6px; border-radius: 999px;
  background: linear-gradient(90deg, rgb(var(--c-brand)) 0, rgb(var(--c-accent)) var(--p, 50%), rgb(var(--c-line-strong)) var(--p, 50%));
}
.cl-range::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px; margin-top: -6px; border-radius: 50%;
  background: rgb(var(--c-surface)); border: 2.5px solid rgb(var(--c-brand-bright));
  box-shadow: 0 0 0 4px rgb(var(--c-brand) / .14), 0 3px 8px rgb(0 0 0 / .35);
  transition: box-shadow .15s, transform .15s;
}
.cl-range::-moz-range-thumb {
  width: 14px; height: 14px; border-radius: 50%;
  background: rgb(var(--c-surface)); border: 2.5px solid rgb(var(--c-brand-bright));
  box-shadow: 0 0 0 4px rgb(var(--c-brand) / .14), 0 3px 8px rgb(0 0 0 / .35);
}
.cl-range:hover::-webkit-slider-thumb { transform: scale(1.1); }
.cl-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 6px rgb(var(--c-brand) / .35), 0 3px 8px rgb(0 0 0 / .35); }
.cl-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 6px rgb(var(--c-brand) / .35); }
.cl-num::-webkit-outer-spin-button, .cl-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.cl-num { -moz-appearance: textfield; }
`;

const TICKS = 1000;

/** Round to 3 significant figures so log sliders yield tidy values. */
function nice(v) {
  if (!Number.isFinite(v) || v === 0) return v;
  const p = 10 ** (Math.floor(Math.log10(Math.abs(v))) - 2);
  return Math.round(v / p) * p;
}

const SCALES = {
  linear: {
    toPos: (v, o) => ((v - o.sliderMin) / (o.sliderMax - o.sliderMin)) * TICKS,
    fromPos: (t, o) => {
      const raw = o.sliderMin + (t / TICKS) * (o.sliderMax - o.sliderMin);
      const st = o.step && o.step !== 'any' ? Number(o.step) : 1;
      return Math.round(raw / st) * st;
    },
  },
  log: {
    toPos: (v, o) => ((Math.log10(Math.max(v, o.sliderMin)) - Math.log10(o.sliderMin)) / (Math.log10(o.sliderMax) - Math.log10(o.sliderMin))) * TICKS,
    fromPos: (t, o) => nice(10 ** (Math.log10(o.sliderMin) + (t / TICKS) * (Math.log10(o.sliderMax) - Math.log10(o.sliderMin)))),
  },
  pow2: {
    toPos: (v, o) => ((Math.log2(Math.max(v, o.sliderMin)) - Math.log2(o.sliderMin)) / (Math.log2(o.sliderMax) - Math.log2(o.sliderMin))) * TICKS,
    fromPos: (t, o) => 2 ** Math.round(Math.log2(o.sliderMin) + (t / TICKS) * (Math.log2(o.sliderMax) - Math.log2(o.sliderMin))),
  },
};

const fmtEdge = (v) => (v >= 1e6 ? `${v / 1e6}M` : v >= 1e3 ? `${v / 1e3}k` : `${v}`);

/**
 * Instrument-style control: numeric readout (source of truth) + synced slider.
 * scale: 'linear' | 'log' | 'pow2'
 */
export function InstrumentField({
  label, unit, value, onChange, min = 0, step = 'any', allowNegative = false,
  scale, sliderMin, sliderMax, hint,
}) {
  const reactId = useId().replace(/:/g, '');
  // keep the label-derived id for stable form semantics
  const id = `${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${reactId}`;
  const opts = { sliderMin, sliderMax, step };
  const hasSlider = scale && SCALES[scale];
  const pos = hasSlider ? Math.min(TICKS, Math.max(0, SCALES[scale].toPos(Number(value) || sliderMin, opts))) : 0;

  return (
    <div className="rounded-xl border border-line bg-canvas/40 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <label className="label !mb-0" htmlFor={id}>{label}</label>
        <div className="relative w-[156px]">
          <input
            id={id}
            type="number"
            className="field cl-num !py-1.5 text-right font-mono text-[14px] tabular"
            style={{ paddingRight: unit ? `${12 + unit.length * 7}px` : undefined }}
            value={Number.isFinite(value) ? value : ''}
            min={allowNegative ? undefined : min}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            required
          />
          {unit ? (
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10.5px] text-faint">{unit}</span>
          ) : null}
        </div>
      </div>
      {hasSlider ? (
        <div className="mt-2.5">
          <input
            type="range"
            className="cl-range"
            min={0}
            max={TICKS}
            step={1}
            value={pos}
            aria-label={`${label} slider`}
            style={{ '--p': `${(pos / TICKS) * 100}%` }}
            onChange={(e) => onChange(SCALES[scale].fromPos(Number(e.target.value), opts))}
          />
          <div className="mt-0.5 flex justify-between font-mono text-[10px] text-faint">
            <span>{fmtEdge(sliderMin)}</span>
            {scale === 'log' ? <span>log scale</span> : scale === 'pow2' ? <span>powers of 2</span> : <span />}
            <span>{fmtEdge(sliderMax)}</span>
          </div>
        </div>
      ) : null}
      {hint ? <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}
