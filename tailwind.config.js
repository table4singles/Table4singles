/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f4',
          100: '#fde6ea',
          200: '#fbd0da',
          300: '#f8aabb',
          400: '#f27a96',
          500: '#e94560',
          600: '#d6284d',
          700: '#b41d3f',
          800: '#961b3a',
          900: '#801b37',
          950: '#470a19',
        },
        // Warm neutral (Tailwind "stone") in place of the default cool gray —
        // ties the whole app to the coral/sunset palette instead of a generic blue-gray.
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
        // Metallic gold accent — used on dark, glamorous marketing sections (landings).
        gold: {
          50: '#fdf8ec',
          100: '#f8ecc7',
          200: '#f0d98a',
          300: '#e8c766',
          400: '#d4af37',
          500: '#c9a227',
          600: '#a6841f',
          700: '#8a6d1a',
          800: '#6b5414',
          900: '#4a3a0e',
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
        'glow-coral': '0 4px 14px -2px rgba(233,69,96,0.4)',
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
