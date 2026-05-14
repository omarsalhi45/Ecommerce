export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
}

export interface CartItem {
  productId: string
  quantity: number
}

export interface CartSummary {
  subtotal: number
  shipping: number
  tax: number
  total: number
}

export interface CheckoutCustomer {
  email: string
  firstName: string
  lastName: string
  phone?: string
}

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface CreateOrderRequest {
  customer: CheckoutCustomer
  shippingAddress: ShippingAddress
  items: CartItem[]
}

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: string
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'mock_paid'
  customer: CheckoutCustomer
  shippingAddress: ShippingAddress
  items: OrderItem[]
  totals: CartSummary
  userId?: string
  createdAt: string
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
