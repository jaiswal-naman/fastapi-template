import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, FlaskConical, FolderKanban, Plus, Search } from 'lucide-react';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Panel, Badge } from '../../components/ui/Panel.jsx';
import { useLabStore } from '../../store/labStore.js';
import { TopologyGlyph } from '../topology/TopologyGlyph.jsx';
import { fullDate, timeAgo } from '../dashboard/format.js';

const PROTO_TONE = { TCP_SIM: 'brand', UDP_SIM: 'info' };

export function ExperimentsPage() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const labs = useLabStore((s) => s.labs);
  const currentLab = useLabStore((s) => s.currentLab);
  const refreshLabs = useLabStore((s) => s.refreshLabs);
  const loadLab = useLabStore((s) => s.loadLab);

  useEffect(() => {
    Promise.all([api.listExperiments(), refreshLabs()])
      .then(([exp]) => setExperiments(exp.experiments || []))
      .catch(() => setExperiments([]))
      .finally(() => setLoading(false));
  }, [refreshLabs]);

  const needle = q.trim().toLowerCase();
  const shownLabs = useMemo(
    () => labs.filter((l) => !needle || `${l.name} ${l.template}`.toLowerCase().includes(needle)),
    [labs, needle],
  );
  const shownExp = useMemo(
    () => experiments.filter((e) => !needle || `${e.name} ${e.protocol || ''}`.toLowerCase().includes(needle)),
    [experiments, needle],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="My Experiments"
        title="Saved runs & labs"
        description="Persisted experiment summaries from this local demo session. Open a report to review topology snapshot, protocol, and simulated metrics."
        icon={FolderKanban}
        actions={
          <Link to="/create-lab" className="btn-primary">
            <Plus size={15} /> Create Lab
          </Link>
        }
      >
        <div className="relative max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            className="field pl-9"
            placeholder="Filter labs and reports…"
            aria-label="Filter labs and reports"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </PageHeader>

      <Panel
        title="Labs"
        icon={FlaskConical}
        subtitle={`${labs.length} in this session`}
        actions={<Badge>{shownLabs.length} shown</Badge>}
      >
        {labs.length === 0 ? (
          <div className="empty-state flex flex-col items-center text-center">
            <FlaskConical size={22} className="text-emerald-bright" />
            <p className="mt-3">No labs yet. Create a starter topology to begin.</p>
            <Link to="/create-lab" className="btn-primary mt-4">
              <Plus size={15} /> Create Lab
            </Link>
          </div>
        ) : shownLabs.length === 0 ? (
          <div className="empty-state text-center">No labs match “{q}”.</div>
        ) : (
          <ul className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shownLabs.map((lab) => {
              const active = currentLab?.id === lab.id;
              return (
                <li key={lab.id} className={`panel-interactive group flex flex-col overflow-hidden ${active ? 'border-emerald/50' : ''}`}>
                  <div className="grid h-24 place-items-center border-b border-line/70 bg-canvas/40 px-6">
                    <TopologyGlyph id={lab.template} className="h-full w-full max-w-[150px]" />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display truncate text-[15px] font-semibold text-ink">{lab.name}</h4>
                      {active ? <Badge tone="brand" dot>active</Badge> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge className="capitalize">{lab.template}</Badge>
                      <Badge>{lab.nodeCount} nodes</Badge>
                      <Badge>{lab.linkCount} links</Badge>
                    </div>
                    <div className="mt-3 font-mono text-[11px] text-faint" title={fullDate(lab.updatedAt)}>
                      updated {timeAgo(lab.updatedAt)}
                    </div>
                    <Link to="/network" className="btn-secondary btn-sm mt-4 w-full justify-between" onClick={() => loadLab(lab.id)}>
                      Open playground <ArrowRight size={13} />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel
        title="Saved experiment reports"
        icon={ClipboardList}
        subtitle="Snapshots saved from Packet Playground"
        actions={<Badge>{experiments.length} total</Badge>}
        flush
      >
        {loading ? (
          <div className="space-y-2 p-4" aria-label="Loading reports">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : experiments.length === 0 ? (
          <div className="p-4">
            <div className="empty-state flex flex-col items-center text-center">
              <ClipboardList size={22} className="text-emerald-bright" />
              <p className="mt-3 max-w-md">No saved experiments. Transmit a packet and use Save experiment in Packet Playground.</p>
              <Link to="/packets" className="btn-secondary mt-4">
                Open Packet Playground <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : shownExp.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted">No reports match “{q}”.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[560px]">
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Protocol</th>
                  <th>Saved</th>
                  <th className="text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shownExp.map((exp) => (
                  <tr key={exp.id}>
                    <td className="font-medium">{exp.name}</td>
                    <td>
                      <Badge tone={PROTO_TONE[exp.protocol] || 'neutral'}>{exp.protocol || 'n/a'}</Badge>
                    </td>
                    <td className="font-mono text-[11.5px] text-muted" title={fullDate(exp.createdAt)}>
                      {timeAgo(exp.createdAt)}
                    </td>
                    <td className="text-right">
                      <Link to={`/experiments/${exp.id}`} className="btn-secondary btn-sm">
                        View report <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
