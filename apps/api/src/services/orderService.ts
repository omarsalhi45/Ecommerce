import type {
  AppliedDiscount,
  CartSummary,
  CreateOrderRequest,
  Order,
  OrderItem,
  OrderListResponse,
  OrderPaymentStatus,
  OrderStatus,
} from '@osai/shared'
import { isDatabaseConfigured } from '../db'
import { ApiError } from '../middleware/errorMiddleware'
import {
  getOrderAnalyticsFromDb,
  getOrderFromDb,
  insertOrderIntoDb,
  listOrdersFromDb,
  updateOrderPaymentStatusInDb,
  updateOrderStatusInDb,
} from '../repositories/orderRepository'
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from './emailService'
import { publishOrderStatusEvent } from './orderEventsService'
import { getProduct } from './productService'

export type { OrderStatus } from '@osai/shared'

export interface CreateOrderInput extends CreateOrderRequest {
  readonly userId?: string
  readonly paymentStatus?: OrderPaymentStatus
}

export interface OrderAnalytics {
  readonly orderCount: number
  readonly revenue: number
  readonly pendingCount: number
}

const TAX_RATE = 0.08
const SHIPPING_RATE = 7.5
const FREE_SHIPPING_THRESHOLD = 100
const orders: Order[] = []

const promoCodes: Record<
  string,
  {
    readonly label: string
    readonly percentOff: number
    readonly minimumSubtotal?: number
  }
> = {
  OSAI10: {
    label: '10% off',
    percentOff: 0.1,
  },
  WELCOME15: {
    label: '15% off orders $50+',
    percentOff: 0.15,
    minimumSubtotal: 50,
  },
}

const roundMoney = (value: number): number => Math.round(value * 100) / 100

export const isRevenueRecognizedPaymentStatus = (paymentStatus: OrderPaymentStatus): boolean => {
  return paymentStatus === 'paid' || paymentStatus === 'mock_paid'
}

export const normalizePromoCode = (promoCode: string | undefined): string | undefined => {
  const normalizedCode = promoCode?.trim().toUpperCase()
  return normalizedCode || undefined
}

export const calculateOrderDiscount = (
  subtotal: number,
  promoCode: string | undefined
): AppliedDiscount | undefined => {
  const normalizedCode = normalizePromoCode(promoCode)

  if (!normalizedCode) {
    return undefined
  }

  const promo = promoCodes[normalizedCode]

  if (!promo) {
    throw new ApiError(400, 'Promo code is not valid', 'INVALID_PROMO_CODE')
  }

  if (promo.minimumSubtotal && subtotal < promo.minimumSubtotal) {
    throw new ApiError(
      400,
      `${normalizedCode} requires a $${promo.minimumSubtotal.toFixed(2)} subtotal`,
      'PROMO_MINIMUM_NOT_MET'
    )
  }

  return {
    code: normalizedCode,
    label: promo.label,
    amount: roundMoney(subtotal * promo.percentOff),
  }
}

export const calculateOrderTotals = (subtotal: number, promoCode?: string): CartSummary => {
  const discount = calculateOrderDiscount(subtotal, promoCode)
  const discountedSubtotal = roundMoney(subtotal - (discount?.amount ?? 0))
  const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_RATE : 0
  const tax = roundMoney(discountedSubtotal * TAX_RATE)

  const totals: CartSummary = {
    subtotal: roundMoney(subtotal),
    shipping,
    tax,
    total: roundMoney(discountedSubtotal + shipping + tax),
  }

  return discount ? { ...totals, discount: discount.amount } : totals
}

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  const items: OrderItem[] = []

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
  const discount = calculateOrderDiscount(subtotal, input.promoCode)
  const order: Order = {
    id: `order_${Date.now()}_${orders.length + 1}`,
    status: 'pending',
    paymentStatus: input.paymentStatus ?? 'mock_paid',
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    items,
    totals: calculateOrderTotals(subtotal, input.promoCode),
    discount,
    userId: input.userId,
    createdAt: new Date().toISOString(),
  }

  if (isDatabaseConfigured) {
    const persistedOrder = await insertOrderIntoDb(order)
    await sendOrderConfirmationEmail(persistedOrder)
    publishOrderStatusEvent(persistedOrder)
    return persistedOrder
  }

  orders.push(order)
  await sendOrderConfirmationEmail(order)
  publishOrderStatusEvent(order)

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
    const order = await updateOrderStatusInDb(orderId, status)

    if (order) {
      await sendOrderStatusEmail(order)
      publishOrderStatusEvent(order)
    }

    return order
  }

  const order = orders.find((candidate) => candidate.id === orderId)

  if (!order) {
    return undefined
  }

  Object.assign(order, { status })
  await sendOrderStatusEmail(order)
  publishOrderStatusEvent(order)

  return order
}

export const updateOrderPaymentStatus = async (
  orderId: string,
  paymentStatus: OrderPaymentStatus
): Promise<Order | undefined> => {
  if (isDatabaseConfigured) {
    const order = await updateOrderPaymentStatusInDb(orderId, paymentStatus)

    if (order) {
      publishOrderStatusEvent(order)
    }

    return order
  }

  const order = orders.find((candidate) => candidate.id === orderId)

  if (!order) {
    return undefined
  }

  Object.assign(order, { paymentStatus })
  publishOrderStatusEvent(order)

  return order
}

export const getOrderAnalytics = async (): Promise<OrderAnalytics> => {
  if (isDatabaseConfigured) {
    return getOrderAnalyticsFromDb()
  }

  return {
    orderCount: orders.length,
    revenue: orders
      .filter((order) => isRevenueRecognizedPaymentStatus(order.paymentStatus))
      .reduce((total, order) => total + order.totals.total, 0),
    pendingCount: orders.filter((order) => order.status === 'pending').length,
  }
}

export const resetOrderStoreForTests = () => {
  orders.splice(0, orders.length)
}
