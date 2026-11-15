import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Search } from 'lucide-react';

/** Left rail: every topic, filterable, with the open topic's steps listed underneath it. */
export function TopicRail({ groups, lessons, lesson, stepIndex, started, onPick, onStep, searchRef }) {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const activeRef = useRef(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lessons.filter(
      (l) => (tab === 'all' || l.group === tab) && (!needle || `${l.title} ${l.subtitle}`.toLowerCase().includes(needle)),
    );
  }, [lessons, tab, q]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [lesson.id]);

  const count = (id) => lessons.filter((l) => l.group === id).length;

  return (
    <aside className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-line/70 p-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink">Topics</h2>
          <span className="font-mono text-[10.5px] text-faint">{lessons.length} lessons</span>
        </div>
        <label className="relative mt-2.5 block">
          <span className="sr-only">Search topics</span>
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search topics"
            className="field h-9 pl-8 text-[13px]"
          />
        </label>
        <div className="mt-2.5 flex flex-wrap gap-1">
          {[{ id: 'all', label: 'All', n: lessons.length }, ...groups.map((g) => ({ ...g, n: count(g.id) }))].map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={tab === g.id}
              onClick={() => setTab(g.id)}
              className={`rounded-md px-2 py-1 font-mono text-[10.5px] font-medium uppercase tracking-wider transition ${
                tab === g.id ? 'bg-emerald text-on-brand' : 'text-muted hover:bg-raised/70 hover:text-ink'
              }`}
            >
              {g.label} <span className={tab === g.id ? 'opacity-70' : 'text-faint'}>{g.n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {list.length === 0 ? (
          <p className="empty-state m-1">No topic matches "{q}". Try a shorter word.</p>
        ) : null}
        {list.map((l, i) => {
          const active = l.id === lesson.id;
          const heading = tab === 'all' && !q && (i === 0 || list[i - 1].group !== l.group);
          return (
            <div key={l.id}>
              {heading ? (
                <div className="px-2.5 pb-1 pt-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-faint first:pt-1">
                  {groups.find((g) => g.id === l.group)?.label}
                </div>
              ) : null}
              <button
                ref={active ? activeRef : null}
                type="button"
                onClick={() => onPick(l.id)}
                aria-current={active ? 'true' : undefined}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                  active ? 'bg-emerald/10 ring-1 ring-inset ring-emerald/40' : 'hover:bg-raised/60'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[13px] font-semibold ${active ? 'text-ink' : 'text-ink/90'}`}>{l.title}</span>
                  <span className="block truncate text-[11.5px] text-muted">{l.subtitle}</span>
                </span>
                <ChevronRight size={15} className={`shrink-0 transition ${active ? 'rotate-90 text-emerald-bright' : 'text-faint group-hover:text-muted'}`} aria-hidden />
              </button>

              {active ? (
                <ol className="mb-1 ml-4 mt-1 border-l border-line pl-2.5">
                  {l.steps.map((s, k) => {
                    const done = started && k < stepIndex;
                    const current = started && k === stepIndex;
                    return (
                      <li key={s.title}>
                        <button
                          type="button"
                          onClick={() => onStep(k)}
                          className={`flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition hover:bg-raised/60 ${current ? 'bg-raised/70' : ''}`}
                        >
                          <span
                            className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full font-mono text-[10px] font-semibold ${
                              current ? 'bg-emerald text-on-brand' : done ? 'bg-emerald/20 text-emerald-bright' : 'border border-line-strong text-faint'
                            }`}
                          >
                            {done ? <Check size={11} strokeWidth={3} /> : k + 1}
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-[12px] font-medium leading-tight ${current ? 'text-ink' : 'text-muted'}`}>{s.title}</span>
                            <span className="block truncate text-[11px] leading-snug text-faint">{s.subtitle}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
