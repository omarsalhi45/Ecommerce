import { EventEmitter } from 'node:events'
import type { Order } from '@osai/shared'

const orderEvents = new EventEmitter()
orderEvents.setMaxListeners(100)

export interface OrderStatusEvent {
  readonly orderId: string
  readonly status: Order['status']
  readonly paymentStatus: Order['paymentStatus']
  readonly updatedAt: string
}

export const toOrderStatusEvent = (order: Order): OrderStatusEvent => ({
  orderId: order.id,
  status: order.status,
  paymentStatus: order.paymentStatus,
  updatedAt: new Date().toISOString(),
})

export const publishOrderStatusEvent = (order: Order) => {
  orderEvents.emit(order.id, toOrderStatusEvent(order))
}

export const subscribeToOrderStatus = (
  orderId: string,
  listener: (event: OrderStatusEvent) => void
) => {
  orderEvents.on(orderId, listener)

  return () => {
    orderEvents.off(orderId, listener)
  }
}
