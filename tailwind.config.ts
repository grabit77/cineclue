import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          bg: '#0b0d14',
          surface: '#141827',
          surfacelight: '#1c2233',
          accent: '#e50914', // rosso cinema
          gold: '#f5c518',
          line: '#2a3147'
        }
      },
      fontFamily: {
        display: ["'Playfair Display'", 'Georgia', 'Cambria', 'serif'],
        body: ["'Inter'", '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(0,0,0,0.7)',
        glow: '0 0 24px -6px rgba(229,9,20,0.55)'
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.86)', opacity: '0' },
          '60%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'row-in': {
          '0%': { transform: 'translateY(-14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' }
        },
        'fade-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        pop: 'pop 0.28s ease-out',
        'row-in': 'row-in 0.35s ease-out both',
        shake: 'shake 0.5s ease-in-out',
        'fade-up': 'fade-up 0.3s ease-out both'
      }
    }
  },
  plugins: []
};

export default config;