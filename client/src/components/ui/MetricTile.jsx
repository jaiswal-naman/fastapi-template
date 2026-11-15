const TONES = {
  brand: 'text-emerald-bright bg-emerald/10 ring-emerald/25',
  accent: 'text-accent bg-accent/10 ring-accent/25',
  info: 'text-info bg-info/10 ring-info/25',
  violet: 'text-violet bg-violet/10 ring-violet/25',
  warn: 'text-warn bg-warn/10 ring-warn/25',
  danger: 'text-danger bg-danger/10 ring-danger/25',
};

export function MetricTile({ label, value, hint, icon: Icon, tone = 'brand' }) {
  return (
    <div className="metric-tile group">
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted">{label}</div>
        {Icon ? (
          <span className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ${TONES[tone] || TONES.brand}`}>
            <Icon size={15} aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="font-display tabular mt-3 text-[1.85rem] font-semibold leading-none tracking-tight text-ink">{value}</div>
      {hint ? <div className="mt-2 text-[11.5px] text-muted">{hint}</div> : null}
    </div>
  );
}
