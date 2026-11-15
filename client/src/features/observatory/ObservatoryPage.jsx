import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { useLabStore } from '../../store/labStore.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { MetricTile } from '../../components/ui/MetricTile.jsx';

const tooltipStyle = {
  background: '#0D2620',
  border: '1px solid #285344',
  borderRadius: 8,
  color: '#F0FDF4',
  fontSize: 12,
};

export function ObservatoryPage() {
  const currentLab = useLabStore((s) => s.currentLab);
  const metrics = useLabStore((s) => s.metrics);
  const history = useLabStore((s) => s.metricsHistory);

  if (!currentLab) {
    return (
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
    );
  }

  const hasData = Boolean(metrics && metrics.sent > 0);
  const series = history.map((m, i) => ({
    i,
    throughputMbps: Number((m.throughputMbps || 0).toFixed(6)),
    latencyMs: m.currentLatencyMs ?? m.averageLatencyMs ?? 0,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Performance Observatory"
        title="Live simulated performance"
        description="Throughput, latency, jitter, loss and delivery ratio update only from simulation engine events."
        icon={Gauge}
        actions={<span className="status-pill">Lab: {currentLab.name}</span>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="Throughput" value={hasData ? `${(metrics.throughputMbps || 0).toFixed(4)} Mbps` : '—'} hint="Simulated" />
        <MetricTile
          label="Latency"
          value={hasData && metrics.averageLatencyMs != null ? `${metrics.averageLatencyMs.toFixed(3)} ms` : '—'}
          hint="Simulated"
        />
        <MetricTile
          label="Jitter"
          value={hasData && metrics.jitterMs != null ? `${metrics.jitterMs.toFixed(3)} ms` : '—'}
          hint="Mean abs. Δ delay"
        />
        <MetricTile label="Packet loss" value={hasData ? `${metrics.lossPct.toFixed(1)}%` : '—'} hint="Simulated" />
        <MetricTile label="Delivery ratio" value={hasData ? `${metrics.deliveryRatioPct.toFixed(1)}%` : '—'} hint="Simulated" />
      </section>

      {!hasData ? (
        <div className="empty-state">
          No simulation has run for this lab yet.
          <div className="mt-4">
            <Link to="/packets" className="btn-primary">
              Go to Packet Playground
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="panel-lg p-5">
              <h3 className="mb-3 section-title">Throughput over time (Mbps)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid stroke="#285344" strokeDasharray="3 3" />
                    <XAxis dataKey="i" stroke="#A7C4B8" fontSize={11} />
                    <YAxis stroke="#A7C4B8" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="throughputMbps" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="panel-lg p-5">
              <h3 className="mb-3 section-title">Latency over time (ms)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid stroke="#285344" strokeDasharray="3 3" />
                    <XAxis dataKey="i" stroke="#A7C4B8" fontSize={11} />
                    <YAxis stroke="#A7C4B8" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="latencyMs" stroke="#60A5FA" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="panel-lg p-5">
              <h3 className="mb-3 section-title">Packet counts</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Sent', value: metrics.sent },
                      { name: 'Delivered', value: metrics.delivered },
                      { name: 'Dropped', value: metrics.dropped },
                      { name: 'Retransmits', value: metrics.retransmits },
                    ]}
                  >
                    <CartesianGrid stroke="#285344" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#A7C4B8" fontSize={11} />
                    <YAxis stroke="#A7C4B8" allowDecimals={false} fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="#34D399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="panel-lg p-5 text-sm">
              <h3 className="mb-3 section-title">Delay breakdown (last sample)</h3>
              {metrics.delays ? (
                <ul className="space-y-2 font-mono text-xs">
                  <li className="flex justify-between border-b border-line/50 py-1.5">
                    <span className="text-muted">Transmission</span>
                    <span>{metrics.delays.transmission.toFixed(4)} ms</span>
                  </li>
                  <li className="flex justify-between border-b border-line/50 py-1.5">
                    <span className="text-muted">Propagation</span>
                    <span>{metrics.delays.propagation.toFixed(4)} ms</span>
                  </li>
                  <li className="flex justify-between border-b border-line/50 py-1.5">
                    <span className="text-muted">Queueing</span>
                    <span>{metrics.delays.queueing.toFixed(4)} ms</span>
                  </li>
                  <li className="flex justify-between py-1.5">
                    <span className="text-muted">Processing</span>
                    <span>{metrics.delays.processing.toFixed(4)} ms</span>
                  </li>
                </ul>
              ) : (
                <p className="text-muted">No delay sample yet.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
