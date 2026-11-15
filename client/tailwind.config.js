/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#071A16',
        surface: '#0D2620',
        elevated: '#12352B',
        ink: '#F0FDF4',
        muted: '#A7C4B8',
        line: '#285344',
        emerald: {
          DEFAULT: '#10B981',
          deep: '#047857',
          bright: '#34D399',
        },
        warn: '#FBBF24',
        danger: '#FB7185',
        info: '#60A5FA',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(16, 185, 129, 0.08)',
      },
    },
  },
  plugins: [],
};
