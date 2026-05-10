import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const apiClient = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore()

  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }

  return config
})

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    // 👉 Falls kein originalRequest vorhanden ist → einfach Fehler weitergeben
    if (!originalRequest) {
      return Promise.reject(error)
    }

    // 👉 WICHTIG: Blob/Datei-Requests NICHT über Retry-Logik laufen lassen
    if (originalRequest.responseType === 'blob') {
      return Promise.reject(error)
    }

    // Falls 401 Unauthorized und wir haben noch nicht versucht zu refreshen
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true

      try {
        // Token erneuern
        const newToken = await authStore.refreshTokens()

        // Neuen Token setzen
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        // 👉 Sicherstellen, dass responseType erhalten bleibt (für Sonderfälle)
        if (originalRequest.responseType) {
          originalRequest.responseType = originalRequest.responseType
        }

        // Request erneut ausführen
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh fehlgeschlagen → Logout + Redirect
        authStore.logout()
        globalThis.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
