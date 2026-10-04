import type { Config } from 'tailwindcss';

// GODDYS brand tokens.
// Palette: near-black ground, bone foreground, a single hazard-yellow
// accent used sparingly (stamps, tags, status) — kept away from the
// generic "near-black + acid-green/vermilion" pairing.
//
// Colors are driven by CSS variables (see globals.css) rather than fixed
// hex so the storefront can offer a light mode: the admin panel never
// sets a `data-theme` attribute, so it always resolves the dark values -
// these tokens aren't "a color", they're "a role" (background, raised
// surface, accent) that light mode remaps. The rgb()/<alpha-value>
// pattern is required for Tailwind's opacity modifiers (bg-ink/70, etc)
// to keep working against a CSS variable.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',        // primary background
        bone: 'rgb(var(--color-bone) / <alpha-value>)',       // primary foreground / paper
        concrete: 'rgb(var(--color-concrete) / <alpha-value>)', // muted text, dividers
        panel: 'rgb(var(--color-panel) / <alpha-value>)',      // raised surfaces
        hazard: 'rgb(var(--color-hazard) / <alpha-value>)',    // single accent: tags, stamps, alerts
        danger: 'rgb(var(--color-danger) / <alpha-value>)',    // errors only — not a decorative color
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
