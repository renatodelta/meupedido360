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
        // Map dynamic inline style variables injected from layout
        primary: {
          DEFAULT: 'var(--primary-color)',
          hover: 'color-mix(in srgb, var(--primary-color) 85%, black)',
          light: 'color-mix(in srgb, var(--primary-color) 10%, white)',
        },
        secondary: {
          DEFAULT: 'var(--secondary-color)',
          hover: 'color-mix(in srgb, var(--secondary-color) 85%, black)',
        },
        customBg: 'var(--background-color)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
