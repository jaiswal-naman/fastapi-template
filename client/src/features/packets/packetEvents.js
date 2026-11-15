/** Shared event metadata for the Packet Playground: categories, colours, descriptions. All class strings are static so Tailwind keeps them. */

export const CATEGORIES = {
  lifecycle: { label: 'Lifecycle', dot: 'bg-info', badge: 'bg-info/10 text-info ring-info/30', text: 'text-info' },
  handshake: { label: 'Handshake', dot: 'bg-violet', badge: 'bg-violet/10 text-violet ring-violet/30', text: 'text-violet' },
  queue: { label: 'Queue', dot: 'bg-faint', badge: 'bg-raised text-muted ring-line-strong', text: 'text-muted' },
  forward: { label: 'Forward', dot: 'bg-accent', badge: 'bg-accent/10 text-accent ring-accent/30', text: 'text-accent' },
  ack: { label: 'Ack / delivered', dot: 'bg-emerald', badge: 'bg-emerald/10 text-emerald-bright ring-emerald/30', text: 'text-emerald-bright' },
  retry: { label: 'Retransmit', dot: 'bg-warn', badge: 'bg-warn/10 text-warn ring-warn/30', text: 'text-warn' },
  drop: { label: 'Dropped', dot: 'bg-danger', badge: 'bg-danger/10 text-danger ring-danger/30', text: 'text-danger' },
};

export const EVENT_META = {
  'packet.created': { label: 'CREATED', cat: 'lifecycle' },
  'route.computed': { label: 'ROUTE', cat: 'lifecycle' },
  'tcp.syn': { label: 'SYN', cat: 'handshake' },
  'tcp.syn_ack': { label: 'SYN-ACK', cat: 'handshake' },
  'tcp.ack': { label: 'ACK', cat: 'ack' },
  'packet.queued': { label: 'QUEUED', cat: 'queue' },
  'packet.forwarded': { label: 'FORWARD', cat: 'forward' },
  'packet.acknowledged': { label: 'ACKED', cat: 'ack' },
  'packet.delivered': { label: 'DELIVERED', cat: 'ack' },
  'packet.dropped': { label: 'DROPPED', cat: 'drop' },
  'packet.retransmit': { label: 'RETRANSMIT', cat: 'retry' },
};

export function metaFor(kind) {
  const m = EVENT_META[kind] || { label: String(kind || 'EVENT').toUpperCase(), cat: 'lifecycle' };
  const { label: catLabel, ...style } = CATEGORIES[m.cat];
  return { ...style, ...m, catLabel };
}

/** Live store events use `packet.hop`; the authoritative timeline calls the same thing `packet.forwarded`. */
export function normalizeLive(liveEvents) {
  const t0 = liveEvents[0]?.at ?? 0;
  // Guard against the same socket event being delivered twice (duplicate listeners): identical payload within 8 ms.
  const sig = (ev) => JSON.stringify({ ...ev, at: 0 });
  const deduped = liveEvents.filter((ev, i) => !(i > 0 && sig(ev) === sig(liveEvents[i - 1]) && Math.abs((ev.at ?? 0) - (liveEvents[i - 1].at ?? 0)) < 8));
  return deduped.map((ev) => ({
    ...ev,
    kind: ev.type === 'packet.hop' ? 'packet.forwarded' : ev.type,
    wallMs: (ev.at ?? t0) - t0,
  }));
}

export function normalizeTimeline(timeline) {
  return timeline.map((ev) => ({ ...ev, kind: ev.type }));
}

const fmt = (n, d = 3) => (typeof n === 'number' ? n.toFixed(d) : '—');

export function totalTimingMs(timing) {
  if (!timing) return null;
  return (timing.transmissionMs || 0) + (timing.propagationMs || 0) + (timing.queueingMs || 0) + (timing.processingMs || 0);
}

/** Human description + the node path an event refers to. */
export function describeEvent(ev, nameOf) {
  const k = ev.kind ?? ev.type;
  switch (k) {
    case 'packet.created':
      return { path: null, info: `${ev.protocol || 'Packet'} packet created` };
    case 'route.computed':
      return {
        path: ev.route?.nodeIds || null,
        info: `Shortest path found · ${ev.route?.linkIds?.length ?? 0} hop${ev.route?.linkIds?.length === 1 ? '' : 's'}`,
      };
    case 'tcp.syn':
      return { path: null, info: `SYN · seq=${ev.sequenceNumber ?? 0} — open connection` };
    case 'tcp.syn_ack':
      return { path: null, info: `SYN-ACK · seq=${ev.sequenceNumber ?? 0} — peer accepts` };
    case 'tcp.ack':
      return { path: null, info: `ACK · seq=${ev.sequenceNumber ?? 0} — handshake complete` };
    case 'packet.queued':
      return { path: ev.nodeId ? [ev.nodeId] : null, info: `Queued at ${nameOf(ev.nodeId)} · depth ${ev.queueLength ?? '—'}` };
    case 'packet.forwarded': {
      const t = ev.timing;
      return {
        path: [ev.fromNodeId, ev.toNodeId],
        info: t
          ? `tx ${fmt(t.transmissionMs)} · prop ${fmt(t.propagationMs)} · queue ${fmt(t.queueingMs)} · proc ${fmt(t.processingMs)} ms`
          : `Hop ${(ev.hopIndex ?? 0) + 1} forwarded`,
      };
    }
    case 'packet.dropped':
      return { path: ev.nodeId ? [ev.nodeId] : null, info: `Dropped · ${String(ev.reason || 'unknown').replace(/_/g, ' ')}` };
    case 'packet.retransmit':
      return { path: null, info: `Attempt ${ev.attempt ?? '—'} · ${String(ev.reason || 'timeout').replace(/_/g, ' ')}` };
    case 'packet.acknowledged':
      return { path: null, info: `Acknowledged · seq=${ev.sequenceNumber ?? 1}` };
    case 'packet.delivered':
      return { path: null, info: `Delivered in ${fmt(ev.totalDelayMs)} ms · ${ev.hops ?? '—'} hops` };
    default:
      return { path: null, info: '' };
  }
}

export const STATUS_TONE = {
  delivered: 'brand',
  dropped: 'danger',
  timed_out: 'warn',
  retransmitting: 'warn',
  in_transit: 'info',
  queued: 'info',
  created: 'neutral',
  idle: 'neutral',
  running: 'brand',
  validating: 'info',
  completed: 'brand',
  failed: 'danger',
};
