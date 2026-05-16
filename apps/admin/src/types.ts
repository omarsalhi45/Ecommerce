export type {
  CartItem,
  CartSummary,
  CheckoutCustomer,
  CheckoutPaymentIntent,
  CreateCheckoutPaymentIntentResponse,
  CreateOrderRequest,
  Order,
  OrderItem,
  OrderListResponse,
  OrderPaymentStatus,
  OrderStatus,
  ShippingAddress,
} from '@osai/shared'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
}

export type UserRole = 'customer' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: User
}

export interface InventoryItem {
  product: Product
  sku: string
  size?: string
  color?: string
  stockQuantity: number
  lowStockThreshold: number
}

export interface AdminAnalytics {
  orderCount: number
  revenue: number
  pendingCount: number
}
