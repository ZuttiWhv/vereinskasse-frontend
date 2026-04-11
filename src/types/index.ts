export interface Permission {
  id: number
  name: string
}

export interface Category {
  id: number
  name: string
  imagePath: string
}

export interface Product {
  id: number
  name: string
  anzeigename: string | null
  price: number // In Java: vk
  imagePath: string | null
  category: Category
}

export interface Sale {
  id?: number // Optional, da vom Server generiert
  price: number // Gesamtpreis
  amount: number // Menge
  product: Product // Das verknüpfte Produkt
  user: User // Der Käufer
  timestamp?: Date
}

export interface Role {
  id: number
  name: string
  permissions: Permission[]
}

export interface User {
  id: number
  username: string
  balance: number
  roles: Role[]
  isLocked: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface Category {
  id: number
  name: string
  imagePath: string
}

export interface Product {
  id: number
  name: string
  anzeigename: string | null
  price: number // in Cent
  imagePath: string | null
  category: Category
}

export interface SaleRequest {
  productId: number
  amount: number
  userId?: number // Optional, da nur Admins (WRITE_ALL_SALES) dies setzen
}

export interface UserBalance {
  userId: number
  username: string
  balanceInCents: number
}
