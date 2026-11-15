import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';

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
      <div className="panel p-6">
        <p className="text-danger">{error}</p>
        <Link to="/experiments" className="btn-secondary mt-4 inline-flex">Back</Link>
      </div>
    );
  }

  if (!experiment) {
    return <div className="panel p-6 text-sm text-muted">Loading report…</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Experiment report"
        title={experiment.name}
        description={`Saved ${new Date(experiment.createdAt).toLocaleString()}. Values below are from the simulation engine.`}
        actions={
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={exportCsv}>
              Export CSV
            </button>
            <Link to="/experiments" className="btn-secondary">
              Back
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel-lg p-5 space-y-2 text-sm">
          <div className="section-title">Configuration</div>
          <Row k="Protocol" v={experiment.protocol || '—'} />
          <Row k="Source" v={experiment.sourceNodeId || '—'} mono />
          <Row k="Destination" v={experiment.destinationNodeId || '—'} mono />
          <Row k="Nodes in snapshot" v={String(experiment.topologySnapshot?.nodes?.length ?? 0)} />
          <Row k="Links in snapshot" v={String(experiment.topologySnapshot?.links?.length ?? 0)} />
        </section>

        <section className="panel-lg p-5 space-y-2 text-sm">
          <div className="section-title">Metrics summary · Simulated</div>
          {experiment.metricsSummary ? (
            Object.entries(experiment.metricsSummary)
              .filter(([, v]) => typeof v !== 'object' || v === null)
              .map(([k, v]) => <Row key={k} k={k} v={String(v)} mono />)
          ) : (
            <p className="text-muted">No metrics attached.</p>
          )}
        </section>
      </div>

      <section className="panel-lg p-5">
        <div className="section-title">Observations</div>
        <p className="mt-2 text-sm text-muted">{experiment.observations || '—'}</p>
      </section>

      <section className="panel-lg p-5">
        <div className="section-title">Event log</div>
        <ol className="mt-3 max-h-80 space-y-1 overflow-auto font-mono text-xs">
          {(experiment.events || []).map((ev, i) => (
            <li key={i} className="rounded border border-line px-2 py-1">
              {(ev.simTimeMs ?? 0).toFixed(3)} ms · {ev.type}
            </li>
          ))}
          {(experiment.events || []).length === 0 ? <li className="text-muted">No events stored.</li> : null}
        </ol>
      </section>
    </div>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line/60 py-1.5">
      <span className="text-muted">{k}</span>
      <span className={mono ? 'font-mono text-xs tabular' : ''}>{v}</span>
    </div>
  );
}
