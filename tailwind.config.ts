import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { base: '#050914', deep: '#07111F', panel: '#0B1324' },
        brand: { 400: '#3D96FF', 500: '#1E88FF', 600: '#1473FF', 700: '#0B57CC' },
        ink: { DEFAULT: '#FFFFFF', muted: '#CBD5E1', faint: '#64748B' },
        line: '#16233C',
        success: '#22C55E', warning: '#F59E0B', danger: '#EF4444'
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,.45)',
        glow: '0 0 0 1px rgba(30,136,255,.35), 0 8px 28px -6px rgba(30,136,255,.45)'
      },
      keyframes: {
        'pulse-live': { '0%,100%': { opacity: '1' }, '50%': { opacity: '.35' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } }
      },
      animation: {
        'pulse-live': 'pulse-live 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite'
      }
    }
  }
} satisfies Config;