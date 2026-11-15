/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // surfaces
        canvas: v('canvas'),
        surface: v('surface'),
        elevated: v('elevated'),
        raised: v('raised'),
        line: v('line'),
        'line-strong': v('line-strong'),
        // text
        ink: v('ink'),
        muted: v('muted'),
        faint: v('faint'),
        // brand + data colours (theme-aware)
        emerald: {
          DEFAULT: v('brand'),
          bright: v('brand-bright'),
          deep: v('brand-deep'),
        },
        accent: v('accent'),
        violet: v('violet'),
        warn: v('warn'),
        danger: v('danger'),
        info: v('info'),
        'on-brand': v('on-brand'),
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk Variable"', '"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        float: 'var(--shadow-float)',
        glow: '0 0 0 1px rgb(var(--c-brand) / 0.5), 0 8px 28px -6px rgb(var(--c-brand) / 0.45)',
      },
      keyframes: {
        'enter': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pop': {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'ping-soft': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(2.6)', opacity: '0' },
        },
        'travel': {
          '0%': { offsetDistance: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { offsetDistance: '100%', opacity: '0' },
        },
        'drift': {
          '0%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(2%, -3%, 0)' },
          '100%': { transform: 'translate3d(0,0,0)' },
        },
      },
      animation: {
        enter: 'enter 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        fade: 'fade 240ms ease-out both',
        pop: 'pop 160ms cubic-bezier(0.16, 1, 0.3, 1) both',
        toast: 'toast 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        'ping-soft': 'ping-soft 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        drift: 'drift 22s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
