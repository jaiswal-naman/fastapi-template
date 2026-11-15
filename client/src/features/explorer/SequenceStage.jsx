import { useEffect, useMemo, useRef } from 'react';
import { tone } from './tones.js';

const ROW = 36;
const HEAD = 64;
const LEFT = 15; // % reserved for step labels and times

/** Ladder diagram: one lifeline per device, one arrow per hop, drawn in the order things happen. */
export function SequenceStage({ lesson, cursor }) {
  const scroller = useRef(null);
  const { lanes, rows } = useMemo(() => {
    const label = new Map(lesson.topology.nodes.map((n) => [n.id, n]));
    const order = [];
    const seen = (id) => { if (!order.includes(id)) order.push(id); };
    const list = [];
    let lastStep = -1;
    lesson.frames.forEach((f, i) => {
      if (!f.hop && !f.row) return;
      if (f.hop) { seen(f.hop.from); seen(f.hop.to); }
      list.push({ i, frame: f, heading: f.step !== lastStep ? lesson.steps[f.step].title : null });
      lastStep = f.step;
    });
    return { lanes: order.map((id) => label.get(id)), rows: list };
  }, [lesson]);

  const x = (id) => LEFT + ((lanes.findIndex((n) => n.id === id) + 0.5) * (100 - LEFT - 3)) / lanes.length;
  const height = HEAD + rows.length * ROW + 24;
  const visible = cursor < 0 ? rows : rows.filter((r) => r.i <= cursor);
  const currentIndex = rows.findIndex((r) => r.i === cursor);

  useEffect(() => {
    if (currentIndex < 0 || !scroller.current) return;
    const y = HEAD + currentIndex * ROW;
    const el = scroller.current;
    if (y < el.scrollTop + 60 || y > el.scrollTop + el.clientHeight - 60) el.scrollTo({ top: Math.max(0, y - el.clientHeight / 2), behavior: 'smooth' });
  }, [currentIndex]);

  return (
    <div ref={scroller} className="h-full w-full overflow-auto">
      <svg width="100%" height={height} role="img" aria-label="Sequence diagram" className={cursor < 0 ? 'opacity-60' : ''}>
        <defs>
          {['brand', 'info', 'violet', 'warn', 'danger'].map((t) => (
            <marker key={t} id={`seq-arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" className={tone(t).fill} />
            </marker>
          ))}
        </defs>

        {lanes.map((n) => (
          <g key={n.id}>
            <line x1={`${x(n.id)}%`} x2={`${x(n.id)}%`} y1={HEAD - 8} y2={height - 12} className="stroke-line-strong" strokeDasharray="3 5" />
            <text x={`${x(n.id)}%`} y="22" textAnchor="middle" className="fill-ink text-[12.5px] font-semibold">{n.label}</text>
            {n.ip ? <text x={`${x(n.id)}%`} y="37" textAnchor="middle" className="fill-faint font-mono text-[9.5px]">{n.ip}</text> : null}
          </g>
        ))}

        {visible.map(({ i, frame, heading }, k) => {
          const y = HEAD + k * ROW + 14;
          const active = i === cursor;
          const t = tone(frame.row?.tone || frame.hop?.tone);
          const hop = frame.hop;
          return (
            <g key={i} className={active ? '' : 'opacity-75'}>
              {heading ? <text x="12" y={y - 7} className="fill-emerald-bright font-mono text-[9.5px] uppercase tracking-[0.14em]">{heading}</text> : null}
              <text x="12" y={y + 8} className="fill-faint font-mono text-[10px]">{frame.row?.time}</text>
              {active ? <rect x={`${LEFT - 1}%`} y={y - 12} width={`${100 - LEFT - 1}%`} height={ROW - 4} rx="6" className="fill-raised/70" /> : null}
              {hop ? (
                <>
                  <line
                    x1={`${x(hop.from)}%`}
                    x2={`${hop.lost ? (x(hop.from) + x(hop.to)) / 2 : x(hop.to)}%`}
                    y1={y + 3} y2={y + 3}
                    className={t.stroke}
                    strokeWidth={active ? 2.4 : 1.8}
                    strokeDasharray={hop.lost ? '5 4' : undefined}
                    markerEnd={hop.lost ? undefined : `url(#seq-arrow-${frame.row?.tone || 'brand'})`}
                  />
                  {hop.lost ? <text x={`${(x(hop.from) + x(hop.to)) / 2}%`} dx="6" y={y + 7} className="fill-danger font-mono text-[12px] font-bold">✕</text> : null}
                  <text
                    x={`${(x(hop.from) + (hop.lost ? (x(hop.from) + x(hop.to)) / 2 : x(hop.to))) / 2}%`}
                    y={y - 2}
                    textAnchor="middle"
                    className={`font-mono text-[10.5px] font-semibold ${t.fill}`}
                  >
                    {hop.kind}{hop.lost ? ' lost' : ''}
                  </text>
                </>
              ) : (
                <text x={`${LEFT + 1}%`} y={y + 7} className={`font-mono text-[10.5px] ${t.fill}`}>{frame.row.type}: {frame.row.info}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
