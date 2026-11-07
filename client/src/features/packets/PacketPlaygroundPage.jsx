import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Protocols } from '@datacompredia/shared';
import { useLabStore } from '../../store/labStore.js';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';

export function PacketPlaygroundPage() {
  const currentLab = useLabStore((s) => s.currentLab);
  const topology = useLabStore((s) => s.topology);
  const transmit = useLabStore((s) => s.transmit);
  const packet = useLabStore((s) => s.packet);
  const timeline = useLabStore((s) => s.timeline);
  const simulationStatus = useLabStore((s) => s.simulationStatus);
  const hopAnimation = useLabStore((s) => s.hopAnimation);
  const pauseSimulation = useLabStore((s) => s.pauseSimulation);
  const resumeSimulation = useLabStore((s) => s.resumeSimulation);
  const resetSimulation = useLabStore((s) => s.resetSimulation);
  const setNotice = useLabStore((s) => s.setNotice);
  const metrics = useLabStore((s) => s.metrics);

  const endpoints = useMemo(
    () => (topology.nodes || []).filter((n) => n.type === 'pc' || n.type === 'server' || n.type === 'router'),
    [topology],
  );

  const [sourceNodeId, setSource] = useState('');
  const [destinationNodeId, setDest] = useState('');
  const [payload, setPayload] = useState('Hello from DataComPredia');
  const [protocol, setProtocol] = useState(Protocols.TCP_SIM);
  const [busy, setBusy] = useState(false);

  async function onTransmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await transmit({
        sourceNodeId: sourceNodeId || endpoints[0]?.id,
        destinationNodeId: destinationNodeId || endpoints[1]?.id,
        payload,
        protocol,
      });
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Transmit failed' });
    } finally {
      setBusy(false);
    }
  }

  async function saveExperiment() {
    if (!currentLab || !packet) return;
    try {
      await api.saveExperiment(currentLab.id, {
        name: `${currentLab.name} · ${protocol}`,
        protocol,
        sourceNodeId: packet.sourceNodeId,
        destinationNodeId: packet.destinationNodeId,
        packetCounts: { sent: 1, status: packet.status },
        metricsSummary: metrics,
        packet,
        events: timeline,
        observations: `Simulated ${protocol} transmission finished with status ${packet.status}.`,
      });
      setNotice({ type: 'success', message: 'Experiment saved.' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    }
  }

  if (!currentLab) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Packet Playground"
          title="Transmit across your topology"
          description="Load a lab first, then send a TCP_SIM or UDP_SIM message and inspect the authoritative event timeline."
          icon={Activity}
          actions={
            <Link to="/create-lab" className="btn-primary">
              Create Lab
            </Link>
          }
        />
      </div>
    );
  }

  const src = sourceNodeId || endpoints[0]?.id || '';
  const dst = destinationNodeId || endpoints[1]?.id || endpoints[0]?.id || '';
  const routeLabel = packet?.route?.nodeIds?.join(' → ') || 'No route yet';

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Packet Playground"
        title="Transmit & inspect"
        description="TCP_SIM and UDP_SIM are application-level behaviour simulations — not a real transport stack. Delivery status comes only from the simulation engine."
        icon={Activity}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <form onSubmit={onTransmit} className="panel-lg space-y-3 p-5">
          <h3 className="section-title">Transmit message</h3>

          <label className="label" htmlFor="src">Source</label>
          <select id="src" className="field" value={src} onChange={(e) => setSource(e.target.value)} required>
            {endpoints.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.id})
              </option>
            ))}
          </select>

          <label className="label" htmlFor="dst">Destination</label>
          <select id="dst" className="field" value={dst} onChange={(e) => setDest(e.target.value)} required>
            {endpoints.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.id})
              </option>
            ))}
          </select>

          <label className="label" htmlFor="proto">Mode</label>
          <select id="proto" className="field" value={protocol} onChange={(e) => setProtocol(e.target.value)}>
            <option value={Protocols.TCP_SIM}>TCP_SIM — handshake, ACK, retry</option>
            <option value={Protocols.UDP_SIM}>UDP_SIM — datagram, no retry</option>
          </select>

          <label className="label" htmlFor="msg">Message</label>
          <textarea
            id="msg"
            className="field min-h-[96px]"
            value={payload}
            maxLength={2048}
            onChange={(e) => setPayload(e.target.value)}
            required
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" className="btn-primary" disabled={busy || endpoints.length < 2}>
              {busy ? 'Validating…' : 'Transmit'}
            </button>
            <button type="button" className="btn-secondary" onClick={pauseSimulation}>Pause</button>
            <button type="button" className="btn-secondary" onClick={resumeSimulation}>Resume</button>
            <button type="button" className="btn-secondary" onClick={resetSimulation}>Reset</button>
            <button type="button" className="btn-secondary" onClick={saveExperiment} disabled={!packet}>
              Save experiment
            </button>
          </div>
        </form>

        <div className="panel-lg space-y-4 p-5">
          <h3 className="section-title">Network route view</h3>
          <div className="rounded-xl border border-line bg-gradient-to-br from-elevated/60 to-canvas/80 p-5 font-mono text-sm leading-relaxed">
            {routeLabel}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="status-pill capitalize">Status: {simulationStatus}</span>
            {hopAnimation ? (
              <span className="status-pill border-emerald/40 text-emerald-bright">
                Hop: {hopAnimation.fromNodeId} → {hopAnimation.toNodeId}
              </span>
            ) : null}
            {packet ? <span className="status-pill font-mono">Packet {packet.packetId}</span> : null}
          </div>
          <p className="text-xs text-muted">
            Animated hop markers appear in Network Playground (2D edges / 3D packet spheres) driven by these events.
          </p>
          <Link to="/network" className="btn-secondary inline-flex">Open Network Playground</Link>
        </div>

        <div className="panel-lg p-5">
          <h3 className="section-title">Packet inspector</h3>
          {!packet ? (
            <div className="empty-state mt-3">No packet yet. Transmit a message to inspect authoritative fields.</div>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
              {[
                ['Packet ID', packet.packetId],
                ['Protocol', packet.protocol],
                ['Source', `${packet.sourceNodeId} (${packet.sourceIp || 'n/a'})`],
                ['Destination', `${packet.destinationNodeId} (${packet.destinationIp || 'n/a'})`],
                ['Payload size', `${packet.payloadSizeBytes} B`],
                ['Sequence', packet.sequenceNumber],
                ['Hop count', packet.route?.linkIds?.length ?? '—'],
                ['Status', packet.status],
                ['Total delay', packet.totalDelayMs != null ? `${packet.totalDelayMs.toFixed(4)} ms` : '—'],
                ['Tx delay', packet.delays ? `${packet.delays.transmission.toFixed(4)} ms` : '—'],
                ['Prop delay', packet.delays ? `${packet.delays.propagation.toFixed(4)} ms` : '—'],
                ['Queue delay', packet.delays ? `${packet.delays.queueing.toFixed(4)} ms` : '—'],
                ['Drop reason', packet.dropReason || '—'],
                ['Attempts', packet.attempts ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-mono text-xs tabular text-ink">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="panel-lg p-5">
          <h3 className="section-title">Event timeline</h3>
          {timeline.length === 0 ? (
            <div className="empty-state mt-3">Events appear as the simulation engine emits them.</div>
          ) : (
            <ol className="mt-3 max-h-80 space-y-1.5 overflow-auto font-mono text-xs">
              {timeline.map((ev, i) => (
                <li key={`${ev.type}-${i}`} className="rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
                  <span className="text-muted">{(ev.simTimeMs ?? 0).toFixed(3)} ms</span>
                  <span className="text-line"> · </span>
                  <span className="text-emerald-bright">{ev.type}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
