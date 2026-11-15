import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

const ICON_TONE = {
  brand: 'text-emerald-bright bg-emerald/10 ring-emerald/25',
  accent: 'text-accent bg-accent/10 ring-accent/25',
  info: 'text-info bg-info/10 ring-info/25',
  violet: 'text-violet bg-violet/10 ring-violet/25',
  warn: 'text-warn bg-warn/10 ring-warn/25',
  danger: 'text-danger bg-danger/10 ring-danger/25',
};

/** KPI tile with icon, big value and an optional sparkline. `color` is a hex from useChartColors(). */
export function KpiTile({ className = '', label, value, unit, hint, icon: Icon, tone = 'brand', color, spark, loading }) {
  const gid = useId().replace(/:/g, '');
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  let domain = ['auto', 'auto'];
  if (hasSpark) {
    const vals = spark.map((d) => d.v);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = (hi - lo) || Math.abs(hi) || 1; // flat series → centred line
    domain = [lo - pad * 0.6, hi + pad * 0.6];
  }
  return (
    <div className={`metric-tile flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted">{label}</div>
        {Icon ? (
          <span className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ${ICON_TONE[tone] || ICON_TONE.brand}`}>
            <Icon size={15} aria-hidden />
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-24 sm:w-28" aria-label="Loading" />
      ) : (
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display tabular text-[1.45rem] font-semibold sm:text-[1.75rem] leading-none tracking-tight text-ink">{value}</span>
          {unit && value !== '—' ? <span className="font-mono text-[11px] text-muted">{unit}</span> : null}
        </div>
      )}
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-[11.5px] text-muted">{hint}</span>
        {hasSpark ? (
          <div className="h-8 w-20 shrink-0" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`sp${gid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={domain} />
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sp${gid})`} isAnimationActive={false} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </div>
  );
}
