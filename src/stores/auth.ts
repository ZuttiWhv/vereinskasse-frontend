import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type { LoginResponse } from '@/types'
import axios from 'axios'

interface UserProfile {
  id: number
  username: string
  balance: number
  pinEnabled: boolean
  roles: string[]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    user: JSON.parse(localStorage.getItem('user') || 'null') as UserProfile | null,
    authorities: JSON.parse(localStorage.getItem('authorities') || '[]') as string[],
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    // Prüft, ob der User eine oder mehrere Berechtigungen hat
    hasAuthority: (state) => (required: string | string[]) => {
      if (!state.authorities) return false
      if (Array.isArray(required)) {
        return required.some((auth) => state.authorities.includes(auth))
      }
      return state.authorities.includes(required)
    },
    userBalance: (state) => state.user?.balance || 0,
  },

  actions: {
    async login(credentials: { username: string; password: string }) {
      try {
        const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials)

        // 1. Token im State und LocalStorage setzen
        this.setTokens(data)

        // 2. WICHTIG: Den Header für den API-Client sofort setzen,
        // damit fetchProfile autorisiert ist!
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`

        // 3. Profil laden (beinhaltet Authorities)
        await this.fetchProfile()

        return true // Login erfolgreich
      } catch (error) {
        console.error('Login fehlgeschlagen:', error)
        throw error // Fehler an die LoginView weitergeben
      } finally {
        this.isLoading = false // Beenden (egal ob Erfolg oder Fehler)
      }
    },

    // Der Router sucht nach dieser Methode beim Page-Refresh
    async fetchAuthorities() {
      if (this.isAuthenticated) {
        await this.fetchProfile()
      }
    },

    async fetchProfile() {
      if (!this.accessToken) return

      try {
        const { data } = await apiClient.get('/api/users/me')

        // Wir speichern die Authorities und das User-Objekt getrennt
        this.authorities = data.authorities || []
        this.user = {
          id: data.id,
          username: data.username,
          balance: data.balance,
          pinEnabled: data.pinEnabled,
          roles: data.roles || [],
        }

        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('authorities', JSON.stringify(this.authorities))
      } catch (error) {
        console.error('Profil-Ladefehler:', error)
        // Falls der Token abgelaufen ist, hier ausloggen
        if ((error as any).response?.status === 401) {
          this.logout()
        }
      }
    },

    setTokens(data: LoginResponse) {
      this.accessToken = data.accessToken
      this.refreshToken = data.refreshToken
      localStorage.setItem('access_token', data.accessToken)
      localStorage.setItem('refresh_token', data.refreshToken)
    },

    logout() {
      this.accessToken = null
      this.refreshToken = null
      this.authorities = []
      this.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('authorities')
      // Wir verzichten hier auf window.location.href, damit der Router den Redirect steuert
    },
    async refreshTokens(): Promise<string> {
      if (!this.refreshToken) {
        throw new Error('Kein Refresh-Token vorhanden')
      }

      try {
        // Achtung: Hier nutzen wir axios direkt statt apiClient,
        // um Endlosschleifen bei 401 zu vermeiden!
        const { data } = await axios.post<LoginResponse>('/auth/refresh', {
          refreshToken: this.refreshToken,
        })

        // Neue Tokens speichern (setTokens hast du ja schon im Store)
        this.setTokens(data)

        // Auch den Header für zukünftige Anfragen im apiClient aktualisieren
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`

        return data.accessToken
      } catch (error) {
        console.error('Refresh fehlgeschlagen:', error)
        throw error
      }
    },
  },
})
