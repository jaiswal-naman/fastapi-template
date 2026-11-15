export function TopologyListFallback({ topology, onSelectNode }) {
  return (
    <div className="border-t border-line pt-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">Text / list view</div>
      <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
        {(topology.nodes || []).map((n) => (
          <li key={n.id}>
            <button type="button" className="text-left hover:text-emerald-bright" onClick={() => onSelectNode(n.id)}>
              <span className="font-mono">{n.id}</span> · {n.label} · {n.type}
              {n.failed ? ' · Failed' : ''}
            </button>
          </li>
        ))}
      </ul>
      <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs text-muted">
        {(topology.links || []).map((l) => (
          <li key={l.id} className="font-mono">
            {l.id}: {l.source}↔{l.target}
            {l.failed ? ' · Failed' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
