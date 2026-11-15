export function MetricTile({ label, value, hint }) {
  return (
    <div className="metric-tile">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular tracking-tight text-ink">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted">{hint}</div> : null}
    </div>
  );
}
