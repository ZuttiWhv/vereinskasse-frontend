import { fileURLToPath, URL } from 'node:url'
import { defineConfig, UserConfig } from 'vite' // UserConfig hinzufügen
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command, mode }): UserConfig => {
  // Typ hier setzen
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // Wir casten das Objekt als 'any' oder definieren es präzise,
      // damit TS bei der leeren Version {} nicht meckert
      proxy:
        command === 'serve'
          ? {
              '/auth': {
                target: 'https://localhost:8080',
                changeOrigin: true,
                secure: false,
              },
              '/api': {
                target: 'https://localhost:8080',
                changeOrigin: true,
                secure: false,
              },
            }
          : undefined, // Nutze 'undefined' statt {}, das ist sauberer für Vite
    },
  }
})
