import { CATEGORIES, describeEvent, metaFor } from './packetEvents.js';
import { Layers } from 'lucide-react';

export function FlowLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5" aria-label="Legend">
      {Object.entries(CATEGORIES).map(([key, c]) => (
        <li key={key} className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
          <span className={`h-2 w-2 rounded-full ${c.dot}`} />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

function PathCell({ path, nameOf }) {
  if (!path || path.length === 0) return <span className="text-faint">—</span>;
  return (
    <span className="font-mono text-[11.5px] text-muted">
      {path.map((id, i) => (
        <span key={`${id}-${i}`}>
          {i > 0 ? <span className="mx-1 text-faint">→</span> : null}
          <span className="text-ink">{nameOf(id)}</span>
        </span>
      ))}
    </span>
  );
}

export function PacketFlowTable({ events, nameOf, live }) {
  if (events.length === 0) {
    return (
      <div className="px-4 pb-5 pt-1">
        <div className="relative overflow-hidden rounded-xl border border-dashed border-line-strong bg-canvas/30">
          {[0.55, 0.38, 0.24, 0.12].map((o, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-line/50 px-4 py-3 last:border-b-0" style={{ opacity: o }} aria-hidden>
              <span className="h-6 w-6 rounded-full bg-raised" />
              <span className="h-2.5 w-14 rounded bg-raised" />
              <span className="h-5 w-20 rounded-full bg-raised" />
              <span className="h-2.5 flex-1 rounded bg-raised" />
            </div>
          ))}
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-surface/90 via-surface/40 to-transparent">
            <div className="flex flex-col items-center gap-1 px-4 text-center">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald/10 text-emerald-bright ring-1 ring-emerald/25"><Layers size={17} /></span>
              <p className="text-[13px] font-medium text-ink">No events yet</p>
              <p className="text-[12px] text-muted">Press <span className="font-semibold text-ink">Transmit</span> — events appear here as the engine emits them.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="tbl min-w-[680px]">
        <thead>
          <tr>
            <th className="w-14 text-center">No.</th>
            <th className="w-28">{live ? 'Wall time' : 'Sim time'}</th>
            <th className="w-36">Event</th>
            <th className="w-[26%]">Path</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev, i) => {
            const m = metaFor(ev.kind ?? ev.type);
            const d = describeEvent(ev, nameOf);
            const time = live ? `+${((ev.wallMs ?? 0) / 1000).toFixed(2)} s` : `${(ev.simTimeMs ?? 0).toFixed(3)} ms`;
            return (
              <tr key={`${ev.kind ?? ev.type}-${i}`} className="animate-fade" style={{ animationDelay: `${Math.min(i, 14) * 22}ms` }}>
                <td className="text-center">
                  <span className={`mx-auto grid h-6 w-6 place-items-center rounded-full font-mono text-[10.5px] font-semibold ring-1 ${m.badge}`}>{i + 1}</span>
                </td>
                <td className="font-mono text-[11.5px] tabular text-muted">{time}</td>
                <td>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10.5px] font-semibold tracking-wide ring-1 ${m.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                    {m.label}
                  </span>
                </td>
                <td><PathCell path={d.path} nameOf={nameOf} /></td>
                <td className="text-[12px] text-muted">{d.info}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
