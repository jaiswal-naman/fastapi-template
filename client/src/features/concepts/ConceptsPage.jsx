import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../services/api.js';

const SECTIONS = [
  {
    title: 'What is simulated?',
    body: 'DataComPredia uses an application-level network model. TCP_SIM and UDP_SIM demonstrate handshake, acknowledgement, loss and retransmission behaviour for teaching — they are not a kernel TCP/UDP stack and do not capture real Ethernet frames.',
  },
  {
    title: 'Delay formulas',
    body: 'Transmission delay = packetSizeBits / linkRate. Propagation delay = distance / propagationSpeed. Nodal delay includes processing + queueing + transmission + propagation. Units are converted carefully to milliseconds in the engine.',
  },
  {
    title: 'Routing',
    body: 'Default routes use BFS (minimum hop count). Failed nodes and links are excluded. Dijkstra is available in the engine with cost = transmission + propagation delay for a reference frame.',
  },
  {
    title: 'Line coding conventions',
    body: 'Manchester follows IEEE 802.3: 0 = high→low, 1 = low→high at mid-bit. Differential Manchester always transitions mid-bit; 0 also transitions at the start of the bit. See ASSUMPTIONS_AND_DECISIONS.md for B8ZS/HDB3.',
  },
  {
    title: 'Channel capacity',
    body: 'Nyquist: C = 2B log2(M). Shannon: C = B log2(1 + SNR_linear) with SNR_linear = 10^(SNR_dB/10). PCM bit rate R = n × fs.',
  },
  {
    title: 'Status language',
    body: 'Connected/Disconnected (Socket.IO), Saved/Unsaved changes, Running/Paused/Completed/Failed (simulation), Active/Failed/Congested (devices/links), Simulated (metrics), Sample data (demo-only).',
  },
];

export function ConceptsPage() {
  const [scenarios, setScenarios] = useState([]);

  useEffect(() => {
    api
      .scenarios()
      .then((d) => setScenarios(d.scenarios || []))
      .catch(() => setScenarios([]));
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Concepts / Help"
        title="Theory behind the lab"
        description="Short explanations tied to what the product actually implements. Prefer the inspector and event timeline for experiment-specific detail."
        icon={BookOpen}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <article key={s.title} className="panel-lg p-5">
            <h3 className="text-base font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
          </article>
        ))}
      </div>

      <section className="panel-lg p-5">
        <h3 className="section-title">Guided demo scenarios</h3>
        <p className="mt-1 text-xs text-muted">Evaluator-ready paths. No fabricated result values — observe the live lab.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {scenarios.map((sc) => (
            <article key={sc.id} className="rounded-xl border border-line bg-canvas/40 p-4">
              <div className="font-medium text-ink">{sc.name}</div>
              <p className="mt-1 text-sm text-muted">{sc.objective}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wide text-emerald-bright">Expected</p>
              <p className="text-xs text-muted">{sc.expected}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
