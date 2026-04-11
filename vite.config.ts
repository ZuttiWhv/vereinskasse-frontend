import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Leitet alle Anfragen, die mit /auth beginnen, weiter
      '/auth': {
        target: 'http://localhost:8080', // Hier die URL deines Backends eintragen
        changeOrigin: true,
        secure: false,
      },
      // Leitet alle Anfragen, die mit /api beginnen, weiter
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
