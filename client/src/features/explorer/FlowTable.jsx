import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { tone } from './tones.js';

const SPEEDS = [0.5, 1, 2];

/** Bottom panel: the playback controls and a running table of everything that has happened so far. */
export function FlowTable({ lesson, cursor, playing, speed, onToggle, onStep, onBack, onReset, onSpeed, onJump }) {
  const body = useRef(null);
  const rows = lesson.frames.map((f, i) => (f.row ? { i, row: f.row } : null)).filter(Boolean);
  const preview = cursor < 0;
  const visible = preview ? rows : rows.filter((r) => r.i <= cursor);
  const last = lesson.frames.length - 1;
  const ended = cursor >= last;

  useEffect(() => {
    body.current?.querySelector('[data-current="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [cursor]);

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line/70 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-4">
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink">
            {lesson.kind === 'packet' ? 'Packet flow' : 'Working'}
          </h2>
          <ul className="hidden items-center gap-3.5 md:flex">
            {lesson.legend.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
                <span className={`h-2 w-2 rounded-full ${tone(l.tone).dot}`} /> {l.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <div className="seg" role="group" aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <button key={s} type="button" aria-pressed={speed === s} onClick={() => onSpeed(s)} className="!px-2">{s}×</button>
            ))}
          </div>
          <button type="button" className="btn-secondary btn-sm btn-icon" onClick={onBack} disabled={cursor < 0} aria-label="Previous" title="Previous (left arrow)">
            <ChevronLeft size={15} />
          </button>
          <button type="button" className="btn-primary btn-sm min-w-[92px]" onClick={onToggle} title="Play or pause (space)">
            {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> {ended ? 'Replay' : 'Play'}</>}
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={onStep} disabled={ended} title="Next (right arrow)">
            Step <ChevronRight size={15} />
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={onReset} disabled={cursor < 0} title="Back to the overview (R)">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div ref={body} className="min-h-0 flex-1 overflow-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-12">No.</th>
              {lesson.columns.map((c) => (
                <th key={c.key} className={`${c.align === 'right' ? 'text-right' : ''} ${c.grow ? 'w-full' : 'whitespace-nowrap'}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className={preview ? 'opacity-55' : ''}>
            {visible.map(({ i, row }) => {
              const t = tone(row.tone);
              const current = i === cursor;
              return (
                <tr key={i} data-current={current} onClick={() => onJump(i)} className={`cursor-pointer ${current ? '!bg-emerald/10' : ''}`}>
                  <td>
                    <span className={`grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] font-bold text-canvas ${t.dot}`}>
                      {rows.findIndex((r) => r.i === i) + 1}
                    </span>
                  </td>
                  {lesson.columns.map((c) => (
                    <td key={c.key} className={`${c.align === 'right' ? 'text-right' : ''} ${c.grow ? 'text-ink/90' : 'whitespace-nowrap font-mono text-[12px]'}`}>
                      {c.key === 'type' ? <span className={`font-semibold ${t.text}`}>{row[c.key]}</span> : row[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!preview && visible.length === 0 ? (
          <p className="px-4 py-5 text-[12.5px] text-muted">Nothing has been sent yet. Keep stepping.</p>
        ) : null}
      </div>
    </section>
  );
}
