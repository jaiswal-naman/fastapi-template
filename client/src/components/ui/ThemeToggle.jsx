import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme.js';

const OPTS = [
  { v: 'light', icon: Sun, label: 'Light' },
  { v: 'system', icon: Monitor, label: 'System' },
  { v: 'dark', icon: Moon, label: 'Dark' },
];

export function ThemeToggle() {
  const pref = useTheme((s) => s.pref);
  const setPref = useTheme((s) => s.setPref);
  return (
    <div className="inline-flex rounded-lg border border-line-strong bg-canvas/50 p-0.5" role="radiogroup" aria-label="Theme">
      {OPTS.map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={pref === v}
          aria-label={label}
          title={label}
          onClick={() => setPref(v)}
          className={`grid h-7 w-7 place-items-center rounded-md transition ${
            pref === v ? 'bg-emerald text-on-brand shadow-[0_4px_12px_-4px_rgb(var(--c-brand)/0.7)]' : 'text-muted hover:text-ink'
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

/** Compact single-button variant for the top bar. */
export function ThemeQuickToggle() {
  const resolved = useTheme((s) => s.resolved);
  const toggle = useTheme((s) => s.toggle);
  const Icon = resolved === 'dark' ? Sun : Moon;
  return (
    <button type="button" className="btn-secondary btn-icon" onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
      <Icon size={15} />
    </button>
  );
}
