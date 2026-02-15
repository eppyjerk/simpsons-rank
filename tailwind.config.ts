import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#131a22',
        parchment: '#fdf7ec',
        accent: '#ff6f3c',
        moss: '#2f6f5e'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['"Public Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
