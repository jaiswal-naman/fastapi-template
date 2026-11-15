import { Cable } from 'lucide-react';
import { deviceMeta } from './NetworkKit.jsx';

/** Accessible text/list view of the topology. Also doubles as a quick selector. */
export function TopologyListFallback({ topology, onSelectNode, onSelectLink, selectedNodeId, selectedLinkId }) {
  const nodes = topology.nodes || [];
  const links = topology.links || [];
  const label = (id) => nodes.find((n) => n.id === id)?.label || id;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="label !mb-0">Topology</span>
        <span className="font-mono text-[10px] text-faint">list view</span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-0.5">
        <ul className="space-y-1" aria-label="Devices">
          {nodes.map((n) => {
            const m = deviceMeta(n.type);
            const Icon = m.icon;
            const active = n.id === selectedNodeId;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onSelectNode(n.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg border px-2 py-1.5 text-left transition ${
                    active ? 'border-emerald/50 bg-emerald/10' : 'border-transparent hover:border-line-strong hover:bg-raised/50'
                  }`}
                >
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 ${n.failed ? 'bg-danger/10 text-danger ring-danger/30' : m.tile}`}>
                    <Icon size={12} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-ink">{n.label}</span>
                    <span className="block truncate font-mono text-[10px] text-faint">{n.id}{n.ip ? ` · ${n.ip}` : ''}</span>
                  </span>
                  <span className={`led shrink-0 ${n.failed ? 'text-danger' : 'text-emerald-bright'}`} aria-label={n.failed ? 'Failed' : 'Healthy'} />
                </button>
              </li>
            );
          })}
        </ul>

        {links.length ? (
          <ul className="space-y-1 border-t border-line pt-3" aria-label="Links">
            {links.map((l) => {
              const active = l.id === selectedLinkId;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => onSelectLink?.(l.id)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                      active ? 'border-emerald/50 bg-emerald/10' : 'border-transparent hover:border-line-strong hover:bg-raised/50'
                    }`}
                  >
                    <Cable size={12} className={l.failed ? 'text-danger' : 'text-faint'} aria-hidden />
                    <span className={`min-w-0 flex-1 truncate font-mono text-[10.5px] ${l.failed ? 'text-danger' : 'text-muted'}`}>
                      {label(l.source)} ↔ {label(l.target)}
                    </span>
                    {l.failed ? <span className="font-mono text-[9.5px] uppercase text-danger">failed</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
