/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep jewel teal — from the 2026-09 logo (two figures at a table under a
        // gold/teal arc). Replaces the old coral as the app's one primary accent.
        primary: {
          50: '#eefbfa',
          100: '#d1f5f2',
          200: '#a3ebe5',
          300: '#6ddbd3',
          400: '#3abfb7',
          500: '#129a93',
          600: '#0b7f79',
          700: '#0a6561',
          800: '#0d504d',
          900: '#0e423f',
          950: '#052624',
        },
        // Warm neutral (Tailwind "stone") for light content pages — kept independent
        // of the new navy so interior pages stay warm and legible, matching the
        // landings only where they deliberately go dark (see `navy`).
        gray: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Cool near-black navy — the logo's background. Used on dark, glamorous
        // marketing sections (landings, navbar chrome) in place of plain gray-950.
        navy: {
          50: '#f1f6f8',
          100: '#dbe7ec',
          200: '#b3ccd6',
          300: '#82a8b8',
          400: '#547f91',
          500: '#385f70',
          600: '#294856',
          700: '#1c3540',
          800: '#12242c',
          900: '#0a161b',
          950: '#030a0d',
        },
        // Metallic gold accent — from the logo's rim/number-4 highlight.
        gold: {
          50: '#fdf8ec',
          100: '#f8ecc9',
          200: '#f0da97',
          300: '#e8c86a',
          400: '#e0b451',
          500: '#cf9c34',
          600: '#ab7f26',
          700: '#8a651e',
          800: '#6b4e17',
          900: '#4a3610',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        e1: '0 1px 2px rgba(28,25,23,0.07)',
        e2: '0 1px 2px rgba(28,25,23,0.04), 0 6px 16px -4px rgba(28,25,23,0.12)',
        e3: '0 2px 4px rgba(28,25,23,0.06), 0 16px 32px -8px rgba(28,25,23,0.18)',
        e4: '0 4px 8px rgba(28,25,23,0.08), 0 32px 64px -16px rgba(28,25,23,0.30)',
        'glow-teal': '0 4px 14px -2px rgba(11,127,121,0.4)',
        'glow-indigo': '0 4px 14px -2px rgba(79,70,229,0.4)',
        'glow-gold': '0 4px 20px -2px rgba(212,175,55,0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
