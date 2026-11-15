import { Link } from 'react-router-dom';
import { CheckCircle2, Monitor, Network, Router, Server, Share2, XCircle } from 'lucide-react';
import { totalTimingMs } from './packetEvents.js';

const ICONS = { pc: Monitor, server: Server, router: Router, switch: Network, hub: Share2 };

const NODE_TONE = {
  idle: 'border-line-strong bg-elevated text-muted',
  reached: 'border-emerald/50 bg-emerald/10 text-emerald-bright',
  current: 'border-emerald bg-emerald/15 text-emerald-bright shadow-glow',
  dropped: 'border-danger/60 bg-danger/10 text-danger',
};

const KEYFRAMES = `
@keyframes pp-travel { 0% { left: 0; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: calc(100% - 10px); opacity: 0; } }
.pp-dot { animation: pp-travel 1.1s linear infinite; }
`;

function NodeChip({ node, state, destinationDelivered }) {
  const Icon = ICONS[node.type] || Share2;
  return (
    <div className="relative w-14 shrink-0">
      <div className={`relative grid h-14 w-14 place-items-center rounded-2xl border transition-colors duration-300 ${NODE_TONE[state]}`}>
        {state === 'current' ? <span className="absolute inset-0 animate-ping-soft rounded-2xl border border-emerald/60" aria-hidden /> : null}
        <Icon size={22} aria-hidden />
        {state === 'dropped' ? (
          <XCircle size={16} className="absolute -right-1.5 -top-1.5 rounded-full bg-surface text-danger" aria-label="Packet dropped here" />
        ) : null}
        {destinationDelivered ? (
          <CheckCircle2 size={16} className="absolute -right-1.5 -top-1.5 rounded-full bg-surface text-emerald-bright" aria-label="Delivered" />
        ) : null}
      </div>
      <div className="absolute left-1/2 top-[62px] w-28 -translate-x-1/2 text-center">
        <div className="truncate text-[12.5px] font-medium text-ink">{node.label || node.id}</div>
        <div className="truncate font-mono text-[10px] text-faint">{node.ip || node.id}</div>
      </div>
    </div>
  );
}

function Connector({ state, label, count }) {
  const line = {
    pending: 'border-t-2 border-dashed border-line-strong',
    done: 'h-[2px] bg-gradient-to-r from-emerald to-accent',
    active: 'h-[2px] bg-gradient-to-r from-emerald/60 to-emerald',
    failed: 'border-t-2 border-dashed border-danger',
  }[state];
  return (
    <div className="relative flex h-14 min-w-[76px] flex-1 flex-col items-center justify-center px-1.5" aria-hidden>
      <span className={`absolute top-0.5 whitespace-nowrap font-mono text-[10px] tabular ${state === 'failed' ? 'text-danger' : 'text-muted'}`}>
        {label}
        {count > 1 ? <span className="ml-1 text-faint">×{count}</span> : null}
      </span>
      <div className={`relative w-full rounded-full ${line}`}>
        {state === 'active' ? (
          <span className="pp-dot absolute -top-[3px] h-2.5 w-2.5 rounded-full bg-emerald shadow-[0_0_12px_rgb(var(--c-brand))]" />
        ) : null}
        {state === 'failed' ? (
          <XCircle size={14} className="absolute -top-[8px] left-1/2 -translate-x-1/2 rounded-full bg-surface text-danger" />
        ) : null}
      </div>
      {state !== 'pending' && state !== 'failed' ? (
        <span className="absolute bottom-1 text-emerald-bright/70">›</span>
      ) : null}
    </div>
  );
}


/** Derive per-hop crossings / timings / failure from events. TCP_SIM crosses the same route several times. */
export function analyzeRoute(packet, events, running) {
  const routeIds = packet?.route?.nodeIds || [];
  const hops = Math.max(0, routeIds.length - 1);
  const crossings = Array(hops).fill(0);
  const lastTiming = Array(hops).fill(null);
  let lastHop = -1;
  let dropped = null;
  // The server emits the final packet up-front; while streaming, trust events rather than packet.status.
  let delivered = !running && packet?.status === 'delivered';
  for (const ev of events) {
    if (ev.kind === 'packet.forwarded' && typeof ev.hopIndex === 'number' && ev.hopIndex < hops) {
      crossings[ev.hopIndex] += 1;
      lastTiming[ev.hopIndex] = totalTimingMs(ev.timing);
      lastHop = ev.hopIndex;
    } else if (ev.kind === 'packet.dropped') {
      dropped = ev;
    } else if (ev.kind === 'packet.delivered') {
      delivered = true;
    }
  }
  if (!running && packet?.status === 'dropped' && !dropped) dropped = { nodeId: routeIds[0], reason: packet.dropReason };
  let failedHop = -1;
  if (dropped && hops > 0) {
    const idx = routeIds.indexOf(dropped.nodeId);
    failedHop = typeof dropped.hopIndex === 'number' ? dropped.hopIndex : dropped.reason === 'link_loss' ? idx - 1 : idx;
    failedHop = Math.min(Math.max(failedHop, 0), hops - 1);
  }
  const inFlight = Boolean(running && !dropped && !delivered && hops > 0);
  const cursor = inFlight ? (lastHop + 1) % hops : -1;
  return { routeIds, hops, crossings, lastTiming, lastHop, dropped, delivered, failedHop, inFlight, cursor };
}

/** Per-hop table under the trace, or a short "what happens on send" hint before any packet exists. */
export function HopDetails({ packet, nodes, events, running, protocol }) {
  const nameOf = (id) => nodes.find((n) => n.id === id)?.label || id;
  if (packet && !packet.route?.nodeIds?.length && packet.status === 'dropped' && !running) {
    return (
      <div className="border-t border-line/80 px-5 py-4">
        <div className="flex gap-3 rounded-xl border border-danger/35 bg-danger/10 p-3.5">
          <XCircle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
          <div className="text-[12.5px] leading-relaxed text-muted">
            <div className="text-[13px] font-semibold text-danger">No route between {nameOf(packet.sourceNodeId)} and {nameOf(packet.destinationNodeId)}</div>
            Every path is blocked — a link or node is probably marked failed, or the two endpoints are not connected.{' '}
            <Link to="/network" className="font-medium text-emerald-bright underline-offset-2 hover:underline">Inspect the topology</Link>.
          </div>
        </div>
      </div>
    );
  }
  if (!packet || !packet.route?.nodeIds?.length) {
    const tcp = protocol === 'TCP_SIM';
    const steps = tcp
      ? ['SYN, SYN-ACK and ACK establish the connection across every hop.', 'The payload is queued, transmitted and propagated hop by hop.', 'Loss triggers retransmission with a retry timeout (up to 3 attempts).']
      : ['A single datagram is queued, transmitted and propagated hop by hop.', 'No handshake, no acknowledgement and no retransmission.', 'A lost datagram is simply dropped — the sender is never told.'];
    return (
      <div className="border-t border-line/80 px-5 py-4">
        <div className="label">What happens on send · {protocol}</div>
        <ul className="space-y-1.5">
          {steps.map((t, i) => (
            <li key={t} className="flex gap-2.5 text-[12.5px] leading-relaxed text-muted">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald/10 font-mono text-[9.5px] font-semibold text-emerald-bright ring-1 ring-emerald/25">{i + 1}</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const { routeIds, hops, crossings, lastTiming, failedHop, cursor } = analyzeRoute(packet, events, running);
  return (
    <div className="overflow-x-auto border-t border-line/80">
      <table className="tbl min-w-[440px]">
        <thead>
          <tr><th className="w-14 text-center">Hop</th><th>Link</th><th className="w-20 text-right">Crossed</th><th className="w-28 text-right">Last delay</th><th className="w-28">State</th></tr>
        </thead>
        <tbody>
          {Array.from({ length: hops }, (_, j) => {
            const state = j === failedHop ? 'failed' : j === cursor ? 'in flight' : crossings[j] > 0 ? 'cleared' : 'pending';
            const tone = { failed: 'text-danger', 'in flight': 'text-emerald-bright', cleared: 'text-emerald-bright', pending: 'text-faint' }[state];
            return (
              <tr key={j}>
                <td className="text-center font-mono text-[11.5px] text-muted">{j + 1}</td>
                <td className="whitespace-nowrap text-[12.5px]"><span className="text-ink">{nameOf(routeIds[j])}</span><span className="mx-1.5 text-faint">→</span><span className="text-ink">{nameOf(routeIds[j + 1])}</span></td>
                <td className="text-right font-mono text-[11.5px] tabular text-muted">×{crossings[j]}</td>
                <td className="text-right font-mono text-[11.5px] tabular text-muted">{lastTiming[j] != null ? `${lastTiming[j].toFixed(3)} ms` : '—'}</td>
                <td><span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${tone}`}><span className={`led ${state === 'in flight' ? 'live' : ''}`} />{state}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Hop-by-hop route visualisation. `events` are normalised (kind) events from timeline and/or live stream.
 * Hop crossing counts come from forwarded events (TCP_SIM crosses the same route several times).
 */
export function RouteTrace({ packet, nodes, events, running, previewSource, previewDestination }) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const routeIds = packet?.route?.nodeIds || [];

  // No packet / no route yet → ghost preview of the selected endpoints.
  if (!packet || routeIds.length === 0) {
    const noRoute = Boolean(packet && packet.status === 'dropped' && !running);
    const ghost = noRoute
      ? [nodeById.get(packet.sourceNodeId), nodeById.get(packet.destinationNodeId)].filter(Boolean)
      : [previewSource, previewDestination].filter(Boolean);
    return (
      <div className="overflow-x-auto px-6 pb-16 pt-5">
        <style>{KEYFRAMES}</style>
        <ol className="flex min-w-max items-start">
          {ghost.length === 2 ? (
            <>
              <li className="flex flex-1 items-start"><NodeChip node={ghost[0]} state={noRoute ? 'dropped' : 'idle'} /><Connector state={noRoute ? 'failed' : 'pending'} label={noRoute ? 'no route' : 'route on send'} count={0} /></li>
              <li className="flex items-start"><NodeChip node={ghost[1]} state="idle" /></li>
            </>
          ) : (
            <li className="text-sm text-muted">Select a source and destination to preview the path.</li>
          )}
        </ol>
      </div>
    );
  }

  const { hops, crossings, lastTiming, dropped, delivered, failedHop, inFlight, cursor } = analyzeRoute(packet, events, running);

  return (
    <div className="overflow-x-auto px-6 pb-16 pt-5">
      <style>{KEYFRAMES}</style>
      <ol className="flex min-w-max items-start" aria-label="Packet route">
        {routeIds.map((id, j) => {
          const node = nodeById.get(id) || { id, label: id, type: 'pc' };
          const reached = j === 0 || crossings[j - 1] > 0;
          let state = reached ? 'reached' : 'idle';
          if (inFlight && j === cursor) state = 'current';
          if (dropped && dropped.nodeId === id) state = 'dropped';
          const isLast = j === routeIds.length - 1;
          const hopState =
            j === failedHop ? 'failed' : j === cursor ? 'active' : crossings[j] > 0 ? 'done' : 'pending';
          const timing = lastTiming[j];
          return (
            <li key={`${id}-${j}`} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
              <NodeChip node={node} state={state} destinationDelivered={isLast && delivered} />
              {!isLast ? (
                <Connector
                  state={hopState}
                  count={crossings[j]}
                  label={hopState === 'failed' ? String(dropped?.reason || 'dropped').replace(/_/g, ' ') : timing != null ? `${timing.toFixed(3)} ms` : `hop ${j + 1}`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
