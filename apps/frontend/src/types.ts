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
  compareAtPrice?: number
  imageUrl: string
  imageUrls?: string[]
  videoUrl?: string
  category: string
  isActive?: boolean
  variants?: ProductVariant[]
  popularityScore?: number
  ratingSummary?: ProductRatingSummary
}

export interface ProductVariant {
  sku: string
  size?: string
  color?: string
  stockQuantity: number
}

export interface ProductRatingSummary {
  averageRating: number
  reviewCount: number
}

export interface ProductReview {
  id: string
  productId: string
  authorName: string
  rating: number
  title: string
  body: string
  createdAt: string
}

export interface ProductReviewsResponse {
  reviews: ProductReview[]
  summary: ProductRatingSummary
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
