import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Download, FileText, ListTree, SlidersHorizontal, StickyNote } from 'lucide-react';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Panel, Badge } from '../../components/ui/Panel.jsx';
import { MetricTile } from '../../components/ui/MetricTile.jsx';

const UNITS = { Pct: '(%)', Ms: '(ms)', Mbps: '(Mbps)', Kbps: '(kbps)' };

function humanize(key) {
  const words = key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim().split(/\s+/);
  const last = words[words.length - 1];
  const unit = words.length > 1 ? UNITS[last.charAt(0).toUpperCase() + last.slice(1)] : null;
  const label = (unit ? words.slice(0, -1) : words).join(' ');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}${unit ? ` ${unit}` : ''}`;
}

function eventTone(type = '') {
  if (type.includes('deliver')) return 'bg-emerald text-on-brand';
  if (type.includes('drop') || type.includes('fail')) return 'bg-danger';
  if (type.includes('retransmit')) return 'bg-warn';
  if (type.includes('queue')) return 'bg-info';
  return 'bg-accent';
}

export function ExperimentReportPage() {
  const { experimentId } = useParams();
  const [experiment, setExperiment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getExperiment(experimentId)
      .then((r) => setExperiment(r.experiment))
      .catch((err) => setError(err.message));
  }, [experimentId]);

  function exportCsv() {
    if (!experiment) return;
    const rows = [
      ['field', 'value'],
      ['name', experiment.name],
      ['protocol', experiment.protocol || ''],
      ['source', experiment.sourceNodeId || ''],
      ['destination', experiment.destinationNodeId || ''],
      ['createdAt', experiment.createdAt],
      ['observations', experiment.observations || ''],
    ];
    if (experiment.metricsSummary) {
      Object.entries(experiment.metricsSummary).forEach(([k, v]) => {
        if (typeof v !== 'object') rows.push([`metric.${k}`, String(v)]);
      });
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experiment.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <div className="panel-lg mx-auto flex max-w-lg flex-col items-center p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-danger/10 text-danger ring-1 ring-danger/30">
          <AlertTriangle size={22} />
        </span>
        <h3 className="font-display mt-4 text-lg font-semibold text-ink">Couldn't load this report</h3>
        <p className="mt-1 text-sm text-danger">{error}</p>
        <Link to="/experiments" className="btn-secondary mt-5">
          <ArrowLeft size={14} /> Back to experiments
        </Link>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="space-y-5" aria-label="Loading report">
        <div className="skeleton h-40 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton h-56" />
          <div className="skeleton h-56" />
        </div>
      </div>
    );
  }

  const summary = experiment.metricsSummary
    ? Object.entries(experiment.metricsSummary).filter(([, v]) => typeof v !== 'object' || v === null)
    : null;
  const events = experiment.events || [];
  const nodes = experiment.topologySnapshot?.nodes?.length ?? 0;
  const links = experiment.topologySnapshot?.links?.length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Experiment report"
        title={experiment.name}
        icon={FileText}
        description={`Saved ${new Date(experiment.createdAt).toLocaleString()}. Values below are from the simulation engine.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={exportCsv}>
              <Download size={14} /> Export CSV
            </button>
            <Link to="/experiments" className="btn-ghost">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        }
      />

      <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Protocol" value={experiment.protocol || '—'} tone="brand" hint="Simulated transport" />
        <MetricTile label="Nodes" value={nodes} tone="accent" hint="In topology snapshot" />
        <MetricTile label="Links" value={links} tone="info" hint="In topology snapshot" />
        <MetricTile label="Events" value={events.length} tone="violet" hint="Stored timeline entries" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Configuration" icon={SlidersHorizontal} bodyClassName="px-4 py-1">
          <dl className="text-sm">
            <Row k="Protocol" v={<Badge tone="brand">{experiment.protocol || '—'}</Badge>} />
            <Row k="Source" v={experiment.sourceNodeId || '—'} mono />
            <Row k="Destination" v={experiment.destinationNodeId || '—'} mono />
            <Row k="Nodes in snapshot" v={String(nodes)} mono />
            <Row k="Links in snapshot" v={String(links)} mono />
          </dl>
        </Panel>

        <Panel title="Metrics summary" icon={ListTree} actions={<Badge tone="info">Simulated</Badge>} bodyClassName="px-4 py-1">
          {summary && summary.length ? (
            <dl className="text-sm">
              {summary.map(([k, v]) => (
                <Row key={k} k={humanize(k)} v={String(v)} mono />
              ))}
            </dl>
          ) : (
            <p className="py-4 text-sm text-muted">No metrics attached.</p>
          )}
        </Panel>
      </div>

      <Panel title="Observations" icon={StickyNote}>
        <p className="text-sm leading-relaxed text-muted">{experiment.observations || '—'}</p>
      </Panel>

      <Panel title="Event log" icon={ListTree} subtitle="Chronological simulation timeline" actions={<Badge>{events.length} events</Badge>}>
        {events.length === 0 ? (
          <p className="text-sm text-muted">No events stored.</p>
        ) : (
          <ol className="relative max-h-[26rem] overflow-auto pl-1 font-mono text-[12px]">
            <span className="absolute bottom-2 left-[9px] top-2 w-px bg-line-strong" aria-hidden />
            {events.map((ev, i) => (
              <li key={i} className="relative flex items-center gap-3 rounded-md py-1.5 pl-6 pr-2 transition-colors hover:bg-raised/50">
                <span className={`absolute left-[5px] h-[9px] w-[9px] rounded-full ring-4 ring-surface ${eventTone(ev.type)}`} aria-hidden />
                <span className="tabular w-24 shrink-0 text-faint">{(ev.simTimeMs ?? 0).toFixed(3)} ms</span>
                <span className="text-ink">{ev.type}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-b-0">
      <dt className="text-muted">{k}</dt>
      <dd className={`text-right text-ink ${mono ? 'tabular font-mono text-[12.5px]' : ''}`}>{v}</dd>
    </div>
  );
}
