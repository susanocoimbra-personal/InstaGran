import type { Config } from 'tailwindcss';

// InstaGran — "Editorial" design system.
// A printed family photo-book: white gallery walls, near-black ink, one warm
// accent used sparingly. The photographs are the colour; the UI is quiet.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces — gallery white + a faintly warm paper for insets.
        paper: '#FFFFFF',
        'paper-dim': '#F6F4F1', // image placeholders, subtle insets
        // Ink ramp — warm near-black through to soft grey. Never pure #000.
        ink: {
          DEFAULT: '#191614', // primary text / wordmark
          soft: '#4A443F', // body
          muted: '#8A827B', // metadata, labels (passes AA on white at 14px+)
          faint: '#B8B0A8', // hairlines-as-text, disabled
        },
        line: '#E7E2DB', // rules and dividers
        // One accent — a deep terracotta-clay, used only for the active state
        // and primary action. Rare by design.
        clay: {
          DEFAULT: '#9C4A2F',
          soft: '#C2785C',
        },
        danger: '#A23B2D',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.18em', // exhibition-label caps
        wordmark: '-0.02em',
      },
      boxShadow: {
        // Photographs sit like prints on a wall: a tight contact shadow plus a
        // soft cast shadow. Nothing else gets elevation.
        print: '0 1px 1px rgba(25,22,20,0.04), 0 18px 32px -16px rgba(25,22,20,0.22)',
        lift: '0 12px 40px -12px rgba(25,22,20,0.28)',
      },
      keyframes: {
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-7px)' },
          '75%': { transform: 'translateX(7px)' },
        },
      },
      animation: {
        // Confident exponential ease-out, no bounce.
        'rise-in': 'rise-in 0.7s cubic-bezier(0.16,1,0.3,1) both',
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};

export default config;
