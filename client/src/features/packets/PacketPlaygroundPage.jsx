import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowLeftRight, ExternalLink, ListOrdered, Pause, Play, RotateCcw, Route as RouteIcon,
  Save, ScanSearch, Send, Terminal,
} from 'lucide-react';
import { Protocols } from '@datacompredia/shared';
import { useLabStore } from '../../store/labStore.js';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge, Panel } from '../../components/ui/Panel.jsx';
import { HopDetails, RouteTrace } from './RouteTrace.jsx';
import { FlowLegend, PacketFlowTable } from './PacketFlowTable.jsx';
import { LiveStream } from './LiveStream.jsx';
import { PacketInspector } from './PacketInspector.jsx';
import { STATUS_TONE, normalizeLive, normalizeTimeline } from './packetEvents.js';

const PRESETS = [
  { label: 'Hello', value: 'Hello from DataComPredia' },
  { label: 'HTTP GET', value: 'GET /index.html HTTP/1.1\r\nHost: lab.local' },
  { label: 'JSON ping', value: '{"type":"ping","seq":1}' },
  { label: '1 KB filler', value: 'x'.repeat(1024) },
];

const MODES = {
  [Protocols.TCP_SIM]: { label: 'TCP_SIM', hint: 'Three-way handshake, ACKs and retransmission on loss.' },
  [Protocols.UDP_SIM]: { label: 'UDP_SIM', hint: 'Single datagram — no handshake, no retry.' },
};

const byteLength = (s) => new TextEncoder().encode(s).length;

export function PacketPlaygroundPage() {
  const currentLab = useLabStore((s) => s.currentLab);
  const topology = useLabStore((s) => s.topology);
  const transmit = useLabStore((s) => s.transmit);
  const packet = useLabStore((s) => s.packet);
  const timeline = useLabStore((s) => s.timeline);
  const liveEvents = useLabStore((s) => s.liveEvents);
  const simulationStatus = useLabStore((s) => s.simulationStatus);
  const pauseSimulation = useLabStore((s) => s.pauseSimulation);
  const resumeSimulation = useLabStore((s) => s.resumeSimulation);
  const resetSimulation = useLabStore((s) => s.resetSimulation);
  const setNotice = useLabStore((s) => s.setNotice);
  const metrics = useLabStore((s) => s.metrics);

  const formRef = useRef(null);
  const endpoints = useMemo(
    () => (topology.nodes || []).filter((n) => n.type === 'pc' || n.type === 'server' || n.type === 'router'),
    [topology],
  );
  const nodeLabels = useMemo(() => new Map((topology.nodes || []).map((n) => [n.id, n.label || n.id])), [topology]);
  const nameOf = (id) => nodeLabels.get(id) || id;

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
        <div className="panel-lg grid gap-4 p-5 sm:grid-cols-3">
          {[
            ['1', 'Load a lab', 'Create one from a template or open a recent lab from the Overview.'],
            ['2', 'Compose a packet', 'Pick source, destination, a transport mode and a payload.'],
            ['3', 'Inspect the run', 'Watch the hop-by-hop route and read every engine event.'],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald/10 font-mono text-[12px] font-semibold text-emerald-bright ring-1 ring-emerald/25">{n}</span>
              <div>
                <div className="text-[13.5px] font-semibold text-ink">{t}</div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const src = sourceNodeId || endpoints[0]?.id || '';
  const dst = destinationNodeId || endpoints[1]?.id || endpoints[0]?.id || '';
  const bytes = byteLength(payload);
  const running = simulationStatus === 'running' || simulationStatus === 'validating';
  const sameEndpoint = src && src === dst;

  // Authoritative timeline once the engine reports it; live socket stream while running.
  const live = normalizeLive(liveEvents);
  const authoritative = normalizeTimeline(timeline);
  const showAuthoritative = authoritative.length > 0 && !running;
  const flowEvents = showAuthoritative ? authoritative : live;
  const traceEvents = showAuthoritative ? authoritative : [...authoritative, ...live];

  function swap() {
    setSource(dst);
    setDest(src);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Packet Playground"
        title="Transmit & inspect"
        description="TCP_SIM and UDP_SIM are application-level behaviour simulations — not a real transport stack. Delivery status comes only from the simulation engine."
        icon={Activity}
        actions={
          <Link to="/network" className="btn-secondary btn-sm">
            <ExternalLink size={14} /> Network Playground
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-12">
        {/* ───────── Composer ───────── */}
        <form ref={formRef} onSubmit={onTransmit} className="xl:col-span-5">
          <Panel title="Compose packet" icon={Send} subtitle="Choose endpoints, transport mode and payload" className="h-full" bodyClassName="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div>
                <label className="label" htmlFor="src">Source</label>
                <select id="src" className="field" value={src} onChange={(e) => setSource(e.target.value)} required>
                  {endpoints.map((n) => (
                    <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn-secondary btn-icon mx-auto h-[38px] w-[38px] rotate-90 sm:rotate-0" onClick={swap} aria-label="Swap source and destination" title="Swap">
                <ArrowLeftRight size={15} />
              </button>
              <div>
                <label className="label" htmlFor="dst">Destination</label>
                <select id="dst" className="field" value={dst} onChange={(e) => setDest(e.target.value)} required>
                  {endpoints.map((n) => (
                    <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
                  ))}
                </select>
              </div>
            </div>

            {sameEndpoint ? (
              <p className="flex items-center gap-2 rounded-lg border border-warn/35 bg-warn/10 px-3 py-2 text-[12px] text-warn">
                <AlertTriangle size={14} className="shrink-0" /> Source and destination are the same node.
              </p>
            ) : null}
            {endpoints.length < 2 ? (
              <p className="flex items-center gap-2 rounded-lg border border-warn/35 bg-warn/10 px-3 py-2 text-[12px] text-warn">
                <AlertTriangle size={14} className="shrink-0" /> This topology needs at least two endpoints (PC, server or router).
              </p>
            ) : null}

            <div>
              <span className="label" id="mode-label">Mode</span>
              <div className="seg w-full" role="group" aria-labelledby="mode-label">
                {Object.entries(MODES).map(([value, m]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={protocol === value}
                    className="flex-1"
                    onClick={() => setProtocol(value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-muted">{MODES[protocol].hint}</p>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label !mb-0" htmlFor="msg">Message</label>
                <span className="font-mono text-[10.5px] tabular text-faint">{payload.length}/2048 chars · {bytes} B</span>
              </div>
              <textarea
                id="msg"
                className="field min-h-[104px] font-mono text-[12.5px]"
                value={payload}
                maxLength={2048}
                onChange={(e) => setPayload(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    formRef.current?.requestSubmit();
                  }
                }}
                required
              />
              <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Payload presets">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPayload(p.value)}
                    className="rounded-full border border-line-strong bg-elevated/50 px-2.5 py-1 font-mono text-[10.5px] text-muted transition hover:border-emerald/50 hover:text-ink"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="submit" className="btn-primary px-5 py-2.5" disabled={busy || endpoints.length < 2}>
                <Send size={15} />
                {busy ? 'Validating…' : 'Transmit'}
              </button>
              <span className="hidden items-center gap-1 font-mono text-[10.5px] text-faint sm:flex">
                <span className="kbd">Ctrl</span><span className="kbd">↵</span> to send
              </span>
            </div>
          </Panel>
        </form>

        {/* ───────── Route trace ───────── */}
        <div className="xl:col-span-7">
          <Panel
            title="Route trace"
            icon={RouteIcon}
            subtitle={packet?.route?.nodeIds?.length ? packet.route.nodeIds.map(nameOf).join(' → ') : 'Hop-by-hop path of the current packet'}
            actions={packet ? (
              <Badge tone={STATUS_TONE[running ? 'in_transit' : packet.status] || 'neutral'} dot className="capitalize">
                {String(running ? 'in_transit' : packet.status).replace(/_/g, ' ')}
              </Badge>
            ) : null}
            className="flex h-full flex-col"
            bodyClassName="flex flex-1 flex-col"
          >
            <div className="flex-1">
              <RouteTrace
                packet={packet}
                nodes={topology.nodes || []}
                events={traceEvents}
                running={running}
                previewSource={endpoints.find((n) => n.id === src)}
                previewDestination={endpoints.find((n) => n.id === dst)}
              />
              <HopDetails packet={packet} nodes={topology.nodes || []} events={traceEvents} running={running} protocol={protocol} />
            </div>
            <dl className="grid grid-cols-2 divide-x divide-y divide-line/70 border-t border-line/80 sm:grid-cols-4 sm:divide-y-0">
              {[
                ['Hops', packet?.route?.linkIds?.length ?? '—'],
                ['Total delay', running ? '…' : packet?.totalDelayMs != null ? `${packet.totalDelayMs.toFixed(3)} ms` : '—'],
                ['Attempts', running ? '…' : packet?.attempts ?? '—'],
                ['Payload', packet ? `${packet.payloadSizeBytes} B` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="px-4 py-3">
                  <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">{k}</dt>
                  <dd className="font-display tabular mt-1 text-[1.15rem] font-semibold leading-none text-ink">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>

      {/* ───────── Packet flow ───────── */}
      <Panel
        title="Packet flow"
        icon={ListOrdered}
        subtitle={showAuthoritative ? 'Authoritative engine timeline' : running ? 'Streaming live from the engine…' : 'Event timeline'}
        actions={<span className="status-pill tabular">{flowEvents.length} event{flowEvents.length === 1 ? '' : 's'}</span>}
        flush
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 px-4 py-2.5">
          <FlowLegend />
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" className="btn-secondary btn-sm" onClick={resumeSimulation}><Play size={13} /> Resume</button>
            <button type="button" className="btn-secondary btn-sm" onClick={pauseSimulation}><Pause size={13} /> Pause</button>
            <button type="button" className="btn-secondary btn-sm" onClick={resetSimulation}><RotateCcw size={13} /> Reset</button>
            <button type="button" className="btn-secondary btn-sm" onClick={saveExperiment} disabled={!packet}><Save size={13} /> Save experiment</button>
          </div>
        </div>
        <div className="pt-0">
          <PacketFlowTable events={flowEvents} nameOf={nameOf} live={!showAuthoritative} />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel title="Packet inspector" icon={ScanSearch} subtitle="Authoritative fields from the engine" className="xl:col-span-3" flush>
          <PacketInspector packet={packet} />
        </Panel>
        <Panel title="Live event stream" icon={Terminal} subtitle="Raw socket events as they arrive" className="xl:col-span-2" bodyClassName="p-4">
          <LiveStream events={live} nameOf={nameOf} running={running} />
        </Panel>
      </div>
    </div>
  );
}
