import type { Config } from 'tailwindcss';

// GODDYS brand tokens.
// Palette: near-black ground, bone foreground, a single hazard-yellow
// accent used sparingly (stamps, tags, status) — kept away from the
// generic "near-black + acid-green/vermilion" pairing.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0C',        // primary background
        bone: '#EDEAE3',       // primary foreground / paper
        concrete: '#8A8A85',   // muted text, dividers
        panel: '#141415',      // raised surfaces in dark UI (admin)
        hazard: '#F2C744',     // single accent: tags, stamps, alerts
        danger: '#C1462F',     // errors only — not a decorative color
      },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Black', 'sans-serif'],
        body: ['var(--font-body)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        wide: '0.14em',
        widest: '0.28em',
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
      },
      keyframes: {
        'sweep-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0%)' },
        },
        'sweep-out': {
          from: { transform: 'translateX(0%)' },
          to: { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'sweep-in': 'sweep-in 0.5s cubic-bezier(0.76,0,0.24,1) forwards',
        'sweep-out': 'sweep-out 0.5s cubic-bezier(0.76,0,0.24,1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
