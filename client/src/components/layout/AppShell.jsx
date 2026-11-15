import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  FolderKanban,
  Gauge,
  Network,
  Radio,
  Settings,
  Signal,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useLabStore } from '../../store/labStore.js';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/network', label: 'Network Playground', icon: Network },
  { to: '/packets', label: 'Packet Playground', icon: Activity },
  { to: '/observatory', label: 'Performance Observatory', icon: Gauge },
  { to: '/signal-studio', label: 'Signal Studio', icon: Signal },
  { to: '/channel-lab', label: 'Channel Lab', icon: Radio },
  { to: '/experiments', label: 'My Experiments', icon: FolderKanban },
  { to: '/concepts', label: 'Concepts / Help', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const TITLES = {
  '/': 'Overview',
  '/create-lab': 'Create Lab',
  '/network': 'Network Playground',
  '/packets': 'Packet Playground',
  '/observatory': 'Performance Observatory',
  '/signal-studio': 'Signal Studio',
  '/channel-lab': 'Channel Lab',
  '/experiments': 'My Experiments',
  '/concepts': 'Concepts / Help',
  '/settings': 'Settings',
};

export function AppShell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const connectionStatus = useLabStore((s) => s.connectionStatus);
  const currentLab = useLabStore((s) => s.currentLab);
  const unsaved = useLabStore((s) => s.unsaved);
  const simulationStatus = useLabStore((s) => s.simulationStatus);
  const notice = useLabStore((s) => s.notice);
  const clearNotice = useLabStore((s) => s.clearNotice);

  const title =
    TITLES[location.pathname] ||
    (location.pathname.startsWith('/experiments/') ? 'Experiment Report' : 'DataComPredia');

  return (
    <div className="flex h-full min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-line bg-[#0a1f1a]/95 p-4 backdrop-blur-md transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-7 flex items-start justify-between gap-2">
          <div>
            <div className="text-[1.35rem] font-semibold tracking-tight text-emerald-bright">DataComPredia</div>
            <p className="mt-1 text-[11px] leading-snug text-muted">Explore. Transmit. Visualize. Understand.</p>
          </div>
          <button type="button" className="btn-secondary lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Primary">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-link ${
                  isActive
                    ? 'bg-emerald/15 text-emerald-bright ring-1 ring-emerald/30'
                    : 'text-muted hover:bg-elevated/70 hover:text-ink'
                }`
              }
            >
              <Icon size={16} aria-hidden className="opacity-90" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-xl border border-line bg-gradient-to-br from-elevated to-surface p-3 text-xs text-muted">
          <div className="font-semibold text-ink">Local demo session</div>
          <p className="mt-1 leading-relaxed">No fake user account. Labs persist on this server instance only.</p>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/55 lg:hidden"
          aria-label="Dismiss navigation overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line/80 bg-[#071a16]/85 px-4 py-3 backdrop-blur-md md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" className="btn-secondary lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
                <Menu size={16} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  {currentLab ? <span className="truncate">Lab: {currentLab.name}</span> : <span>No lab loaded</span>}
                  {unsaved ? (
                    <span className="status-pill border-warn/40 text-warn">Unsaved changes</span>
                  ) : (
                    <span className="status-pill">Saved</span>
                  )}
                  <span className="status-pill capitalize">Sim: {simulationStatus}</span>
                </div>
              </div>
            </div>
            <span
              className={`status-pill ${
                connectionStatus === 'Connected' ? 'border-emerald/40 text-emerald-bright' : 'border-danger/40 text-danger'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${connectionStatus === 'Connected' ? 'bg-emerald' : 'bg-danger'}`}
                aria-hidden
              />
              {connectionStatus}
            </span>
          </div>
        </header>

        {notice ? (
          <div
            className={`mx-4 mt-3 flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm md:mx-6 ${
              notice.type === 'error'
                ? 'border-danger/40 bg-danger/10 text-danger'
                : notice.type === 'warning'
                  ? 'border-warn/40 bg-warn/10 text-warn'
                  : 'border-emerald/40 bg-emerald/10 text-emerald-bright'
            }`}
            role="status"
          >
            <span>{notice.message}</span>
            <button type="button" className="shrink-0 text-xs underline" onClick={clearNotice}>
              Dismiss
            </button>
          </div>
        ) : null}

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
