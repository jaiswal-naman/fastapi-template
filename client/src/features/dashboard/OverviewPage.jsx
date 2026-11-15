import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Gauge,
  Network,
  Plus,
  Radio,
  Send,
  Signal,
  Terminal,
  Timer,
  Play,
} from 'lucide-react';
import { useLabStore } from '../../store/labStore.js';
import { MetricTile } from '../../components/ui/MetricTile.jsx';
import { Panel, Badge } from '../../components/ui/Panel.jsx';
import { TopologyGlyph } from '../topology/TopologyGlyph.jsx';
import { HeroNetwork } from './HeroNetwork.jsx';
import { timeAgo } from './format.js';

const QUICK = [
  { to: '/network', label: 'Network Playground', desc: 'Build and break topologies in 2D or 3D.', icon: Network, tone: 'brand' },
  { to: '/packets', label: 'Packet Playground', desc: 'Transmit packets and trace every hop.', icon: Activity, tone: 'accent' },
  { to: '/observatory', label: 'Observatory', desc: 'Throughput, latency and loss charts.', icon: Gauge, tone: 'info' },
  { to: '/signal-studio', label: 'Signal Studio', desc: 'Line-coding waveforms, bit by bit.', icon: Signal, tone: 'violet' },
  { to: '/channel-lab', label: 'Channel Lab', desc: 'Nyquist, Shannon and noise limits.', icon: Radio, tone: 'warn' },
  { to: '/concepts', label: 'Concepts', desc: 'Formulas, conventions and guided demos.', icon: BookOpen, tone: 'brand' },
];

const TONE = {
  brand: 'bg-emerald/10 text-emerald-bright ring-emerald/25',
  accent: 'bg-accent/10 text-accent ring-accent/25',
  info: 'bg-info/10 text-info ring-info/25',
  violet: 'bg-violet/10 text-violet ring-violet/25',
  warn: 'bg-warn/10 text-warn ring-warn/25',
};

const STEPS = [
  { n: '01', title: 'Create a lab', text: 'Pick a starter topology.' },
  { n: '02', title: 'Transmit', text: 'Send a simulated packet.' },
  { n: '03', title: 'Inspect', text: 'Follow every hop and delay.' },
  { n: '04', title: 'Analyze', text: 'Chart metrics and save a report.' },
];

const EVENT_STYLE = {
  'packet.delivered': 'text-emerald-bright',
  'packet.hop': 'text-accent',
  'packet.queued': 'text-info',
  'packet.retransmit': 'text-warn',
  'packet.dropped': 'text-danger',
};

function eventDetail(ev) {
  if (ev.type === 'packet.hop') return `${ev.fromNodeId ?? '?'} → ${ev.toNodeId ?? '?'}${ev.hopIndex != null ? `  hop ${ev.hopIndex}` : ''}`;
  if (ev.type === 'packet.queued') return `${ev.nodeId ?? ''}  queue=${ev.queueLength ?? 0}`;
  if (ev.type === 'packet.dropped') return `${ev.nodeId ?? ''}  ${ev.reason ?? ''}`.trim();
  if (ev.type === 'packet.retransmit') return `attempt ${ev.attempt ?? '?'}  ${ev.reason ?? ''}`.trim();
  if (ev.type === 'packet.delivered') return `${ev.hops ?? '?'} hops${ev.totalDelayMs != null ? `  ${Number(ev.totalDelayMs).toFixed(3)} ms` : ''}`;
  return '';
}

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

  const open = async (id) => {
    await loadLab(id);
    navigate('/network');
  };

  return (
    <div className="space-y-5">
      {/* ───────── Hero ───────── */}
      <section className="panel-lg bracket page-enter relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--c-line) / 0.55) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-line) / 0.55) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 60% 100% at 85% 40%, #000 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 100% at 85% 40%, #000 0%, transparent 75%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--c-brand) / 0.22), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative grid items-center gap-6 p-6 md:p-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="eyebrow">
              <FlaskConical size={13} aria-hidden />
              <span>Interactive networking laboratory</span>
            </div>
            <h2 className="font-display mt-4 text-[2.2rem] font-bold leading-[1.05] tracking-tight text-ink md:text-[3rem]">
              Watch data <span className="gradient-text">move</span>
              <br />
              through the network.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              From binary signals to hop-by-hop packet delivery. Build a topology, send traffic and inspect every queue, delay and drop.
              All metrics are simulated and labelled as such.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link to="/create-lab" className="btn-primary">
                <Plus size={15} /> Create Lab
              </Link>
              <button type="button" className="btn-secondary" disabled={!hasLabs} onClick={() => open(labs[0].id)}>
                <Play size={14} /> Continue Experiment
              </button>
              <Link to="/concepts" className="btn-ghost">
                Explore Concepts <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-[520/300] w-full max-w-[560px]">
            <HeroNetwork />
          </div>
        </div>

        {/* workflow strip */}
        <ol className="relative grid border-t border-line/80 bg-canvas/30 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.n} className={`flex items-center gap-3 px-5 py-3.5 ${i ? 'border-t border-line/60 sm:border-l sm:border-t-0' : ''} ${i === 2 ? 'sm:border-t lg:border-t-0' : ''}`}>
              <span className="font-mono text-[11px] font-medium text-emerald-bright">{s.n}</span>
              <div className="min-w-0 leading-tight">
                <div className="text-[13px] font-semibold text-ink">{s.title}</div>
                <div className="truncate text-[11.5px] text-muted">{s.text}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── Metrics ───────── */}
      <section className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Session metrics">
        <MetricTile icon={FlaskConical} tone="brand" label="Active labs" value={labs.length} hint={hasLabs ? 'In this demo session' : 'None yet'} />
        <MetricTile icon={Send} tone="accent" label="Packets sent" value={hasMetrics ? metrics.sent : '—'} hint={hasMetrics ? 'Simulated' : 'No run yet'} />
        <MetricTile
          icon={CheckCircle2}
          tone="info"
          label="Delivery ratio"
          value={hasMetrics ? `${metrics.deliveryRatioPct.toFixed(1)}%` : '—'}
          hint={hasMetrics ? 'Simulated' : 'No run yet'}
        />
        <MetricTile
          icon={Timer}
          tone="violet"
          label="Average latency"
          value={hasMetrics && metrics.averageLatencyMs != null ? `${metrics.averageLatencyMs.toFixed(3)} ms` : '—'}
          hint={hasMetrics ? 'Simulated' : 'No run yet'}
        />
      </section>

      {/* ───────── Labs + activity ───────── */}
      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Panel
          title="Recent labs"
          icon={FlaskConical}
          subtitle={hasLabs ? `${labs.length} in this session` : 'Nothing here yet'}
          actions={
            <Link to="/experiments" className="btn-ghost btn-sm">
              View all <ArrowUpRight size={13} />
            </Link>
          }
          bodyClassName="p-2"
        >
          {loading ? (
            <ul className="space-y-1 p-2" aria-label="Loading labs">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-3 p-2">
                  <div className="skeleton h-12 w-16" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </li>
              ))}
            </ul>
          ) : !hasLabs ? (
            <div className="m-2 flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-canvas/30 px-6 py-9 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald/10 text-emerald-bright ring-1 ring-emerald/25">
                <FlaskConical size={22} />
              </div>
              <h4 className="font-display mt-4 text-base font-semibold text-ink">Your bench is empty</h4>
              <p className="mt-1 max-w-xs text-[13px] text-muted">Spin up a star, bus, ring or mesh topology and start sending packets in seconds.</p>
              <Link to="/create-lab" className="btn-primary mt-5">
                <Plus size={15} /> Create your first lab
              </Link>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {labs.slice(0, 6).map((lab) => {
                const active = currentLab?.id === lab.id;
                return (
                  <li key={lab.id}>
                    <button
                      type="button"
                      onClick={() => open(lab.id)}
                      className="group flex w-full items-center gap-3.5 rounded-xl p-2 text-left transition-colors hover:bg-raised/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald"
                    >
                      <span className="grid h-12 w-[68px] shrink-0 place-items-center rounded-lg border border-line bg-canvas/50 p-1">
                        <TopologyGlyph id={lab.template} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-ink">{lab.name}</span>
                          {active ? <Badge tone="brand" dot>active</Badge> : null}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-muted">
                          <span className="capitalize text-faint">{lab.template}</span>
                          <span>{lab.nodeCount} nodes</span>
                          <span>{lab.linkCount ?? 0} links</span>
                          <span className="text-faint">· {timeAgo(lab.updatedAt)}</span>
                        </span>
                      </span>
                      <span className="btn-secondary btn-sm shrink-0 opacity-90 transition group-hover:border-emerald/50 group-hover:text-emerald-bright">
                        Open <ArrowRight size={13} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* terminal-style activity feed */}
        <section className="panel flex min-h-[300px] flex-col overflow-hidden" aria-label="Live activity">
          <div className="flex items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/10 text-accent ring-1 ring-accent/25">
                <Terminal size={14} aria-hidden />
              </span>
              <div>
                <h3 className="section-title">Live activity</h3>
                <p className="text-[11.5px] text-muted">Socket events from the active lab</p>
              </div>
            </div>
            <Badge tone={liveEvents.length ? 'brand' : 'neutral'} dot={liveEvents.length > 0}>
              {liveEvents.length ? 'streaming' : 'idle'}
            </Badge>
          </div>
          <div className="flex-1 overflow-auto bg-canvas/50 p-4 font-mono text-[12px] leading-6">
            {!currentLab || liveEvents.length === 0 ? (
              <div className="text-muted">
                <div><span className="text-emerald-bright">$</span> tail -f lab.events</div>
                <div className="text-faint">
                  # events appear here only while a simulation runs — nothing is fabricated
                </div>
                <div className="mt-1">
                  <span className="text-emerald-bright">$</span> <span className="inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-emerald-bright" />
                </div>
              </div>
            ) : (
              <ul className="max-h-72 space-y-0.5 overflow-auto">
                {[...liveEvents].reverse().map((ev, idx) => (
                  <li key={`${ev.at}-${idx}`} className="flex gap-3 whitespace-nowrap">
                    <span className="shrink-0 text-faint">{new Date(ev.at).toLocaleTimeString([], { hour12: false })}</span>
                    <span className={`shrink-0 ${EVENT_STYLE[ev.type] || 'text-muted'}`}>{ev.type}</span>
                    <span className="truncate text-muted">{eventDetail(ev)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </section>

      {/* ───────── Quick start ───────── */}
      <section aria-label="Jump to a tool">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="eyebrow">Toolkit</div>
            <h3 className="font-display mt-1.5 text-lg font-semibold tracking-tight text-ink">Jump into a tool</h3>
          </div>
        </div>
        <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK.map(({ to, label, desc, icon: Icon, tone }) => (
            <Link key={to} to={to} className="panel-interactive group flex items-start gap-4 p-4">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${TONE[tone]}`}>
                <Icon size={19} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-[15px] font-semibold text-ink">{label}</span>
                  <ArrowUpRight size={16} className="shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-bright" />
                </div>
                <p className="mt-1 text-[12.5px] leading-snug text-muted">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
