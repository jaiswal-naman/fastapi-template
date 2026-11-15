import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { useLabStore } from '../../store/labStore.js';

export function ExperimentsPage() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const labs = useLabStore((s) => s.labs);
  const refreshLabs = useLabStore((s) => s.refreshLabs);
  const loadLab = useLabStore((s) => s.loadLab);

  useEffect(() => {
    Promise.all([api.listExperiments(), refreshLabs()])
      .then(([exp]) => setExperiments(exp.experiments || []))
      .catch(() => setExperiments([]))
      .finally(() => setLoading(false));
  }, [refreshLabs]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="My Experiments"
        title="Saved runs & labs"
        description="Persisted experiment summaries from this local demo session. Open a report to review topology snapshot, protocol, and simulated metrics."
        icon={FolderKanban}
        actions={
          <Link to="/create-lab" className="btn-primary">
            Create Lab
          </Link>
        }
      />

      <section className="panel-lg p-5">
        <div className="section-title">Labs</div>
        {labs.length === 0 ? (
          <div className="empty-state mt-3">No labs yet. Create a starter topology to begin.</div>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {labs.map((lab) => (
              <li key={lab.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-medium">{lab.name}</div>
                  <div className="text-xs text-muted">
                    {lab.template} · {lab.nodeCount} nodes · {lab.linkCount} links · updated{' '}
                    {new Date(lab.updatedAt).toLocaleString()}
                  </div>
                </div>
                <Link
                  to="/network"
                  className="btn-secondary"
                  onClick={() => loadLab(lab.id)}
                >
                  Open playground
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel-lg p-5">
        <div className="section-title">Saved experiment reports</div>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : experiments.length === 0 ? (
          <div className="empty-state mt-3">
            No saved experiments. Transmit a packet and use Save experiment in Packet Playground.
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {experiments.map((exp) => (
              <li key={exp.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-medium">{exp.name}</div>
                  <div className="text-xs text-muted">
                    {exp.protocol || 'n/a'} · {new Date(exp.createdAt).toLocaleString()}
                  </div>
                </div>
                <Link to={`/experiments/${exp.id}`} className="btn-secondary">
                  View report
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
