/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        royal: {
          DEFAULT: '#0A1628',
          night: '#0D0D12',
          panel: '#102A5C',
          deep: '#0C1D3E',
        },
        parchment: {
          DEFAULT: '#F5E6C8',
          dark: '#E3CC9E',
          ink: '#3A2913',
        },
        gold: {
          DEFAULT: '#D4A843',
          light: '#EBCB7A',
          dark: '#9A7628',
        },
        lumina: '#D4A843',
        doron: '#5B8DBE',
        ase: '#9B6BA3',
        kaizen: '#6AAB6E',
        cat: {
          academic: '#3FB8AF',
          participation: '#F08A4B',
          service: '#E86A92',
          challenge: '#E04848',
          character: '#C3CAD9',
        },
      },
      fontFamily: {
        display: ['var(--font-cinzel-decorative)', 'Georgia', 'serif'],
        heading: ['var(--font-cinzel)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      keyframes: {
        'rise-fade': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.9)' },
          '15%': { opacity: '1', transform: 'translateY(0) scale(1.05)' },
          '70%': { opacity: '1', transform: 'translateY(-28px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-56px) scale(0.95)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--glow, rgba(212,168,67,0))' },
          '40%': { boxShadow: '0 0 36px 6px var(--glow, rgba(212,168,67,0.5))' },
        },
        'slow-spin': { to: { transform: 'rotate(360deg)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '60%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-0.6deg)' },
          '50%': { transform: 'rotate(0.6deg)' },
        },
        'live-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'rise-fade': 'rise-fade 1.8s ease-out forwards',
        'glow-pulse': 'glow-pulse 1.6s ease-out',
        'slow-spin': 'slow-spin 18s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out both',
        'fade-up': 'fade-up 0.45s ease-out both',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
        shimmer: 'shimmer 3s linear infinite',
        sway: 'sway 6s ease-in-out infinite',
        'live-dot': 'live-dot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
