import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, ChevronRight, Menu, Plus, Search, Wifi, WifiOff, X } from 'lucide-react';
import { useLabStore } from '../../store/labStore.js';
import { Wordmark, LogoMark } from '../ui/Logo.jsx';
import { ThemeQuickToggle } from '../ui/ThemeToggle.jsx';
import { Toaster } from '../ui/Toaster.jsx';
import { CommandPalette, NAV_ITEMS } from '../ui/CommandPalette.jsx';

const GROUPS = ['Workspace', 'Build', 'Analyze', 'Library'];

const TITLES = {
  '/create-lab': 'Create Lab',
  ...Object.fromEntries(NAV_ITEMS.map((n) => [n.to, n.label])),
};

const SIM_TONE = {
  idle: 'text-faint',
  validating: 'text-info',
  running: 'text-emerald-bright',
  completed: 'text-emerald-bright',
  failed: 'text-danger',
};

export function AppShell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('dcp-nav-collapsed') === '1'; } catch { return false; }
  });
  const connectionStatus = useLabStore((s) => s.connectionStatus);
  const currentLab = useLabStore((s) => s.currentLab);
  const unsaved = useLabStore((s) => s.unsaved);
  const simulationStatus = useLabStore((s) => s.simulationStatus);

  const connected = connectionStatus === 'Connected';
  const section = location.pathname.startsWith('/experiments/') ? 'Experiment Report' : TITLES[location.pathname] || 'DataComPredia';
  const isOverview = location.pathname === '/';

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    try { localStorage.setItem('dcp-nav-collapsed', collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((v) => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const width = collapsed ? 'lg:w-[76px]' : 'lg:w-[268px]';

  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="backdrop" aria-hidden />

      {/* ───────── Sidebar ───────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-line bg-surface/85 backdrop-blur-2xl transition-[transform,width] duration-300 lg:static ${width} ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-line/70 ${collapsed ? 'lg:justify-center lg:px-0' : ''} justify-between px-4`}>
          <Link to="/" aria-label="DataComPredia home" className="min-w-0">
            <span className="hidden lg:block">{collapsed ? <LogoMark /> : <Wordmark />}</span>
            <span className="lg:hidden"><Wordmark /></span>
          </Link>
          <button type="button" className="btn-ghost btn-icon lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Primary">
          {GROUPS.map((group) => (
            <div key={group}>
              <div className={`mb-1.5 px-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-faint ${collapsed ? 'lg:hidden' : ''}`}>{group}</div>
              {collapsed ? <div className="mx-3 mb-2 hidden h-px bg-line lg:block" /> : null}
              <div className="flex flex-col gap-0.5">
                {NAV_ITEMS.filter((n) => n.group === group).map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      `nav-link group ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
                        isActive ? 'bg-emerald/12 text-ink' : 'text-muted hover:bg-raised/60 hover:text-ink'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald shadow-[0_0_12px_rgb(var(--c-brand))]" /> : null}
                        <Icon size={17} aria-hidden className={isActive ? 'text-emerald-bright' : 'text-muted group-hover:text-ink'} />
                        <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-line/70 p-3">
          <NavLink
            to="/settings"
            title={collapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              `nav-link ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${isActive ? 'bg-emerald/12 text-ink' : 'text-muted hover:bg-raised/60 hover:text-ink'}`
            }
          >
            {(() => { const S = NAV_ITEMS.find((n) => n.to === '/settings').icon; return <S size={17} />; })()}
            <span className={collapsed ? 'lg:hidden' : ''}>Settings</span>
          </NavLink>

          <div className={`rounded-xl border border-line bg-elevated/50 p-3 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-ink">
              <span className={`led ${connected ? 'live text-emerald-bright' : 'text-danger'}`} />
              Local demo session
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">No account needed. Labs persist on this server instance.</p>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="btn-ghost hidden w-full justify-center lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> <span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {open ? (
        <button type="button" className="animate-fade fixed inset-0 z-30 bg-canvas/70 backdrop-blur-sm lg:hidden" aria-label="Dismiss navigation overlay" onClick={() => setOpen(false)} />
      ) : null}

      {/* ───────── Main column ───────── */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line/70 bg-canvas/55 px-4 backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="btn-secondary btn-icon lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
              <Menu size={16} />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <Link to="/" className="hidden text-muted transition hover:text-ink sm:block">Lab</Link>
              <ChevronRight size={14} className="hidden text-faint sm:block" />
              <h1 className="truncate font-display text-[15px] font-semibold tracking-tight text-ink">
                {isOverview ? 'Overview' : section}
              </h1>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="group hidden h-9 w-[280px] items-center gap-2.5 rounded-lg border border-line-strong bg-elevated/50 px-3 text-left text-[13px] text-faint transition hover:border-emerald/40 hover:text-muted md:flex"
              aria-label="Open command palette"
            >
              <Search size={15} />
              <span className="flex-1">Search or jump to…</span>
              <span className="kbd">Ctrl</span><span className="kbd -ml-1">K</span>
            </button>
            <button type="button" className="btn-secondary btn-icon md:hidden" aria-label="Search" onClick={() => setPaletteOpen(true)}>
              <Search size={15} />
            </button>

            {currentLab ? (
              <Link to="/network" className="status-pill hidden max-w-[220px] transition hover:border-emerald/40 hover:text-ink xl:inline-flex" title={currentLab.name}>
                <span className={`h-1.5 w-1.5 rounded-full ${unsaved ? 'bg-warn' : 'bg-emerald'}`} />
                <span className="truncate">{currentLab.name}</span>
                {unsaved ? <span className="text-warn">• unsaved</span> : null}
              </Link>
            ) : (
              <Link to="/create-lab" className="btn-secondary btn-sm hidden xl:inline-flex"><Plus size={14} /> New lab</Link>
            )}

            <span className="status-pill hidden sm:inline-flex" title="Simulation state">
              <span className={`led ${simulationStatus === 'running' ? 'live' : ''} ${SIM_TONE[simulationStatus] || 'text-faint'}`} />
              <span className="capitalize">{simulationStatus}</span>
            </span>

            <span
              className={`status-pill ${connected ? 'border-emerald/35 text-emerald-bright' : 'border-danger/40 text-danger'}`}
              title={`Socket: ${connectionStatus}`}
            >
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span className="hidden md:inline">{connectionStatus}</span>
            </span>

            <ThemeQuickToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div key={location.pathname} className="page-enter mx-auto w-full max-w-[1480px] p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Toaster />
    </div>
  );
}
