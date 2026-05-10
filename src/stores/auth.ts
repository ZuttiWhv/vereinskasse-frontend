import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type { LoginResponse } from '@/types'
import axios from 'axios'

interface UserProfile {
  id: number
  username: string
  balance: number
  pinEnabled: boolean
  passwordlessLoginEnabled: boolean
  barcodeLoginEnabled: boolean // NEU: Ergänzt
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
    /**
     * Setzt die Tokens im State und LocalStorage
     */
    setTokens(data: LoginResponse) {
      this.accessToken = data.accessToken
      this.refreshToken = data.refreshToken
      localStorage.setItem('access_token', data.accessToken)
      localStorage.setItem('refresh_token', data.refreshToken)
    },

    /**
     * Standard Login mit Passwort
     */
    async login(credentials: { username: string; password: string }) {
      this.isLoading = true
      try {
        const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials)
        this.setTokens(data)
        // KEIN apiClient.defaults mehr! Der Interceptor übernimmt ab hier.
        await this.fetchProfile()
        return true
      } catch (error) {
        console.error('Login fehlgeschlagen:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Login via PIN
     */
    async pinLogin(credentials: { username: string; pin: string }) {
      this.isLoading = true
      try {
        const { data } = await apiClient.post<LoginResponse>('/auth/pin/login', credentials)
        this.setTokens(data)
        await this.fetchProfile()
        return true
      } catch (error) {
        console.error('PIN-Login fehlgeschlagen:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Passwortloser Login (mTLS)
     */
    async passwordlessLogin(username: string) {
      this.isLoading = true
      try {
        const { data } = await apiClient.post<LoginResponse>('/auth/passwordless/passwordless', {
          username: username,
        })
        this.setTokens(data)
        await this.fetchProfile()
        return true
      } catch (error) {
        console.error('Passwortloser Login fehlgeschlagen:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Lädt das aktuelle Nutzerprofil und speichert es im State
     */
    async fetchProfile() {
      if (!this.accessToken) return

      try {
        const { data } = await apiClient.get('/api/users/me')

        this.authorities = data.authorities || []
        this.user = {
          id: data.id,
          username: data.username,
          balance: data.balance,
          pinEnabled: data.pinEnabled,
          passwordlessLoginEnabled: data.passwordlessLoginEnabled,
          barcodeLoginEnabled: data.barcodeLoginEnabled || false, // Mapping korrigiert
          roles: data.roles || [],
        }

        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('authorities', JSON.stringify(this.authorities))
      } catch (error) {
        console.error('Profil-Ladefehler:', error)
        if ((error as any).response?.status === 401) {
          this.logout()
        }
      }
    },

    /**
     * Löscht alle Session-Daten
     */
    logout() {
      this.accessToken = null
      this.refreshToken = null
      this.authorities = []
      this.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('authorities')

      // Optional: Seite neu laden, um alle Axios-Instanz-Reste zu killen
      // window.location.href = '/login'
    },

    /**
     * Erneuert die Tokens mittels Refresh-Token
     */
    async refreshTokens(): Promise<string> {
      if (!this.refreshToken) {
        throw new Error('Kein Refresh-Token vorhanden')
      }

      try {
        // Hier nutzen wir direkt axios, um Interceptor-Schleifen zu vermeiden
        const { data } = await axios.post<LoginResponse>('/auth/refresh', {
          refreshToken: this.refreshToken,
        })

        this.setTokens(data)
        return data.accessToken
      } catch (error) {
        console.error('Refresh fehlgeschlagen:', error)
        this.logout()
        throw error
      }
    },
  },
})
