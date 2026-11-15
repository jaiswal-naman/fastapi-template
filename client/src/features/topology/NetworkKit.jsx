import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  getStraightPath,
  useInternalNode,
} from '@xyflow/react';
import { Monitor, Network, Router, Server, Waypoints } from 'lucide-react';
import { useChartColors } from '../../lib/theme.js';

/** Single source of truth for how each device type looks (2D + panels). 3D uses `hexKey`. */
export const DEVICE_META = {
  pc: {
    label: 'PC',
    desc: 'End host',
    icon: Monitor,
    hexKey: 'info',
    tile: 'bg-info/10 text-info ring-info/30',
    text: 'text-info',
    bar: 'from-info/80',
  },
  router: {
    label: 'Router',
    desc: 'L3 routing',
    icon: Router,
    hexKey: 'accent',
    tile: 'bg-accent/10 text-accent ring-accent/30',
    text: 'text-accent',
    bar: 'from-accent/80',
  },
  switch: {
    label: 'Switch',
    desc: 'L2 switching',
    icon: Network,
    hexKey: 'brand',
    tile: 'bg-emerald/10 text-emerald-bright ring-emerald/30',
    text: 'text-emerald-bright',
    bar: 'from-emerald/80',
  },
  server: {
    label: 'Server',
    desc: 'Service host',
    icon: Server,
    hexKey: 'violet',
    tile: 'bg-violet/10 text-violet ring-violet/30',
    text: 'text-violet',
    bar: 'from-violet/80',
  },
  hub: {
    label: 'Hub',
    desc: 'L1 repeater',
    icon: Waypoints,
    hexKey: 'warn',
    tile: 'bg-warn/10 text-warn ring-warn/30',
    text: 'text-warn',
    bar: 'from-warn/80',
  },
};

export function deviceMeta(type) {
  return DEVICE_META[type] || DEVICE_META.pc;
}

/* ────────────────────────────── Node ────────────────────────────── */

function DeviceNodeImpl({ data, selected }) {
  const meta = deviceMeta(data.deviceType);
  const Icon = meta.icon;
  const isSelected = selected || data.isSelected;
  const failed = data.failed;

  let frame = 'border-line-strong bg-surface/95 hover:border-emerald/50';
  if (failed) frame = 'border-danger/60 bg-danger/5';
  if (data.connectSource) frame = 'border-accent bg-surface ring-4 ring-accent/25 animate-pulse';
  else if (isSelected) {
    frame =
      'border-emerald bg-surface ring-4 ring-emerald/20 shadow-[0_14px_40px_-10px_rgb(var(--c-brand)/0.55)]';
  } else if (data.pulse) frame += ' ring-4 ring-accent/30';

  return (
    <div
      className={`group relative w-[148px] cursor-grab overflow-hidden rounded-xl border px-3 pb-2.5 pt-3 shadow-panel backdrop-blur transition-[border-color,box-shadow] duration-200 active:cursor-grabbing ${frame}`}
    >
      <span className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${failed ? 'from-danger' : meta.bar} to-transparent`} />
      <Handle type="target" position={Position.Top} isConnectable={false} className="!pointer-events-none !h-1.5 !w-1.5 !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0" />
      <div className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ${failed ? 'bg-danger/10 text-danger ring-danger/30' : meta.tile}`}>
          <Icon size={17} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[13px] font-semibold leading-tight tracking-tight text-ink">{data.label}</div>
          <div className={`mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] ${failed ? 'text-danger' : meta.text}`}>
            {failed ? 'Failed' : data.deviceType}
          </div>
        </div>
        <span className={`led self-start ${failed ? 'text-danger' : 'live text-emerald-bright'}`} aria-hidden />
      </div>
      {data.ip ? (
        <div className="mt-2 truncate rounded-md border border-line/70 bg-canvas/50 px-2 py-1 font-mono text-[10px] tabular text-muted">
          {data.ip}
        </div>
      ) : null}
      <Handle type="source" position={Position.Bottom} isConnectable={false} className="!pointer-events-none !h-1.5 !w-1.5 !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0" />
    </div>
  );
}

export const DeviceNode = memo(DeviceNodeImpl);

/* ───────────────────── Floating edge (clips at node borders) ───────────────────── */

function rectEdgePoint(node, other, pad = 4) {
  const w = (node.measured?.width ?? 148) / 2 + pad;
  const h = (node.measured?.height ?? 72) / 2 + pad;
  const cx = node.internals.positionAbsolute.x + (node.measured?.width ?? 148) / 2;
  const cy = node.internals.positionAbsolute.y + (node.measured?.height ?? 72) / 2;
  const ox = other.internals.positionAbsolute.x + (other.measured?.width ?? 148) / 2;
  const oy = other.internals.positionAbsolute.y + (other.measured?.height ?? 72) / 2;
  const dx = ox - cx;
  const dy = oy - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const s = Math.min(dx !== 0 ? w / Math.abs(dx) : Infinity, dy !== 0 ? h / Math.abs(dy) : Infinity);
  return { x: cx + dx * s, y: cy + dy * s };
}

function LinkEdgeImpl({ id, source, target, data, selected }) {
  const c = useChartColors();
  const sNode = useInternalNode(source);
  const tNode = useInternalNode(target);
  if (!sNode || !tNode || !sNode.measured?.width || !tNode.measured?.width) return null;

  const s = rectEdgePoint(sNode, tNode);
  const t = rectEdgePoint(tNode, sNode);
  const [path, lx, ly] = getStraightPath({ sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y });

  const raw = data?.raw || {};
  const failed = Boolean(raw.failed);
  const active = Boolean(data?.active);
  const isSelected = selected || data?.isSelected;

  const stroke = failed ? c.danger : active ? c.accent : isSelected ? c.brand : c.brandSolid;
  const opacity = failed ? 0.85 : active || isSelected ? 1 : 0.5;
  const width = active || isSelected ? 3 : 2;

  const motion = data?.dir === 'reverse' ? `M${t.x},${t.y} L${s.x},${s.y}` : path;
  const loss = Number(raw.lossProbability) > 0 ? ` · ${Math.round(Number(raw.lossProbability) * 1000) / 10}% loss` : '';

  return (
    <>
      {(isSelected || active) && !failed ? (
        <path d={path} fill="none" stroke={stroke} strokeWidth={9} strokeOpacity={0.16} strokeLinecap="round" />
      ) : null}
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={26}
        style={{
          stroke,
          strokeWidth: width,
          strokeOpacity: opacity,
          strokeDasharray: failed ? '7 6' : undefined,
          strokeLinecap: 'round',
        }}
      />
      {active
        ? [0, 0.18, 0.36].map((delay, i) => (
            <circle key={`${data.hopKey}-${i}`} r={5 - i * 1.3} fill={c.accent} opacity={1 - i * 0.28}>
              <animateMotion dur="0.9s" begin={`${delay}s`} repeatCount="indefinite" path={motion} />
            </circle>
          ))
        : null}
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)` }}
          className={`pointer-events-none absolute whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] tabular shadow-panel backdrop-blur ${
            failed
              ? 'border-danger/50 bg-surface/95 text-danger'
              : isSelected
                ? 'border-emerald/60 bg-surface/95 text-emerald-bright'
                : 'border-line-strong bg-surface/90 text-muted'
          }`}
        >
          {failed ? 'FAILED' : `${raw.bandwidthMbps ?? '—'} Mbps${loss}`}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const LinkEdge = memo(LinkEdgeImpl);

export const nodeTypes = { device: DeviceNode };
export const edgeTypes = { link: LinkEdge };
