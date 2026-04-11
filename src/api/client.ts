import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    // Falls 401 Unauthorized und wir haben noch nicht versucht zu refreshen
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Versuche Token zu erneuern
        const newToken = await authStore.refreshTokens()

        // WICHTIG: Den neuen Token direkt in den Header des ursprünglichen Requests setzen
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        // Den ursprünglichen Request mit neuem Token erneut ausführen
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Wenn Refresh fehlschlägt: Logout und ab zum Login
        authStore.logout()
        // Wir nutzen hier window.location, um einen sauberen State-Schnitt zu machen
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
