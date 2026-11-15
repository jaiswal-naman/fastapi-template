import { Badge } from '../../components/ui/Panel.jsx';
import { STATUS_TONE } from './packetEvents.js';

const SEGMENTS = [
  { key: 'transmission', label: 'Transmission', bar: 'bg-info', dot: 'bg-info' },
  { key: 'propagation', label: 'Propagation', bar: 'bg-accent', dot: 'bg-accent' },
  { key: 'queueing', label: 'Queueing', bar: 'bg-warn', dot: 'bg-warn' },
  { key: 'processing', label: 'Processing', bar: 'bg-violet', dot: 'bg-violet' },
];

function Field({ k, children, mono = true }) {
  return (
    <div className="min-w-0 rounded-lg border border-line/70 bg-canvas/30 px-3 py-2">
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">{k}</dt>
      <dd className={`mt-0.5 truncate text-[12.5px] text-ink ${mono ? 'font-mono tabular' : ''}`}>{children}</dd>
    </div>
  );
}

export function PacketInspector({ packet }) {
  if (!packet) {
    return <div className="empty-state m-4">No packet yet. Transmit a message to inspect authoritative fields.</div>;
  }
  const d = packet.delays;
  const total = d ? SEGMENTS.reduce((s, x) => s + (d[x.key] || 0), 0) : 0;
  const ms = (n) => (typeof n === 'number' ? `${n.toFixed(4)} ms` : '—');

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[packet.status] || 'neutral'} dot>{String(packet.status).replace(/_/g, ' ')}</Badge>
        <Badge>{packet.protocol}</Badge>
        <span className="truncate font-mono text-[11px] text-faint">{packet.packetId}</span>
      </div>

      <dl className="grid gap-2 sm:grid-cols-2">
        <Field k="Source">{packet.sourceNodeId} <span className="text-muted">({packet.sourceIp || 'n/a'})</span></Field>
        <Field k="Destination">{packet.destinationNodeId} <span className="text-muted">({packet.destinationIp || 'n/a'})</span></Field>
        <Field k="Payload size">{packet.payloadSizeBytes} B</Field>
        <Field k="Sequence">{String(packet.sequenceNumber ?? '—')}</Field>
        <Field k="Hop count">{String(packet.route?.linkIds?.length ?? '—')}</Field>
        <Field k="Attempts">{String(packet.attempts ?? '—')}</Field>
        <Field k="Total delay">{packet.totalDelayMs != null ? ms(packet.totalDelayMs) : '—'}</Field>
        <Field k="Drop reason">{packet.dropReason ? String(packet.dropReason).replace(/_/g, ' ') : '—'}</Field>
      </dl>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label !mb-0">Delay breakdown</span>
          <span className="font-mono text-[11px] tabular text-muted">{d ? ms(total) : '—'}</span>
        </div>
        {d ? (
          <>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-raised" role="img" aria-label="Delay breakdown bar">
              {SEGMENTS.map((s) => {
                const v = d[s.key] || 0;
                return v > 0 && total > 0 ? <span key={s.key} className={`${s.bar} first:rounded-l-full last:rounded-r-full`} style={{ width: `${(v / total) * 100}%` }} /> : null;
              })}
            </div>
            <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
              {SEGMENTS.map((s) => (
                <li key={s.key} className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted"><span className={`h-2 w-2 rounded-full ${s.dot}`} />{s.label}</div>
                  <div className="font-mono text-[11.5px] tabular text-ink">{ms(d[s.key])}</div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[12.5px] text-muted">Delay data is available once the packet completes.</p>
        )}
      </div>
    </div>
  );
}
