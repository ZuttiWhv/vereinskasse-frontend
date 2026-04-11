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
}

