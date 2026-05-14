import { isDatabaseConfigured } from '../db'
import { ApiError } from '../middleware/errorMiddleware'
import {
  getOrderAnalyticsFromDb,
  getOrderFromDb,
  insertOrderIntoDb,
  listOrdersFromDb,
  updateOrderStatusInDb,
} from '../repositories/orderRepository'
import { getProduct } from './productService'

export interface OrderLineItemInput {
  readonly productId: string
  readonly quantity: number
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
  readonly state: string
  readonly postalCode: string
  readonly country: string
}

export interface CreateOrderInput {
  readonly customer: CheckoutCustomer
  readonly shippingAddress: ShippingAddress
  readonly items: OrderLineItemInput[]
  readonly userId?: string
}

export interface OrderItemSnapshot {
  readonly productId: string
  readonly name: string
  readonly quantity: number
  readonly unitPrice: number
  readonly lineTotal: number
}

export interface OrderTotals {
  readonly subtotal: number
  readonly shipping: number
  readonly tax: number
  readonly total: number
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  readonly id: string
  readonly status: OrderStatus
  readonly paymentStatus: 'mock_paid'
  readonly customer: CheckoutCustomer
  readonly shippingAddress: ShippingAddress
  readonly items: OrderItemSnapshot[]
  readonly totals: OrderTotals
  readonly userId?: string
  readonly createdAt: string
}

export interface OrderListResponse {
  readonly orders: Order[]
}

export interface OrderAnalytics {
  readonly orderCount: number
  readonly revenue: number
  readonly pendingCount: number
}

const TAX_RATE = 0.08
const SHIPPING_RATE = 7.5
const orders: Order[] = []

const roundMoney = (value: number): number => Math.round(value * 100) / 100

export const calculateOrderTotals = (subtotal: number): OrderTotals => {
  const shipping = subtotal > 0 ? SHIPPING_RATE : 0
  const tax = roundMoney(subtotal * TAX_RATE)

  return {
    subtotal: roundMoney(subtotal),
    shipping,
    tax,
    total: roundMoney(subtotal + shipping + tax),
  }
}

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  const items: OrderItemSnapshot[] = []

  for (const item of input.items) {
    const product = await getProduct(item.productId)

    if (!product) {
      throw new ApiError(400, `Product not found: ${item.productId}`, 'INVALID_PRODUCT')
    }

    const lineTotal = roundMoney(product.price * item.quantity)
    items.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal,
    })
  }

  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0)
  const order: Order = {
    id: `order_${Date.now()}_${orders.length + 1}`,
    status: 'pending',
    paymentStatus: 'mock_paid',
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    items,
    totals: calculateOrderTotals(subtotal),
    userId: input.userId,
    createdAt: new Date().toISOString(),
  }

  if (isDatabaseConfigured) {
    return insertOrderIntoDb(order)
  }

  orders.push(order)

  return order
}

export const getOrderList = async (): Promise<OrderListResponse> => {
  if (isDatabaseConfigured) {
    return {
      orders: await listOrdersFromDb(),
    }
  }

  return {
    orders,
  }
}

export const getOrderById = async (orderId: string): Promise<Order | undefined> => {
  if (isDatabaseConfigured) {
    return getOrderFromDb(orderId)
  }

  return orders.find((order) => order.id === orderId)
}

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<Order | undefined> => {
  if (isDatabaseConfigured) {
    return updateOrderStatusInDb(orderId, status)
  }

  const order = orders.find((candidate) => candidate.id === orderId)

  if (!order) {
    return undefined
  }

  Object.assign(order, { status })

  return order
}

export const getOrderAnalytics = async (): Promise<OrderAnalytics> => {
  if (isDatabaseConfigured) {
    return getOrderAnalyticsFromDb()
  }

  return {
    orderCount: orders.length,
    revenue: orders.reduce((total, order) => total + order.totals.total, 0),
    pendingCount: orders.filter((order) => order.status === 'pending').length,
  }
}

export const resetOrderStoreForTests = () => {
  orders.splice(0, orders.length)
}
