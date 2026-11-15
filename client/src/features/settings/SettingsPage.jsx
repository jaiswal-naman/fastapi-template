import { Accessibility, Check, Database, Lock, Monitor, Moon, Palette, Radio, Server, Settings, ShieldOff, Sun, User } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Panel, Badge } from '../../components/ui/Panel.jsx';
import { useLabStore } from '../../store/labStore.js';
import { useTheme } from '../../lib/theme.js';

const THEMES = [
  { v: 'light', label: 'Light', icon: Sun, hint: 'Bright, high-contrast workspace' },
  { v: 'system', label: 'System', icon: Monitor, hint: 'Follow your device setting' },
  { v: 'dark', label: 'Dark', icon: Moon, hint: 'Low-glare instrument panel' },
];

/** Tiny UI thumbnail rendered with fixed mock colours so each option previews its own theme. */
function ThemeThumb({ mode }) {
  const light = mode === 'light';
  const dark = mode === 'dark';
  const pane = (isLight) => (
    <div className={`flex h-full w-full gap-1.5 p-2 ${isLight ? 'bg-[#f1f5fa]' : 'bg-[#050911]'}`}>
      <div className={`w-1/4 rounded ${isLight ? 'bg-white ring-1 ring-[#dce4f0]' : 'bg-[#0b111d] ring-1 ring-[#1e2a40]'}`}>
        <div className="m-1 h-1 w-3/4 rounded-full bg-[#10b981]" />
        <div className={`m-1 h-1 rounded-full ${isLight ? 'bg-[#dce4f0]' : 'bg-[#1e2a40]'}`} />
        <div className={`m-1 h-1 rounded-full ${isLight ? 'bg-[#dce4f0]' : 'bg-[#1e2a40]'}`} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className={`h-1/3 rounded ${isLight ? 'bg-white ring-1 ring-[#dce4f0]' : 'bg-[#0b111d] ring-1 ring-[#1e2a40]'}`}>
          <div className="m-1.5 h-1 w-1/2 rounded-full bg-[#34d399]" />
        </div>
        <div className="flex flex-1 gap-1.5">
          <div className={`flex-1 rounded ${isLight ? 'bg-white ring-1 ring-[#dce4f0]' : 'bg-[#0b111d] ring-1 ring-[#1e2a40]'}`} />
          <div className={`flex-1 rounded ${isLight ? 'bg-white ring-1 ring-[#dce4f0]' : 'bg-[#0b111d] ring-1 ring-[#1e2a40]'}`} />
        </div>
      </div>
    </div>
  );
  if (light || dark) return <div className="h-full w-full overflow-hidden rounded-lg">{pane(light)}</div>;
  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg">
      <div className="h-full w-1/2 overflow-hidden">{pane(true)}</div>
      <div className="h-full w-1/2 overflow-hidden">
        <div className="h-full w-[200%] -translate-x-1/2">{pane(false)}</div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const connectionStatus = useLabStore((s) => s.connectionStatus);
  const currentLab = useLabStore((s) => s.currentLab);
  const pref = useTheme((s) => s.pref);
  const resolved = useTheme((s) => s.resolved);
  const setPref = useTheme((s) => s.setPref);
  const connected = connectionStatus === 'Connected';

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Settings"
        title="Session & environment"
        description="This build uses a local demo session without authentication. Secrets are not stored in the browser."
        icon={Settings}
      />

      <Panel
        title="Appearance"
        icon={Palette}
        subtitle={pref === 'system' ? `Following your device · currently ${resolved}` : `${pref === 'dark' ? 'Dark' : 'Light'} theme`}
      >
        <div role="radiogroup" aria-label="Theme" className="stagger grid gap-3 sm:grid-cols-3">
          {THEMES.map(({ v, label, icon: Icon, hint }) => {
            const on = pref === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPref(v)}
                className={`group relative rounded-xl border p-3 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald ${
                  on
                    ? 'border-emerald bg-emerald/[0.07] shadow-[0_0_0_1px_rgb(var(--c-brand)/0.5),0_10px_30px_-14px_rgb(var(--c-brand)/0.5)]'
                    : 'border-line bg-canvas/30 hover:-translate-y-0.5 hover:border-emerald/45'
                }`}
              >
                <div className="h-24">
                  <ThemeThumb mode={v} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Icon size={15} className={on ? 'text-emerald-bright' : 'text-muted'} />
                  <span className="font-display text-[14px] font-semibold text-ink">{label}</span>
                  {on ? (
                    <span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-emerald text-on-brand">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[12px] text-muted">{hint}</p>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Session" icon={Server} flush>
          <dl className="divide-y divide-line/70">
            <Row icon={User} label="Session type" value="Local demo session" />
            <Row
              icon={Radio}
              label="Realtime link"
              value={
                <Badge tone={connected ? 'brand' : 'danger'} dot>
                  {connectionStatus}
                </Badge>
              }
            />
            <Row icon={Settings} label="Active lab" value={currentLab?.name || 'None'} />
            <Row icon={Database} label="Persistence" value={<span className="font-mono text-[12px]">JSON store on server (server/data)</span>} />
            <Row icon={Lock} label="Auth" value="Not implemented (by design for v1)" />
            <Row icon={ShieldOff} label="Native packet capture" value="Out of scope — simulation only" />
          </dl>
        </Panel>

        <Panel title="Accessibility" icon={Accessibility}>
          <ul className="space-y-3 text-[13px] leading-relaxed text-muted">
            {[
              'Status is never colour-only — text labels accompany indicators.',
              '2D topology and text/list fallbacks accompany the 3D scene.',
              'prefers-reduced-motion is respected in global CSS.',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald/10 text-emerald-bright ring-1 ring-emerald/25">
                  <Check size={11} strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-2.5 text-[12px] text-muted">
            <span className="kbd">Ctrl</span>
            <span className="kbd">K</span>
            <span>opens the command palette from anywhere.</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3.5 text-sm">
      <dt className="flex items-center gap-2.5 text-muted">
        <Icon size={15} className="text-faint" aria-hidden />
        {label}
      </dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
