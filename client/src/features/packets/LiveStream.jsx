import { useEffect, useRef } from 'react';
import { describeEvent, metaFor } from './packetEvents.js';

/** Terminal-style stream of events as they arrive over the socket. */
export function LiveStream({ events, nameOf, running }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-canvas/70 shadow-panel">
      <div className="flex items-center gap-2 border-b border-line bg-elevated/60 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald/70" />
        <span className="ml-2 font-mono text-[11px] text-muted">socket://packet.events</span>
        <span className={`ml-auto flex items-center gap-1.5 font-mono text-[10.5px] ${running ? 'text-emerald-bright' : 'text-faint'}`}>
          <span className={`led ${running ? 'live' : ''}`} />
          {running ? 'streaming' : 'idle'}
        </span>
      </div>
      <div ref={ref} className="h-[260px] overflow-auto p-3 font-mono text-[11.5px] leading-[1.7]" role="log" aria-live="polite" aria-label="Live packet events">
        {events.length === 0 ? (
          <p className="text-faint">
            <span className="text-emerald-bright">$</span> waiting for events<span className="animate-pulse">▌</span>
          </p>
        ) : (
          events.map((ev, i) => {
            const m = metaFor(ev.kind);
            const d = describeEvent(ev, nameOf);
            const path = d.path && d.path.length > 1 ? d.path.map(nameOf).join(' → ') : d.path?.length ? nameOf(d.path[0]) : '';
            return (
              <div key={i} className="flex gap-2 whitespace-nowrap animate-fade">
                <span className="w-12 shrink-0 text-right tabular text-faint">+{((ev.wallMs ?? 0) / 1000).toFixed(2)}s</span>
                <span className={`w-[78px] shrink-0 font-semibold ${m.text}`}>{m.label}</span>
                <span className="min-w-0 truncate text-muted">{path || d.info}</span>
              </div>
            );
          })
        )}
        {running ? <p className="text-faint"><span className="text-emerald-bright">$</span> <span className="animate-pulse">▌</span></p> : null}
      </div>
    </div>
  );
}
