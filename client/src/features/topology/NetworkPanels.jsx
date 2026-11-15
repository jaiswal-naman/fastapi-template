import { useEffect, useMemo, useRef } from 'react';
import { Cable, MousePointerClick, Plus, ShieldAlert, ShieldCheck, Terminal, Trash2 } from 'lucide-react';
import { DeviceTypes } from '@datacompredia/shared';
import { Badge } from '../../components/ui/Panel.jsx';
import { useLabStore } from '../../store/labStore.js';
import { deviceMeta } from './NetworkKit.jsx';

export const PALETTE_TYPES = [DeviceTypes.PC, DeviceTypes.ROUTER, DeviceTypes.SWITCH, DeviceTypes.SERVER, DeviceTypes.HUB];

export const DND_MIME = 'application/x-dcp-device';

/* ───────────────────────────── Palette ───────────────────────────── */

export function DevicePalette({ onAdd }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label !mb-0">Devices</span>
        <span className="font-mono text-[10px] text-faint">click or drag</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PALETTE_TYPES.map((type) => {
          const m = deviceMeta(type);
          const Icon = m.icon;
          return (
            <button
              key={type}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(DND_MIME, type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onAdd(type)}
              aria-label={`Add ${m.label}`}
              className="group relative flex flex-col items-start gap-2 rounded-xl border border-line-strong bg-elevated/50 p-2.5 text-left transition duration-150 hover:-translate-y-0.5 hover:border-emerald/50 hover:bg-raised/60 hover:shadow-panel active:translate-y-0 active:scale-[0.98]"
            >
              <span className={`grid h-9 w-9 place-items-center rounded-lg ring-1 transition group-hover:scale-105 ${m.tile}`}>
                <Icon size={17} aria-hidden />
              </span>
              <span className="w-full min-w-0">
                <span className="block font-display text-[13px] font-semibold leading-tight text-ink">{m.label}</span>
                <span className="block truncate text-[10.5px] text-muted">{m.desc}</span>
              </span>
              <Plus size={13} className="absolute right-2 top-2 text-faint opacity-0 transition group-hover:text-emerald-bright group-hover:opacity-100" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TopologyStats({ topology }) {
  const nodes = topology.nodes || [];
  const links = topology.links || [];
  const failed = nodes.filter((n) => n.failed).length + links.filter((l) => l.failed).length;
  const cells = [
    ['Nodes', nodes.length, 'text-ink'],
    ['Links', links.length, 'text-ink'],
    ['Faults', failed, failed ? 'text-danger' : 'text-muted'],
  ];
  return (
    <div className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-canvas/40">
      {cells.map(([k, v, cls]) => (
        <div key={k} className="px-3 py-2">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">{k}</div>
          <div className={`font-display tabular text-lg font-semibold leading-tight ${cls}`}>{v}</div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────── Inspector ───────────────────────────── */

function Field({ id, label, suffix, children }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        {children}
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[10.5px] text-faint">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

function fmtDelay(ms) {
  if (!Number.isFinite(ms)) return '—';
  if (ms < 0.01) return `${(ms * 1000).toFixed(1)} µs`;
  return `${ms.toFixed(ms < 1 ? 3 : 2)} ms`;
}

export function Inspector({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  onUpdateNode,
  onUpdateLink,
  onToggleNodeFailure,
  onToggleLinkFailure,
  onDelete,
  onSelectNode,
}) {
  if (!selectedNode && !selectedEdge) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-raised text-muted ring-1 ring-line-strong">
          <MousePointerClick size={20} aria-hidden />
        </span>
        <p className="mt-3 font-display text-[14px] font-semibold text-ink">Nothing selected</p>
        <p className="mt-1 max-w-[210px] text-[12px] leading-relaxed text-muted">
          Select a device or link on the canvas to inspect and edit its properties.
        </p>
        <div className="mt-4 space-y-1.5 text-[11px] text-muted">
          <div className="flex items-center gap-2"><span className="kbd">Del</span> remove selection</div>
          <div className="flex items-center gap-2"><span className="kbd">Esc</span> leave connect mode</div>
          <div className="flex items-center gap-2"><span className="kbd">Ctrl</span><span className="kbd">S</span> save topology</div>
        </div>
      </div>
    );
  }

  if (selectedNode) {
    const d = selectedNode.data;
    const m = deviceMeta(d.deviceType);
    const Icon = m.icon;
    const neighbors = edges
      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
      .map((e) => {
        const otherId = e.source === selectedNode.id ? e.target : e.source;
        const other = nodes.find((n) => n.id === otherId);
        return { edgeId: e.id, other, failed: e.data?.raw?.failed };
      })
      .filter((x) => x.other);
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${d.failed ? 'bg-danger/10 text-danger ring-danger/30' : m.tile}`}>
            <Icon size={20} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[15px] font-semibold text-ink">{d.label}</div>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge tone={d.failed ? 'danger' : 'brand'} dot>{d.failed ? 'Failed' : 'Healthy'}</Badge>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{m.label}</span>
            </div>
          </div>
        </div>

        <Field id="node-label" label="Name">
          <input id="node-label" className="field" value={d.label} onChange={(e) => onUpdateNode({ label: e.target.value })} />
        </Field>

        {d.ip !== undefined ? (
          <Field id="node-ip" label="IP address">
            <input id="node-ip" className="field font-mono" value={d.ip || ''} onChange={(e) => onUpdateNode({ ip: e.target.value })} />
          </Field>
        ) : null}

        <Field id="node-q" label="Queue capacity" suffix="pkts">
          <input
            id="node-q"
            type="number"
            min={1}
            className="field pr-12 font-mono"
            value={d.queueCapacity ?? 64}
            onChange={(e) => onUpdateNode({ queueCapacity: Number(e.target.value) || 1 })}
          />
        </Field>

        <div>
          <div className="label">Connected to · {neighbors.length}</div>
          {neighbors.length === 0 ? (
            <p className="text-[12px] text-muted">No links yet. Use Connect mode to wire this device.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {neighbors.map(({ edgeId, other, failed }) => {
                const om = deviceMeta(other.data.deviceType);
                const OIcon = om.icon;
                return (
                  <button
                    key={edgeId}
                    type="button"
                    onClick={() => onSelectNode(other.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border bg-elevated/60 px-2 py-1 text-[11.5px] transition hover:border-emerald/50 hover:text-ink ${failed ? 'border-danger/40 text-danger' : 'border-line-strong text-muted'}`}
                  >
                    <OIcon size={12} className={om.text} aria-hidden />
                    {other.data.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-2 pt-1">
          <button
            type="button"
            className={d.failed ? 'btn-primary w-full' : 'btn-danger w-full'}
            onClick={onToggleNodeFailure}
          >
            {d.failed ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
            {d.failed ? 'Recover node' : 'Trigger node failure'}
          </button>
          <button type="button" className="btn-ghost btn-sm w-full text-muted hover:text-danger" onClick={onDelete}>
            <Trash2 size={13} /> Remove device
          </button>
        </div>
      </div>
    );
  }

  // link
  const raw = selectedEdge.data?.raw || {};
  const a = nodes.find((n) => n.id === selectedEdge.source);
  const b = nodes.find((n) => n.id === selectedEdge.target);
  const delayMs = ((Number(raw.distanceKm) || 0) * 1000) / (Number(raw.propagationSpeedMps) || 1) * 1000;
  const fields = [
    ['bandwidthMbps', 'Bandwidth', 0.1, 'Mbps'],
    ['distanceKm', 'Distance', 0, 'km'],
    ['propagationSpeedMps', 'Prop. speed', 1, 'm/s'],
    ['lossProbability', 'Loss probability', 0, '0–1'],
  ];
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${raw.failed ? 'bg-danger/10 text-danger ring-danger/30' : 'bg-emerald/10 text-emerald-bright ring-emerald/30'}`}>
          <Cable size={20} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] font-semibold text-ink">
            {a?.data.label ?? selectedEdge.source} <span className="text-faint">↔</span> {b?.data.label ?? selectedEdge.target}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge tone={raw.failed ? 'danger' : 'brand'} dot>{raw.failed ? 'Failed' : 'Up'}</Badge>
            <span className="font-mono text-[10.5px] text-muted">{selectedEdge.id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(([key, label, min, unit]) => (
          <div key={key} className={key === 'propagationSpeedMps' ? 'col-span-2' : ''}>
          <Field id={`link-${key}`} label={label} suffix={unit}>
            <input
              id={`link-${key}`}
              type="number"
              step="any"
              min={min}
              className="field pr-12 font-mono text-[13px]"
              value={raw[key] ?? ''}
              onChange={(e) => onUpdateLink({ [key]: Number(e.target.value) })}
            />
          </Field>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">Propagation delay · derived</div>
          <div className="font-display tabular text-base font-semibold text-ink">{fmtDelay(delayMs)}</div>
        </div>
        <span className="font-mono text-[10px] text-faint">d / v</span>
      </div>

      <div className="grid gap-2 pt-1">
        <button type="button" className={raw.failed ? 'btn-primary w-full' : 'btn-danger w-full'} onClick={onToggleLinkFailure}>
          {raw.failed ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
          {raw.failed ? 'Recover link' : 'Trigger link failure'}
        </button>
        <button type="button" className="btn-ghost btn-sm w-full text-muted hover:text-danger" onClick={onDelete}>
          <Trash2 size={13} /> Remove link
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────── Live event log ───────────────────────────── */

const EVENT_STYLE = {
  'packet.hop': { tag: 'HOP', cls: 'text-accent' },
  'packet.queued': { tag: 'QUEUE', cls: 'text-info' },
  'packet.dropped': { tag: 'DROP', cls: 'text-danger' },
  'packet.retransmit': { tag: 'RETX', cls: 'text-warn' },
  'packet.delivered': { tag: 'DONE', cls: 'text-emerald-bright' },
};

function stamp(at) {
  const d = new Date(at);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

export function EventLog({ topology }) {
  const events = useLabStore((s) => s.liveEvents);
  const status = useLabStore((s) => s.simulationStatus);
  const ref = useRef(null);
  const names = useMemo(() => new Map((topology.nodes || []).map((n) => [n.id, n.label])), [topology]);
  const nm = (id) => names.get(id) || id || '?';

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  function describe(ev) {
    switch (ev.type) {
      case 'packet.hop':
        return `${nm(ev.fromNodeId)} → ${nm(ev.toNodeId)}${ev.hopIndex != null ? `  #${ev.hopIndex}` : ''}`;
      case 'packet.queued':
        return `${nm(ev.nodeId)} queue=${ev.queueLength ?? '?'}`;
      case 'packet.dropped':
        return `${ev.nodeId ? `${nm(ev.nodeId)} · ` : ''}${ev.reason || 'dropped'}`;
      case 'packet.retransmit':
        return `attempt ${ev.attempt ?? '?'}${ev.reason ? ` · ${ev.reason}` : ''}`;
      case 'packet.delivered':
        return `${ev.hops ?? '?'} hops · ${ev.totalDelayMs != null ? `${Number(ev.totalDelayMs).toFixed(2)} ms` : '—'}`;
      default:
        return ev.type;
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-line/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-emerald-bright" aria-hidden />
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted">Live events</span>
          <span className="rounded bg-raised px-1.5 font-mono text-[10px] tabular text-muted">{events.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`led ${status === 'running' ? 'live text-emerald-bright' : 'text-faint'}`} aria-hidden />
          <button
            type="button"
            className="font-mono text-[10px] uppercase tracking-wider text-faint transition hover:text-ink disabled:opacity-40"
            disabled={!events.length}
            onClick={() => useLabStore.setState({ liveEvents: [] })}
          >
            clear
          </button>
        </div>
      </div>
      <div ref={ref} className="min-h-0 flex-1 overflow-auto bg-canvas/60 p-2 font-mono text-[11px] leading-[1.7]" role="log" aria-live="off">
        {events.length === 0 ? (
          <div className="px-1 py-1 text-faint">
            <span className="text-emerald-bright">$</span> waiting for packets
            <span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-emerald-bright/80" />
          </div>
        ) : (
          events.map((ev, i) => {
            const st = EVENT_STYLE[ev.type] || { tag: 'EVT', cls: 'text-muted' };
            return (
              <div key={`${ev.at}-${i}`} className="flex gap-2 whitespace-nowrap">
                <span className="shrink-0 text-faint">{stamp(ev.at)}</span>
                <span className={`w-[42px] shrink-0 font-semibold ${st.cls}`}>{st.tag}</span>
                <span className="min-w-0 truncate text-ink/90">{describe(ev)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
