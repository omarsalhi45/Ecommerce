import type { Request, Response } from 'express'
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
