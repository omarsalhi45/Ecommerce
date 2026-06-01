export interface CartItem {
  readonly productId: string
  readonly quantity: number
}

export interface CartSummary {
  readonly subtotal: number
  readonly shipping: number
  readonly tax: number
  readonly total: number
}

export interface CheckoutCustomer {
  readonly email: string
  readonly firstName: string
  readonly lastName: string
  readonly phone?: string
}

export interface ShippingAddress {
  readonly line1: string
  readonly line2?: string
  readonly city: string
  readonly state?: string
  readonly postalCode: string
  readonly country: string
}

export interface CreateOrderRequest {
  readonly customer: CheckoutCustomer
  readonly shippingAddress: ShippingAddress
  readonly items: CartItem[]
}

export interface OrderItem {
  readonly productId: string
  readonly name: string
  readonly quantity: number
  readonly unitPrice: number
  readonly lineTotal: number
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled'

export type OrderPaymentStatus = 'mock_paid' | 'payment_required' | 'paid' | 'payment_failed'

export interface Order {
  readonly id: string
  readonly status: OrderStatus
  readonly paymentStatus: OrderPaymentStatus
  readonly customer: CheckoutCustomer
  readonly shippingAddress: ShippingAddress
  readonly items: OrderItem[]
  readonly totals: CartSummary
  readonly userId?: string
  readonly createdAt: string
}

export interface OrderListResponse {
  readonly orders: Order[]
}

export interface CheckoutPaymentIntent {
  readonly id: string
  readonly clientSecret: string
  readonly amount: number
  readonly currency: string
  readonly publishableKey?: string
}

export interface CreateCheckoutPaymentIntentResponse {
  readonly order: Order
  readonly paymentIntent: CheckoutPaymentIntent
}
