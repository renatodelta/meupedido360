import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0b2545',
          'navy-dark': '#061325',
          'navy-light': '#133a6b',
          orange: '#f97316',
          'orange-hover': '#ea580c',
          'orange-light': '#fed7aa',
          cyan: '#0284c7',
          'cyan-light': '#38bdf8',
        },
        // Map dynamic inline style variables injected from layout
        primary: {
          DEFAULT: 'var(--primary-color, #f97316)',
          hover: 'color-mix(in srgb, var(--primary-color, #f97316) 85%, black)',
          light: 'color-mix(in srgb, var(--primary-color, #f97316) 10%, white)',
        },
        secondary: {
          DEFAULT: 'var(--secondary-color, #0b2545)',
          hover: 'color-mix(in srgb, var(--secondary-color, #0b2545) 85%, black)',
        },
        customBg: 'var(--background-color, #061325)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Outfit', 'Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        'brand-glow': 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(2, 132, 199, 0.1) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
