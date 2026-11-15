import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FlaskConical, Play, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';
import { Wordmark } from '../../components/ui/Logo.jsx';
import { ThemeQuickToggle } from '../../components/ui/ThemeToggle.jsx';
import { TopicRail } from './TopicRail.jsx';
import { DetailPanel } from './DetailPanel.jsx';
import { FlowTable } from './FlowTable.jsx';
import { NetworkStage } from './NetworkStage.jsx';
import { SequenceStage } from './SequenceStage.jsx';
import { ScopeStage } from './ScopeStage.jsx';

const LAYERS = ['Physical', 'Data link', 'Network', 'Transport'];

// Lessons never change while the app is open, so one fetch serves every visit to this page.
let cached = null;

/** How long a frame stays on screen at 1x: long enough to read its caption. */
const dwell = (frame) => Math.min(4400, Math.max(1700, 900 + frame.note.length * 34));

function TopBar({ layer }) {
  return (
    <header className="relative z-[2] flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line/70 bg-canvas/60 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-6">
        <Link to="/" aria-label="DataComPredia home"><Wordmark /></Link>
        {layer ? (
          <div className="hidden items-center gap-2 xl:flex" title="Where this topic sits in the layered network model">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">Layer</span>
            <ol className="flex items-center gap-1">
              {LAYERS.map((name, i) => {
                const on = layer.n === i + 1;
                return (
                  <li
                    key={name}
                    aria-current={on ? 'true' : undefined}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10.5px] transition ${
                      on ? 'border-emerald/50 bg-emerald/10 text-emerald-bright' : 'border-line text-faint'
                    }`}
                  >
                    <span className="font-bold">{i + 1}</span> {name}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 text-[11.5px] text-faint lg:flex">
          <span className="kbd">Space</span> play <span className="kbd ml-1.5">←</span><span className="kbd">→</span> step
        </span>
        <Link to="/lab" className="btn-secondary btn-sm" title="Build your own networks and run your own experiments">
          <FlaskConical size={14} aria-hidden /> Open the lab
        </Link>
        <ThemeQuickToggle />
      </div>
    </header>
  );
}

function Skeleton() {
  return (
    <div className="relative z-[1] grid flex-1 gap-3 p-3 lg:grid-cols-[292px_minmax(0,1fr)_336px] lg:grid-rows-[minmax(0,1fr)_236px]">
      <div className="panel skeleton hidden lg:row-span-2 lg:block" />
      <div className="panel skeleton min-h-[320px]" />
      <div className="panel skeleton hidden lg:block" />
      <div className="panel skeleton min-h-[160px] lg:col-span-2" />
    </div>
  );
}

export function ExplorerPage() {
  const [data, setData] = useState(cached);
  const [error, setError] = useState(null);
  const [params, setParams] = useSearchParams();
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState('network');
  const searchRef = useRef(null);

  const load = useCallback(() => {
    setError(null);
    api.explorer().then((d) => { cached = d; setData(d); }).catch(setError);
  }, []);
  useEffect(() => { if (!cached) load(); }, [load]);

  const lessons = data?.lessons ?? [];
  const lesson = lessons.find((l) => l.id === params.get('t')) ?? lessons[0];
  const last = lesson ? lesson.frames.length - 1 : 0;
  const frame = lesson && cursor >= 0 ? lesson.frames[Math.min(cursor, last)] : null;
  const stepIndex = frame ? frame.step : 0;

  useEffect(() => { setCursor(-1); setPlaying(false); }, [lesson?.id]);

  // Auto-advance while playing.
  useEffect(() => {
    if (!playing || !lesson) return undefined;
    if (cursor >= last) { setPlaying(false); return undefined; }
    const wait = cursor < 0 ? 250 : dwell(lesson.frames[cursor]) / speed;
    const id = setTimeout(() => setCursor((c) => c + 1), wait);
    return () => clearTimeout(id);
  }, [playing, cursor, speed, lesson, last]);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p) setCursor((c) => (c >= last ? 0 : c));
      return !p;
    });
  }, [last]);
  const step = useCallback(() => { setPlaying(false); setCursor((c) => Math.min(last, c + 1)); }, [last]);
  const back = useCallback(() => { setPlaying(false); setCursor((c) => Math.max(-1, c - 1)); }, []);
  const reset = useCallback(() => { setPlaying(false); setCursor(-1); }, []);
  const jump = useCallback((i) => { setPlaying(false); setCursor(i); }, []);
  const pick = useCallback((id) => setParams({ t: id }), [setParams]);
  const toStep = useCallback(
    (k) => jump(lesson.frames.findIndex((f) => f.step === k)),
    [jump, lesson],
  );

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ') {
        // A focused button would also "click" on Space; drop the focus so Space only plays or pauses.
        e.preventDefault();
        if (e.target instanceof HTMLElement && e.target !== document.body) e.target.blur();
        toggle();
      }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key.toLowerCase() === 'r') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, step, back, reset]);

  const flight = frame ? Math.min(1150, dwell(frame) * 0.62) / speed : 0;
  const isPacket = lesson?.kind === 'packet';

  return (
    <div className="relative flex min-h-[100dvh] flex-col lg:h-[100dvh] lg:overflow-hidden">
      <div className="backdrop" aria-hidden />
      <TopBar layer={lesson?.layer} />

      {error ? (
        <div className="relative z-[1] grid flex-1 place-items-center p-6">
          <div className="panel max-w-md p-6 text-center">
            <h1 className="font-display text-lg font-semibold text-ink">The lessons did not load</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">The server did not answer. It may be waking up. Try again in a moment.</p>
            <button type="button" className="btn-primary mt-4" onClick={load}><RefreshCw size={14} /> Try again</button>
          </div>
        </div>
      ) : !lesson ? (
        <Skeleton />
      ) : (
        <main className="relative z-[1] grid flex-1 gap-3 p-3 lg:min-h-0 lg:grid-cols-[292px_minmax(0,1fr)_336px] lg:grid-rows-[minmax(0,1fr)_236px]">
          {/* Small screens: a plain picker instead of the rail. */}
          <label className="lg:hidden">
            <span className="label">Topic</span>
            <select className="field" value={lesson.id} onChange={(e) => pick(e.target.value)}>
              {data.groups.map((g) => (
                <optgroup key={g.id} label={g.label}>
                  {lessons.filter((l) => l.group === g.id).map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="hidden min-h-0 lg:row-span-2 lg:flex lg:flex-col">
            <TopicRail
              groups={data.groups}
              lessons={lessons}
              lesson={lesson}
              stepIndex={stepIndex}
              started={cursor >= 0}
              onPick={pick}
              onStep={toStep}
              searchRef={searchRef}
            />
          </div>

          {/* Stage */}
          <section className="panel bracket flex min-h-[380px] min-w-0 flex-col overflow-hidden lg:min-h-0">
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3">
              {isPacket ? (
                <div className="seg">
                  <button type="button" aria-pressed={view === 'network'} onClick={() => setView('network')}>Network</button>
                  <button type="button" aria-pressed={view === 'sequence'} onClick={() => setView('sequence')}>Sequence</button>
                </div>
              ) : (
                <span className="eyebrow">Signal on the wire</span>
              )}
              <span className="font-mono text-[10.5px] tabular text-faint">
                {cursor < 0 ? `${lesson.steps.length} steps` : `${cursor + 1} / ${lesson.frames.length}`}
              </span>
            </div>

            <div className="stage-grid relative min-h-0 flex-1 px-3 py-1">
              {isPacket && view === 'network' ? (
                <NetworkStage topology={lesson.topology} frame={frame} frameKey={`${lesson.id}-${cursor}`} duration={flight} />
              ) : isPacket ? (
                <SequenceStage lesson={lesson} cursor={cursor} />
              ) : (
                <ScopeStage scope={lesson.scope} show={frame?.show} slot={frame?.slot} band={frame?.band} preview={cursor < 0} />
              )}
            </div>

            {/* Caption: one plain sentence about what is on screen right now. */}
            <div className="flex min-h-[58px] shrink-0 items-center gap-3 border-t border-line/70 bg-elevated/40 px-4 py-2.5">
              {cursor < 0 ? (
                <>
                  <button type="button" onClick={toggle} className="btn-primary h-9 w-9 shrink-0 !rounded-full !p-0" aria-label="Play this topic">
                    <Play size={15} className="translate-x-px" />
                  </button>
                  <p className="text-[13.5px] text-muted">
                    <span className="font-medium text-ink">Press Play</span> to watch {lesson.title} happen step by step, or use Step to go at your own pace.
                  </p>
                </>
              ) : (
                <p key={cursor} className="animate-fade text-[14px] leading-snug text-ink">{frame.note}</p>
              )}
            </div>
            <div className="h-[3px] shrink-0 bg-line/60">
              <div className="h-full bg-emerald transition-[width] duration-300" style={{ width: `${((cursor + 1) / lesson.frames.length) * 100}%` }} />
            </div>
          </section>

          <DetailPanel lesson={lesson} frame={frame} stepIndex={stepIndex} />

          <div className="flex min-h-[220px] min-w-0 flex-col lg:col-span-2 lg:min-h-0">
            <FlowTable
              lesson={lesson}
              cursor={cursor}
              playing={playing}
              speed={speed}
              onToggle={toggle}
              onStep={step}
              onBack={back}
              onReset={reset}
              onSpeed={setSpeed}
              onJump={jump}
            />
          </div>
        </main>
      )}
    </div>
  );
}
