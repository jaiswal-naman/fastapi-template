import { useId } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, BarChart3, Gauge, Hourglass, LineChart as LineChartIcon, PackageCheck, PackageX, Send, Timer, TrendingUp,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useLabStore } from '../../store/labStore.js';
import { useChartColors } from '../../lib/theme.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge, Panel } from '../../components/ui/Panel.jsx';
import { KpiTile } from './KpiTile.jsx';

function ChartTip({ active, payload, label, unit, digits = 4, colors }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={colors.tooltip} className="px-3 py-2">
      <div className="mb-1 text-[10.5px] uppercase tracking-wider opacity-70">Sample #{Number(label) + 1}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[12px]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke }} />
          <span className="font-semibold tabular">{Number(p.value).toFixed(digits)}</span>
          <span className="opacity-60">{unit}</span>
        </div>
      ))}
    </div>
  );
}

function SeriesChart({ data, dataKey, color, unit, digits, colors }) {
  const gid = useId().replace(/:/g, '');
  const single = data.length < 2;
  return (
    <div>
      <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.38} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="i" tickLine={false} axisLine={{ stroke: colors.grid }} tick={{ fill: colors.axis, fontSize: 11 }} tickFormatter={(v) => `#${v + 1}`} allowDecimals={false} />
          <YAxis width={44} tickLine={false} axisLine={false} tick={{ fill: colors.axis, fontSize: 11 }} tickFormatter={fmtTick} />
          <Tooltip cursor={{ stroke: colors.axis, strokeDasharray: '3 3' }} content={<ChartTip unit={unit} digits={digits} colors={colors} />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.25}
            fill={`url(#g${gid})`}
            dot={data.length === 1 ? { r: 4, fill: color, stroke: colors.tooltipBg, strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: color, stroke: colors.tooltipBg, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
      {single ? (
        <p className="-mt-1 text-center font-mono text-[10.5px] text-faint">
          {data.length === 0
            ? 'Totals were loaded from the lab — transmit a packet to start plotting samples.'
            : '1 sample so far — run more transmissions to see a trend.'}
        </p>
      ) : null}
    </div>
  );
}

const fmtTick = (v) => {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a < 0.01) return v.toExponential(0).replace('e-', 'e−');
  return Number(v.toFixed(a < 1 ? 3 : 2)).toString();
};

const DELAY_SEGMENTS = [
  { key: 'transmission', label: 'Transmission', dot: 'bg-info', bar: 'bg-info' },
  { key: 'propagation', label: 'Propagation', dot: 'bg-accent', bar: 'bg-accent' },
  { key: 'queueing', label: 'Queueing', dot: 'bg-warn', bar: 'bg-warn' },
  { key: 'processing', label: 'Processing', dot: 'bg-violet', bar: 'bg-violet' },
];

function DelayBreakdown({ delays }) {
  if (!delays) return <p className="text-sm text-muted">No delay sample yet.</p>;
  const total = DELAY_SEGMENTS.reduce((s, x) => s + (delays[x.key] || 0), 0);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-display tabular text-[1.6rem] font-semibold leading-none text-ink">{total.toFixed(4)}<span className="ml-1 font-mono text-[11px] font-normal text-muted">ms total</span></span>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-raised" role="img" aria-label="Delay breakdown">
        {DELAY_SEGMENTS.map((s) => {
          const v = delays[s.key] || 0;
          return v > 0 && total > 0 ? <span key={s.key} className={`${s.bar} first:rounded-l-full last:rounded-r-full`} style={{ width: `${(v / total) * 100}%` }} /> : null;
        })}
      </div>
      <ul className="mt-4 space-y-2.5">
        {DELAY_SEGMENTS.map((s) => {
          const v = delays[s.key] || 0;
          const pct = total > 0 ? (v / total) * 100 : 0;
          return (
            <li key={s.key} className="grid grid-cols-[1fr_auto_44px] items-center gap-3 text-[12.5px]">
              <span className="flex items-center gap-2 text-muted"><span className={`h-2 w-2 rounded-full ${s.dot}`} />{s.label}</span>
              <span className="font-mono tabular text-ink">{v.toFixed(4)} ms</span>
              <span className="text-right font-mono text-[11px] tabular text-faint">{pct.toFixed(0)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DeliveryRing({ metrics }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const delivered = Math.max(0, Math.min(100, metrics.deliveryRatioPct || 0));
  const lost = Math.max(0, Math.min(100 - delivered, metrics.lossPct || 0));
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:flex-col xl:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" role="img" aria-label={`Delivery ratio ${delivered.toFixed(1)} percent`}>
          <circle cx="64" cy="64" r={R} fill="none" strokeWidth="12" className="stroke-raised" />
          <circle cx="64" cy="64" r={R} fill="none" strokeWidth="12" strokeLinecap="round" className="stroke-emerald transition-all duration-700" strokeDasharray={`${(delivered / 100) * C} ${C}`} />
          {lost > 0 ? (
            <circle cx="64" cy="64" r={R} fill="none" strokeWidth="12" strokeLinecap="round" className="stroke-danger transition-all duration-700" strokeDasharray={`${(lost / 100) * C} ${C}`} strokeDashoffset={-(delivered / 100) * C} />
          ) : null}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-display tabular text-[1.55rem] font-semibold leading-none text-ink">{delivered.toFixed(1)}%</div>
            <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">delivered</div>
          </div>
        </div>
      </div>
      <ul className="w-full max-w-[180px] space-y-2 text-[12.5px]">
        {[
          ['Delivered', metrics.delivered, 'bg-emerald'],
          ['Dropped', metrics.dropped, 'bg-danger'],
          ['Retransmits', metrics.retransmits, 'bg-warn'],
        ].map(([k, v, dot]) => (
          <li key={k} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted"><span className={`h-2 w-2 rounded-full ${dot}`} />{k}</span>
            <span className="font-mono tabular text-ink">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = [
  { icon: Send, title: 'Compose a packet', body: 'Open the Packet Playground and choose a source, destination and transport mode.' },
  { icon: Activity, title: 'Transmit', body: 'Send a TCP_SIM or UDP_SIM message. The engine emits real simulation events.' },
  { icon: Gauge, title: 'Watch metrics land', body: 'Throughput, latency, jitter and loss update here from those events only.' },
];

function EmptyObservatory({ loading }) {
  return (
    <div className="panel-lg bracket relative overflow-hidden">
      {/* ghost chart */}
      <svg className="absolute inset-0 h-full w-full text-line-strong" preserveAspectRatio="none" viewBox="0 0 800 300" aria-hidden>
        {[60, 120, 180, 240].map((y) => <line key={y} x1="0" x2="800" y1={y} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" opacity="0.5" />)}
        <path d="M0 240 C 100 220, 160 180, 240 190 S 380 120, 460 140 S 620 60, 800 90" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 8" opacity="0.7" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/70 to-surface/10" aria-hidden />
      <div className="relative px-5 pb-6 pt-14 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald/10 text-emerald-bright ring-1 ring-emerald/25">
            {loading ? <Hourglass size={22} className="animate-pulse" /> : <LineChartIcon size={22} />}
          </span>
          <h3 className="font-display mt-4 text-xl font-semibold tracking-tight text-ink">
            {loading ? 'Waiting for the first results…' : 'No simulation has run for this lab yet'}
          </h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            {loading
              ? 'A transmission is in progress. Charts appear as soon as the engine reports its first metrics.'
              : 'Charts stay empty until the engine produces data — values are never invented for idle labs.'}
          </p>
        </div>
        <ol className="stagger mx-auto mt-7 grid max-w-4xl gap-3 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-xl border border-line bg-surface/80 p-4 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald/10 font-mono text-[11px] font-semibold text-emerald-bright ring-1 ring-emerald/25">{i + 1}</span>
                <Icon size={15} className="text-muted" aria-hidden />
              </div>
              <div className="mt-3 text-[13.5px] font-semibold text-ink">{title}</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex justify-center">
          <Link to="/packets" className="btn-primary px-5 py-2.5"><Send size={15} /> Go to Packet Playground</Link>
        </div>
      </div>
    </div>
  );
}

export function ObservatoryPage() {
  const currentLab = useLabStore((s) => s.currentLab);
  const metrics = useLabStore((s) => s.metrics);
  const rawHistory = useLabStore((s) => s.metricsHistory);
  const simulationStatus = useLabStore((s) => s.simulationStatus);
  const colors = useChartColors();

  if (!currentLab) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Performance Observatory"
          title="Simulator-derived metrics"
          description="Open a lab and run a transmission to populate charts. Values are never invented for idle labs."
          icon={Gauge}
          actions={
            <Link to="/create-lab" className="btn-primary">
              Create Lab
            </Link>
          }
        />
        <EmptyObservatory />
      </div>
    );
  }

  // The same server snapshot can be delivered twice if socket listeners are duplicated; collapse by timestamp.
  const history = rawHistory.filter((m, i, a) => i === 0 || m.timestamp == null || m.timestamp !== a[i - 1].timestamp);
  const hasData = Boolean(metrics && metrics.sent > 0);
  const loading = !hasData && (simulationStatus === 'running' || simulationStatus === 'validating');
  const series = history.map((m, i) => ({
    i,
    throughputMbps: Number((m.throughputMbps || 0).toFixed(6)),
    latencyMs: m.currentLatencyMs ?? m.averageLatencyMs ?? 0,
  }));
  const spark = (pick) => history.map((m) => ({ v: pick(m) ?? 0 }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Performance Observatory"
        title="Live simulated performance"
        description="Throughput, latency, jitter, loss and delivery ratio update only from simulation engine events."
        icon={Gauge}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {simulationStatus === 'running' ? <Badge tone="brand" dot>Live</Badge> : null}
            <span className="status-pill">Lab: {currentLab.name}</span>
            <span className="status-pill tabular">{history.length} sample{history.length === 1 ? '' : 's'}</span>
          </div>
        }
      />

      <section className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Key metrics">
        <KpiTile
          label="Throughput"
          icon={TrendingUp}
          tone="brand"
          color={colors.brand}
          loading={loading}
          value={hasData ? (metrics.throughputMbps || 0).toFixed(4) : '—'}
          unit="Mbps"
          hint="Simulated"
          spark={spark((m) => m.throughputMbps)}
        />
        <KpiTile
          label="Latency"
          icon={Timer}
          tone="info"
          color={colors.info}
          loading={loading}
          value={hasData && metrics.averageLatencyMs != null ? metrics.averageLatencyMs.toFixed(3) : '—'}
          unit="ms"
          hint="Simulated avg."
          spark={spark((m) => m.currentLatencyMs ?? m.averageLatencyMs)}
        />
        <KpiTile
          label="Jitter"
          icon={Activity}
          tone="violet"
          color={colors.violet}
          loading={loading}
          value={hasData && metrics.jitterMs != null ? metrics.jitterMs.toFixed(3) : '—'}
          unit="ms"
          hint="Mean |Δ delay|"
          spark={spark((m) => m.jitterMs)}
        />
        <KpiTile
          label="Packet loss"
          icon={PackageX}
          tone={hasData && metrics.lossPct > 0 ? 'danger' : 'brand'}
          color={hasData && metrics.lossPct > 0 ? colors.danger : colors.brand}
          loading={loading}
          value={hasData ? metrics.lossPct.toFixed(1) : '—'}
          unit="%"
          hint="Simulated"
          spark={spark((m) => m.lossPct)}
        />
        <KpiTile
          className="col-span-2 sm:col-span-1"
          label="Delivery ratio"
          icon={PackageCheck}
          tone="accent"
          color={colors.accent}
          loading={loading}
          value={hasData ? metrics.deliveryRatioPct.toFixed(1) : '—'}
          unit="%"
          hint="Simulated"
          spark={spark((m) => m.deliveryRatioPct)}
        />
      </section>

      {!hasData ? (
        <EmptyObservatory loading={loading} />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Throughput over time" subtitle="Mbps · simulated" icon={TrendingUp} actions={<Badge tone="brand">{(metrics.throughputMbps || 0).toFixed(4)} Mbps</Badge>}>
              <SeriesChart data={series} dataKey="throughputMbps" color={colors.brand} unit="Mbps" digits={6} colors={colors} />
            </Panel>
            <Panel title="Latency over time" subtitle="ms · per sample" icon={Timer} actions={metrics.averageLatencyMs != null ? <Badge tone="info">avg {metrics.averageLatencyMs.toFixed(3)} ms</Badge> : null}>
              <SeriesChart data={series} dataKey="latencyMs" color={colors.info} unit="ms" digits={4} colors={colors} />
            </Panel>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Panel title="Packet counts" subtitle="Totals for this lab" icon={BarChart3}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Sent', value: metrics.sent, color: colors.info },
                      { name: 'Delivered', value: metrics.delivered, color: colors.brandSolid },
                      { name: 'Dropped', value: metrics.dropped, color: colors.danger },
                      { name: 'Retrans.', value: metrics.retransmits, color: colors.warn },
                    ]}
                    margin={{ top: 18, right: 8, bottom: 0, left: -18 }}
                  >
                    <CartesianGrid stroke={colors.grid} strokeDasharray="3 4" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: colors.grid }} tick={{ fill: colors.axis, fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: colors.axis, fontSize: 11 }} />
                    <Tooltip cursor={{ fill: colors.grid }} contentStyle={colors.tooltip} itemStyle={{ color: colors.text }} labelStyle={{ color: colors.axis }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {[colors.info, colors.brandSolid, colors.danger, colors.warn].map((c, i) => <Cell key={i} fill={c} />)}
                      <LabelList dataKey="value" position="top" fill={colors.text} fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Delay breakdown" subtitle="Last sample" icon={Hourglass}>
              <DelayBreakdown delays={metrics.delays} />
            </Panel>

            <Panel title="Delivery vs loss" subtitle="Share of sent packets" icon={PackageCheck}>
              <DeliveryRing metrics={metrics} />
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}
