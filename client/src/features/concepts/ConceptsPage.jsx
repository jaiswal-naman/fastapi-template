import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Cpu, GitBranch, Radio, Search, Signal, Tags, Timer, Waypoints } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge } from '../../components/ui/Panel.jsx';
import { api } from '../../services/api.js';
import { TopologyGlyph } from '../topology/TopologyGlyph.jsx';

const SECTIONS = [
  {
    id: 'simulated',
    title: 'What is simulated?',
    category: 'Basics',
    icon: Cpu,
    body: 'DataComPredia uses an application-level network model. TCP_SIM and UDP_SIM demonstrate handshake, acknowledgement, loss and retransmission behaviour for teaching — they are not a kernel TCP/UDP stack and do not capture real Ethernet frames.',
  },
  {
    id: 'delay',
    title: 'Delay formulas',
    category: 'Math',
    icon: Timer,
    body: 'Transmission delay = packetSizeBits / linkRate. Propagation delay = distance / propagationSpeed. Nodal delay includes processing + queueing + transmission + propagation. Units are converted carefully to milliseconds in the engine.',
    formulas: ['d_trans = L / R', 'd_prop = d / s', 'd_nodal = d_proc + d_queue + d_trans + d_prop'],
  },
  {
    id: 'routing',
    title: 'Routing',
    category: 'Routing',
    icon: Waypoints,
    body: 'Default routes use BFS (minimum hop count). Failed nodes and links are excluded. Dijkstra is available in the engine with cost = transmission + propagation delay for a reference frame.',
    formulas: ['BFS → min hop count', 'Dijkstra → cost = d_trans + d_prop'],
  },
  {
    id: 'coding',
    title: 'Line coding conventions',
    category: 'Signals',
    icon: Signal,
    body: 'Manchester follows IEEE 802.3: 0 = high→low, 1 = low→high at mid-bit. Differential Manchester always transitions mid-bit; 0 also transitions at the start of the bit. See ASSUMPTIONS_AND_DECISIONS.md for B8ZS/HDB3.',
    formulas: ['Manchester  0 = H→L · 1 = L→H', 'Diff. Manchester  0 = start transition'],
  },
  {
    id: 'capacity',
    title: 'Channel capacity',
    category: 'Math',
    icon: Radio,
    body: 'Nyquist: C = 2B log2(M). Shannon: C = B log2(1 + SNR_linear) with SNR_linear = 10^(SNR_dB/10). PCM bit rate R = n × fs.',
    formulas: ['C = 2B · log₂(M)', 'C = B · log₂(1 + SNR)', 'SNR = 10^(SNR_dB / 10)', 'R = n × fs'],
  },
  {
    id: 'status',
    title: 'Status language',
    category: 'Basics',
    icon: Tags,
    body: 'Connected/Disconnected (Socket.IO), Saved/Unsaved changes, Running/Paused/Completed/Failed (simulation), Active/Failed/Congested (devices/links), Simulated (metrics), Sample data (demo-only).',
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(SECTIONS.map((s) => s.category)))];

const PROTO_TONE = { TCP_SIM: 'brand', UDP_SIM: 'info' };

export function ConceptsPage() {
  const [scenarios, setScenarios] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    api
      .scenarios()
      .then((d) => setScenarios(d.scenarios || []))
      .catch(() => setScenarios([]));
  }, []);

  const needle = q.trim().toLowerCase();
  const shown = useMemo(
    () =>
      SECTIONS.filter(
        (s) =>
          (cat === 'All' || s.category === cat) &&
          (!needle || `${s.title} ${s.body} ${(s.formulas || []).join(' ')}`.toLowerCase().includes(needle)),
      ),
    [cat, needle],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Concepts / Help"
        title="Theory behind the lab"
        description="Short explanations tied to what the product actually implements. Prefer the inspector and event timeline for experiment-specific detail."
        icon={BookOpen}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="search"
              className="field pl-9"
              placeholder="Search concepts, formulas…"
              aria-label="Search concepts"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="seg flex-wrap" role="group" aria-label="Filter by category">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      {/* ───────── Reference cards ───────── */}
      <section aria-label="Concept reference">
        {shown.length === 0 ? (
          <div className="empty-state text-center">Nothing matches “{q}”. Try a different term or category.</div>
        ) : (
          <div className="stagger grid gap-4 lg:grid-cols-2">
            {shown.map((s, i) => {
              const Icon = s.icon;
              return (
                <article key={s.id} id={s.id} className="panel-lg group relative scroll-mt-4 overflow-hidden p-5 transition hover:border-emerald/35">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald/10 text-emerald-bright ring-1 ring-emerald/25">
                      <Icon size={19} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <Badge>{s.category}</Badge>
                        <span className="font-mono text-[11px] text-faint">{String(SECTIONS.indexOf(s) + 1).padStart(2, '0')}</span>
                      </div>
                      <h3 className="font-display mt-2 text-[1.15rem] font-semibold tracking-tight text-ink">{s.title}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-[14px] leading-[1.7] text-muted">{s.body}</p>
                  {s.formulas ? (
                    <div className="mt-4 space-y-1.5 rounded-xl border border-line bg-canvas/50 p-3 font-mono text-[12.5px] text-ink">
                      {s.formulas.map((f) => (
                        <div key={f} className="flex gap-2">
                          <span className="select-none text-emerald-bright">›</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ───────── Guided demos ───────── */}
      <section aria-label="Guided demo scenarios">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="eyebrow">
              <GitBranch size={12} /> Guided demos
            </div>
            <h3 className="font-display mt-1.5 text-lg font-semibold tracking-tight text-ink">Guided demo scenarios</h3>
            <p className="mt-0.5 text-[12.5px] text-muted">Evaluator-ready paths. No fabricated result values — observe the live lab.</p>
          </div>
          <Link to="/create-lab" className="btn-secondary btn-sm">
            Start a lab <ArrowRight size={13} />
          </Link>
        </div>

        {scenarios.length === 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-44" />
            ))}
          </div>
        ) : (
          <div className="stagger grid gap-4 md:grid-cols-2">
            {scenarios.map((sc, idx) => (
              <article key={sc.id} className="panel flex flex-col overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  <span className="grid h-14 w-[76px] shrink-0 place-items-center rounded-lg border border-line bg-canvas/50 p-1.5">
                    {sc.template ? (
                      <TopologyGlyph id={sc.template} />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet/10 text-violet ring-1 ring-violet/25">
                        {sc.id.includes('channel') ? <Radio size={17} /> : <Signal size={17} />}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] text-faint">{String(idx + 1).padStart(2, '0')}</span>
                      {sc.protocol ? <Badge tone={PROTO_TONE[sc.protocol] || 'neutral'}>{sc.protocol}</Badge> : null}
                      {sc.template ? <Badge className="capitalize">{sc.template}</Badge> : null}
                    </div>
                    <h4 className="font-display mt-1.5 text-[16px] font-semibold text-ink">{sc.name}</h4>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{sc.objective}</p>
                  </div>
                </div>

                {sc.steps?.length ? (
                  <ol className="space-y-2 border-t border-line/70 px-5 py-4">
                    {sc.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-[12.5px] text-muted">
                        <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line-strong bg-elevated font-mono text-[10px] text-emerald-bright">
                          {i + 1}
                        </span>
                        <span className="leading-5">{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}

                <div className="mt-auto border-t border-line/70 bg-emerald/[0.05] px-5 py-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-bright">Expected</div>
                  <p className="mt-0.5 text-[12.5px] text-muted">{sc.expected}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
