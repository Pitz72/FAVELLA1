/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Basi profonde (navy-teal del brand)
        'favella-void': '#03060d',
        'favella-dark': '#050a14',
        'favella-panel': '#0b1726',
        'favella-surface': '#0f2032',
        'favella-brace': '#1e3a52',
        // Accenti del logo: ciano (alone) → smeraldo (foglie) → ambra (fiamma)
        'favella-cyan': '#22d3ee',
        'favella-cyan-bright': '#5cf3ff',
        'favella-cyan-dark': '#0e7490',
        'favella-emerald': '#34d399',
        'favella-teal': '#2dd4bf',
        'favella-amber': '#f59e0b',
        'favella-flame': '#fb923c',
        // Testo
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
        'glow-cyan-sm': '0 0 18px -4px rgba(34, 211, 238, 0.35)',
        'glow-emerald': '0 0 40px -8px rgba(52, 211, 153, 0.4)',
        'glow-amber': '0 0 32px -6px rgba(245, 158, 11, 0.5)',
        'glow-card': '0 24px 60px -20px rgba(0, 0, 0, 0.7)',
        'inset-line': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(110deg, #22d3ee 0%, #2dd4bf 40%, #34d399 70%, #f59e0b 110%)',
        'cyan-emerald': 'linear-gradient(120deg, #22d3ee, #34d399)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'flame-flicker': {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ring-pulse': {
          '0%': { transform: 'scale(0.9)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'caret-blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'float': 'float 7s ease-in-out infinite',
        'flame-flicker': 'flame-flicker 2.4s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        'fade-up': 'fade-up 0.7s ease-out both',
        'ring-pulse': 'ring-pulse 2.8s ease-out infinite',
        'caret-blink': 'caret-blink 1s step-end infinite',
        'marquee': 'marquee 30s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
