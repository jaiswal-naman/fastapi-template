import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, BookOpen, Compass, CornerDownLeft, FlaskConical, FolderKanban, Gauge, LayoutDashboard,
  Moon, Network, Plus, Radio, Search, Settings, Signal, Sun,
} from 'lucide-react';
import { useLabStore } from '../../store/labStore.js';
import { useTheme } from '../../lib/theme.js';

export const NAV_ITEMS = [
  { to: '/', label: 'Explorer', icon: Compass, group: 'Learn', hint: 'Guided lessons, step by step' },
  { to: '/lab', label: 'Lab overview', icon: LayoutDashboard, group: 'Workspace', hint: 'Dashboard and recent labs' },
  { to: '/network', label: 'Network Playground', icon: Network, group: 'Build', hint: 'Edit topology in 2D / 3D' },
  { to: '/packets', label: 'Packet Playground', icon: Activity, group: 'Build', hint: 'Transmit and trace packets' },
  { to: '/observatory', label: 'Performance Observatory', icon: Gauge, group: 'Analyze', hint: 'Throughput, latency, loss' },
  { to: '/signal-studio', label: 'Signal Studio', icon: Signal, group: 'Analyze', hint: 'Line coding waveforms' },
  { to: '/channel-lab', label: 'Channel Lab', icon: Radio, group: 'Analyze', hint: 'Noise, bandwidth, capacity' },
  { to: '/experiments', label: 'My Experiments', icon: FolderKanban, group: 'Library', hint: 'Saved runs and reports' },
  { to: '/concepts', label: 'Concepts / Help', icon: BookOpen, group: 'Library', hint: 'Glossary and guides' },
  { to: '/settings', label: 'Settings', icon: Settings, group: 'System', hint: 'Appearance and preferences' },
];

function score(q, text) {
  q = q.toLowerCase(); text = text.toLowerCase();
  if (!q) return 1;
  if (text.includes(q)) return 100 - text.indexOf(q);
  let i = 0;
  for (const ch of text) if (ch === q[i]) i += 1;
  return i === q.length ? 10 : 0;
}

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const labs = useLabStore((s) => s.labs);
  const refreshLabs = useLabStore((s) => s.refreshLabs);
  const loadLab = useLabStore((s) => s.loadLab);
  const toggleTheme = useTheme((s) => s.toggle);
  const resolved = useTheme((s) => s.resolved);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ(''); setIdx(0);
      refreshLabs().catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open, refreshLabs]);

  const items = useMemo(() => {
    const all = [
      ...NAV_ITEMS.map((n) => ({ id: n.to, group: 'Go to', label: n.label, hint: n.hint, icon: n.icon, run: () => navigate(n.to) })),
      { id: 'create', group: 'Actions', label: 'Create new lab', hint: 'Start from a topology template', icon: Plus, run: () => navigate('/create-lab') },
      { id: 'theme', group: 'Actions', label: resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', hint: 'Toggle appearance', icon: resolved === 'dark' ? Sun : Moon, run: toggleTheme },
      ...labs.slice(0, 8).map((l) => ({
        id: `lab-${l.id}`, group: 'Open lab', label: l.name, hint: `${l.template} · ${l.nodeCount ?? ''} nodes`.replace(' ·  nodes', ''), icon: FlaskConical,
        run: async () => { await loadLab(l.id); navigate('/network'); },
      })),
    ];
    return all.map((it) => ({ it, s: score(q, `${it.label} ${it.hint}`) })).filter((x) => x.s > 0).sort((a, b) => (q ? b.s - a.s : 0)).map((x) => x.it);
  }, [q, labs, navigate, loadLab, resolved, toggleTheme]);

  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${idx}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  if (!open) return null;

  const run = (it) => { onClose(); Promise.resolve(it.run()).catch(() => {}); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && items[idx]) { e.preventDefault(); run(items[idx]); }
    else if (e.key === 'Escape') onClose();
  };

  let lastGroup = null;
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[14vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <button type="button" className="animate-fade absolute inset-0 bg-canvas/70 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="animate-pop relative w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-surface/95 shadow-float backdrop-blur-2xl" onKeyDown={onKey}>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <Search size={17} className="text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages, labs and actions…"
            className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
          <span className="kbd">esc</span>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted">No results for “{q}”</div>
          ) : (
            items.map((it, i) => {
              const header = it.group !== lastGroup;
              lastGroup = it.group;
              const Icon = it.icon;
              return (
                <div key={it.id}>
                  {header ? <div className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{it.group}</div> : null}
                  <button
                    type="button"
                    data-i={i}
                    onMouseMove={() => setIdx(i)}
                    onClick={() => run(it)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${i === idx ? 'bg-emerald/12 text-ink ring-1 ring-emerald/30' : 'text-muted'}`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${i === idx ? 'bg-emerald/20 text-emerald-bright' : 'bg-raised text-muted'}`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13.5px] font-medium ${i === idx ? 'text-ink' : 'text-ink/90'}`}>{it.label}</span>
                      <span className="block truncate text-[11.5px] text-muted">{it.hint}</span>
                    </span>
                    {i === idx ? <CornerDownLeft size={14} className="text-emerald-bright" /> : null}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-elevated/60 px-4 py-2 font-mono text-[10.5px] text-faint">
          <span className="flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span className="flex items-center gap-1.5"><span className="kbd">↵</span> select</span>
          <span className="ml-auto">DataComPredia</span>
        </div>
      </div>
    </div>
  );
}
