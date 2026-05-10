import apiClient from './client'
import type { User } from '@/types'

export const UserService = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/me')
    return response.data
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/me', data)
    return response.data
  },

  // Wir ändern Partial<User> zu einem expliziten Typen, der dem Java-Record entspricht
  async updateOwnProfile(payload: {
    newPassword: string | null
    newPin: string | null
    pinEnabled: boolean
    passwordlessLoginEnabled: boolean
    barcodeLoginEnabled: boolean
  }): Promise<User> {
    const response = await apiClient.put<User>('/api/users/me', payload)
    return response.data
  },
}
