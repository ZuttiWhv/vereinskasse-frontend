import type { Config } from 'tailwindcss'

export default {
  // Stelle sicher, dass diese Pfade exakt so stimmen:
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
