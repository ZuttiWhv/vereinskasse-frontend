import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type { LoginResponse } from '@/types'
import axios from 'axios'

interface UserProfile {
  id: number
  username: string
  balance: number
  pinEnabled: boolean
  passwordlessLoginEnabled: boolean // NEU: Damit das Profil vollständig ist
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
     * Standard Login mit Passwort
     */
    async login(credentials: { username: string; password: string }) {
      this.isLoading = true
      try {
        const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials)
        this.setTokens(data)
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
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
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
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
     * NEU: Passwortloser Login (mTLS)
     * Wird von der LoginView aufgerufen, wenn mTLS verfügbar ist.
     */
    async passwordlessLogin(username: string) {
      this.isLoading = true
      try {
        // Entspricht dem Endpunkt in deinem PasswordlessAuthController
        const { data } = await apiClient.post<LoginResponse>('/auth/passwordless/passwordless', {
          username: username,
        })

        this.setTokens(data)
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
        await this.fetchProfile()
        return true
      } catch (error) {
        console.error('Passwortloser Login fehlgeschlagen:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchAuthorities() {
      if (this.isAuthenticated) {
        await this.fetchProfile()
      }
    },

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
          passwordlessLoginEnabled: data.passwordlessLoginEnabled, // NEU: Mapping ergänzt
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
    },

    async refreshTokens(): Promise<string> {
      if (!this.refreshToken) {
        throw new Error('Kein Refresh-Token vorhanden')
      }

      try {
        const { data } = await axios.post<LoginResponse>('/auth/refresh', {
          refreshToken: this.refreshToken,
        })

        this.setTokens(data)
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
        return data.accessToken
      } catch (error) {
        console.error('Refresh fehlgeschlagen:', error)
        this.logout() // Wichtig: Bei gescheitertem Refresh ausloggen
        throw error
      }
    },
  },
})
