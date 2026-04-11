import apiClient from './client'
import type { Category, Product, SaleRequest } from '@/types'

export const ShopService = {
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/api/categories')
    return response.data
  },

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/api/products', {
      params: { categoryId },
    })
    return response.data
  },

  /**
   * Erstellt einen neuen Verkauf.
   * @param productId ID des Produkts
   * @param amount Menge
   * @param targetUserId Optional: ID eines anderen Users (nur für Admins)
   */
  async createSale(productId: number, amount: number, targetUserId?: number): Promise<void> {
    // Das Payload-Objekt wird vorbereitet
    const payload: any = {
      productId: productId,
      amount: amount,
    }

    // Nur wenn targetUserId wirklich existiert, fügen wir das Feld hinzu.
    // Falls nicht, bleibt das Feld im JSON weg, was für unser
    // Backend (Long userId) völlig okay ist.
    if (targetUserId !== undefined && targetUserId !== null) {
      payload.userId = targetUserId
    }

    await apiClient.post('/api/sales', payload)
  },
}
