import { useEffect } from 'react';
import { create } from 'zustand';

const KEY = 'dcp-theme';

function readStored() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolve(pref) {
  return pref === 'system' ? systemTheme() : pref;
}

function apply(resolved) {
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
}

export const useTheme = create((set, get) => {
  const pref = typeof window === 'undefined' ? 'system' : readStored();
  return {
    pref, // 'system' | 'light' | 'dark'
    resolved: typeof window === 'undefined' ? 'dark' : resolve(pref),
    setPref: (next) => {
      try { localStorage.setItem(KEY, next); } catch { /* storage unavailable */ }
      const resolved = resolve(next);
      apply(resolved);
      set({ pref: next, resolved });
    },
    toggle: () => get().setPref(get().resolved === 'dark' ? 'light' : 'dark'),
    _sync: () => {
      const resolved = resolve(get().pref);
      apply(resolved);
      set({ resolved });
    },
  };
});

/** Mount once near the root: applies the theme and follows OS changes in "system" mode. */
export function useThemeBootstrap() {
  const sync = useTheme((s) => s._sync);
  useEffect(() => {
    sync();
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, [sync]);
}

const CHART = {
  dark: {
    grid: 'rgba(148,163,184,0.14)',
    axis: '#8e9db6',
    text: '#eaf1fb',
    tooltipBg: '#0b111d',
    tooltipBorder: '#304060',
    brand: '#34d399',
    brandSolid: '#10b981',
    accent: '#22d3ee',
    info: '#60a5fa',
    violet: '#a78bfa',
    warn: '#fbbf24',
    danger: '#fb7185',
    nodeBg: '#111929',
  },
  light: {
    grid: 'rgba(71,85,120,0.16)',
    axis: '#52627c',
    text: '#0b1324',
    tooltipBg: '#ffffff',
    tooltipBorder: '#c4d0e2',
    brand: '#059669',
    brandSolid: '#059669',
    accent: '#0891b2',
    info: '#2563eb',
    violet: '#6d4cdc',
    warn: '#b47000',
    danger: '#d6284a',
    nodeBg: '#ffffff',
  },
};

/** Hex colours for libraries that can't read CSS variables (Recharts, SVG, three.js, React Flow). */
export function useChartColors() {
  const resolved = useTheme((s) => s.resolved);
  const c = CHART[resolved];
  return {
    ...c,
    resolved,
    tooltip: {
      background: c.tooltipBg,
      border: `1px solid ${c.tooltipBorder}`,
      borderRadius: 10,
      color: c.text,
      fontSize: 12,
      fontFamily: '"JetBrains Mono Variable", monospace',
      boxShadow: '0 12px 32px -12px rgba(0,0,0,0.5)',
    },
  };
}
