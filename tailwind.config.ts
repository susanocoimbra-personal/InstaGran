import type { Config } from 'tailwindcss';

// Vovo Design System — Warm, Modern, Premium
// A family photo-sharing experience that feels like a sunlit living room.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Soft Terracotta Rose
        primary: {
          DEFAULT: '#C4816B',
          light: '#D9A899',
          dark: '#A66853',
        },
        secondary: '#8FA68E',
        // Warm off-white backgrounds
        background: '#FAF7F4',
        surface: '#FFFFFF',
        'surface-alt': '#F3EDE7',
        // Warm charcoal text
        ink: {
          DEFAULT: '#3B3235',
          secondary: '#7A6E72',
          light: '#B5AAAE',
        },
        line: '#EDE6E0',
        danger: '#D4605A',
        success: '#6BA588',
        accent: {
          DEFAULT: '#D4A95A',
          light: '#EDD4A0',
        },
      },
      borderRadius: {
        xl: '24px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(59,50,53,0.06)',
        card: '0 4px 12px rgba(59,50,53,0.08)',
        lift: '0 8px 24px rgba(59,50,53,0.12)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        // Reaction tap: a quick, warm pop. No bounce/elastic — confident ease-out.
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.28)' },
          '100%': { transform: 'scale(1)' },
        },
        // Empty-state icon: gentle breathing float, calm not busy.
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        // Card entrance — exponential ease-out, settles confidently.
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        shake: 'shake 0.4s ease-in-out',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        pop: 'pop 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        float: 'float 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
