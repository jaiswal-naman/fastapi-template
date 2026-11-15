/** Data colours used across the Explorer. Class names are written out in full so Tailwind keeps them. */
const TONES = {
  brand: { text: 'text-emerald-bright', dot: 'bg-emerald', chip: 'border-emerald/40 bg-emerald/10 text-emerald-bright', stroke: 'stroke-emerald', fill: 'fill-emerald', soft: 'fill-emerald/15' },
  info: { text: 'text-info', dot: 'bg-info', chip: 'border-info/40 bg-info/10 text-info', stroke: 'stroke-info', fill: 'fill-info', soft: 'fill-info/15' },
  violet: { text: 'text-violet', dot: 'bg-violet', chip: 'border-violet/40 bg-violet/10 text-violet', stroke: 'stroke-violet', fill: 'fill-violet', soft: 'fill-violet/15' },
  warn: { text: 'text-warn', dot: 'bg-warn', chip: 'border-warn/40 bg-warn/10 text-warn', stroke: 'stroke-warn', fill: 'fill-warn', soft: 'fill-warn/15' },
  danger: { text: 'text-danger', dot: 'bg-danger', chip: 'border-danger/40 bg-danger/10 text-danger', stroke: 'stroke-danger', fill: 'fill-danger', soft: 'fill-danger/15' },
  muted: { text: 'text-muted', dot: 'bg-muted', chip: 'border-line-strong bg-elevated text-muted', stroke: 'stroke-muted', fill: 'fill-muted', soft: 'fill-muted/15' },
};

export const tone = (name) => TONES[name] || TONES.muted;
