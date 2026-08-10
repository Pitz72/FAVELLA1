/** @type {import('tailwindcss').Config} */
// Stesso tema di brand del sito (colori favella-*, font, ombre, animazioni):
// l'esperimento deve restare cromaticamente coerente con la galleria/banner.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'favella-void': '#03060d',
        'favella-dark': '#050a14',
        'favella-panel': '#0b1726',
        'favella-surface': '#0f2032',
        'favella-brace': '#1e3a52',
        'favella-cyan': '#22d3ee',
        'favella-cyan-bright': '#5cf3ff',
        'favella-cyan-dark': '#0e7490',
        'favella-emerald': '#34d399',
        'favella-teal': '#2dd4bf',
        'favella-amber': '#f59e0b',
        'favella-flame': '#fb923c',
        'favella-text-primary': '#e8f0f8',
        'favella-text-secondary': '#9fb4c9',
        'favella-text-muted': '#5a728a',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        mono: ['"Source Code Pro"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 40px -8px rgba(34, 211, 238, 0.45)',
        'glow-amber': '0 0 32px -6px rgba(245, 158, 11, 0.5)',
        'glow-card': '0 24px 60px -20px rgba(0, 0, 0, 0.7)',
        'inset-line': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(110deg, #22d3ee 0%, #2dd4bf 40%, #34d399 70%, #f59e0b 110%)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'caret-blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'float': 'float 7s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'caret-blink': 'caret-blink 1s step-end infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
