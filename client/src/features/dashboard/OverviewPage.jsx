import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FlaskConical, Network, Signal, Gauge } from 'lucide-react';
import { useLabStore } from '../../store/labStore.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { MetricTile } from '../../components/ui/MetricTile.jsx';

export function OverviewPage() {
  const navigate = useNavigate();
  const labs = useLabStore((s) => s.labs);
  const refreshLabs = useLabStore((s) => s.refreshLabs);
  const loadLab = useLabStore((s) => s.loadLab);
  const metrics = useLabStore((s) => s.metrics);
  const liveEvents = useLabStore((s) => s.liveEvents);
  const currentLab = useLabStore((s) => s.currentLab);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshLabs()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshLabs]);

  const hasLabs = labs.length > 0;
  const hasMetrics = Boolean(metrics && metrics.sent > 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Overview"
        title="Welcome to DataComPredia"
        description="An interactive laboratory for understanding how data moves through networks — from binary signals to hop-by-hop packet delivery. Metrics are simulated and labelled as such."
        icon={FlaskConical}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/create-lab" className="btn-primary">
              Create Lab
            </Link>
            <button
              type="button"
              className="btn-secondary"
              disabled={!hasLabs}
              onClick={async () => {
                await loadLab(labs[0].id);
                navigate('/network');
              }}
            >
              Continue Experiment
            </button>
            <Link to="/concepts" className="btn-secondary">
              Explore Concepts
            </Link>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Active labs" value={labs.length} hint={hasLabs ? 'This demo session' : 'Empty'} />
        <MetricTile label="Packets sent" value={hasMetrics ? metrics.sent : '—'} hint={hasMetrics ? 'Simulated' : 'No run yet'} />
        <MetricTile
          label="Delivery ratio"
          value={hasMetrics ? `${metrics.deliveryRatioPct.toFixed(1)}%` : '—'}
          hint={hasMetrics ? 'Simulated' : 'No run yet'}
        />
        <MetricTile
          label="Average latency"
          value={hasMetrics && metrics.averageLatencyMs != null ? `${metrics.averageLatencyMs.toFixed(3)} ms` : '—'}
          hint={hasMetrics ? 'Simulated' : 'No run yet'}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel-lg p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="section-title">Recent labs</h3>
            <Link to="/experiments" className="text-xs text-emerald-bright hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="mt-3 text-sm text-muted">Loading…</p>
          ) : !hasLabs ? (
            <div className="empty-state mt-4">
              No experiments have been created yet.
              <div className="mt-4">
                <Link to="/create-lab" className="btn-primary">
                  Create your first lab
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {labs.slice(0, 6).map((lab) => (
                <li key={lab.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{lab.name}</div>
                    <div className="text-xs text-muted">
                      {lab.template} · {lab.nodeCount} nodes · {new Date(lab.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary shrink-0"
                    onClick={async () => {
                      await loadLab(lab.id);
                      navigate('/network');
                    }}
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-lg p-5">
          <h3 className="section-title">Live activity</h3>
          {!currentLab || liveEvents.length === 0 ? (
            <div className="empty-state mt-4">
              Activity appears only while a lab simulation is active. No fabricated feed.
            </div>
          ) : (
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto">
              {[...liveEvents].reverse().map((ev, idx) => (
                <li key={`${ev.at}-${idx}`} className="rounded-lg border border-line bg-elevated/40 px-3 py-2">
                  <div className="font-mono text-xs text-emerald-bright">{ev.type}</div>
                  <div className="text-[11px] text-muted">{new Date(ev.at).toLocaleTimeString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { to: '/network', label: 'Network Playground', desc: 'Edit topology in 2D / 3D', icon: Network },
          { to: '/signal-studio', label: 'Signal Studio', desc: 'Line coding waveforms', icon: Signal },
          { to: '/observatory', label: 'Observatory', desc: 'Simulated performance', icon: Gauge },
        ].map(({ to, label, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="panel group flex items-center justify-between gap-3 p-4 transition hover:border-emerald/50"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg border border-line bg-elevated p-2 text-emerald-bright">
                <Icon size={16} />
              </span>
              <div>
                <div className="font-medium text-ink">{label}</div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-muted transition group-hover:text-emerald-bright" />
          </Link>
        ))}
      </section>
    </div>
  );
}
