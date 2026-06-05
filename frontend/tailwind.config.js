/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dcs: {
          bg: 'var(--dcs-bg)',
          surface: 'var(--dcs-surface)',
          border: 'var(--dcs-border)',
          accent: 'var(--dcs-accent)',
          accentHover: 'var(--dcs-accent-hover)',
          text: 'var(--dcs-text)',
          muted: 'var(--dcs-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
