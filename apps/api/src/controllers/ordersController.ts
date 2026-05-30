import type { Request, Response } from 'express'
import { subscribeToOrderStatus, toOrderStatusEvent } from '../services/orderEventsService'
import { createOrder, getOrderById, getOrderList } from '../services/orderService'
import { createCheckoutPaymentIntent } from '../services/paymentService'
import { validateCheckoutRequest } from '../validation/requestValidation'

export const getOrders = async (_req: Request, res: Response) => {
  const orderList = await getOrderList()
  res.json(orderList)
}

export const getOrder = async (req: Request, res: Response) => {
  const order = await getOrderById(req.params.id)

  if (!order) {
    return res.status(404).json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' })
  }

  res.json(order)
}

export const createCheckoutOrder = async (req: Request, res: Response) => {
  const payload = validateCheckoutRequest(req.body)
  const order = await createOrder({
    ...payload,
    userId: req.auth?.userId,
  })

  res.status(201).json(order)
}

export const createCheckoutPayment = async (req: Request, res: Response) => {
  const payload = validateCheckoutRequest(req.body)
  const paymentIntent = await createCheckoutPaymentIntent({
    ...payload,
    userId: req.auth?.userId,
  })

  res.status(201).json(paymentIntent)
}

export const streamOrderStatus = async (req: Request, res: Response) => {
  const order = await getOrderById(req.params.id)

  if (!order) {
    return res.status(404).json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' })
  }

  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
  })

  const writeEvent = (event: unknown) => {
    res.write('event: order-status\n')
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  writeEvent(toOrderStatusEvent(order))

  const unsubscribe = subscribeToOrderStatus(order.id, writeEvent)

  req.on('close', () => {
    unsubscribe()
    res.end()
  })
}
