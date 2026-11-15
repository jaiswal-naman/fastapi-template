import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { tone } from './tones.js';

function Facts({ items }) {
  return (
    <dl className="mt-3 divide-y divide-line/60 border-y border-line/60">
      {items.map((f) => (
        <div key={f.label} className="flex items-baseline justify-between gap-4 py-2">
          <dt className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">{f.label}</dt>
          <dd className="text-right text-[12.5px] text-ink">
            {f.value}
            {f.hint ? <span className="block font-mono text-[10.5px] text-faint">{f.hint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Right panel: what the topic is, then what is happening at the current step. */
export function DetailPanel({ lesson, frame, stepIndex }) {
  const started = Boolean(frame);
  const [tab, setTab] = useState('overview');
  useEffect(() => { setTab(started ? 'step' : 'overview'); }, [started, lesson.id]);
  const step = lesson.steps[stepIndex];
  const showStep = tab === 'step' && started;
  const hop = frame?.hop;

  return (
    <aside className="panel order-last flex min-h-0 flex-col overflow-hidden lg:order-none">
      <div className="flex shrink-0 items-center justify-between border-b border-line/70 px-4 py-2.5">
        <div className="seg">
          <button type="button" aria-pressed={!showStep} onClick={() => setTab('overview')}>Overview</button>
          <button type="button" aria-pressed={showStep} disabled={!started} onClick={() => setTab('step')} className="disabled:opacity-40">This step</button>
        </div>
        <span className="font-mono text-[10.5px] text-faint xl:hidden">Layer {lesson.layer.n}: {lesson.layer.name}</span>
      </div>

      <div key={showStep ? `s${stepIndex}` : 'o'} className="page-enter min-h-0 flex-1 overflow-y-auto p-4">
        {showStep ? (
          <>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-emerald-bright">
              Step {stepIndex + 1} of {lesson.steps.length}
            </div>
            <h2 className="mt-1.5 font-display text-[21px] font-semibold leading-tight tracking-tight text-ink">{step.title}</h2>
            <p className="mt-0.5 text-[13px] text-muted">{step.subtitle}</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink/90">{step.body}</p>

            {hop || frame.row?.type ? (
              <div className={`mt-4 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold ${tone(frame.row?.tone || hop?.tone).chip}`}>
                {frame.row?.type ?? hop.kind}
                {hop?.lost ? <span>lost</span> : null}
              </div>
            ) : null}
            <Facts items={frame.detail} />
          </>
        ) : (
          <>
            <h2 className="font-display text-[23px] font-semibold leading-tight tracking-tight text-ink">{lesson.title}</h2>
            <p className="mt-0.5 text-[13px] text-muted">{lesson.subtitle}</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink/90">{lesson.overview.text}</p>
            <Facts items={lesson.overview.facts} />
            <Link to={lesson.lab.to} className="btn-secondary btn-sm mt-4">
              {lesson.lab.label} <ArrowUpRight size={14} aria-hidden />
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
