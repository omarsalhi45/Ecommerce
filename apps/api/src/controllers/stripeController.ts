import type { Request, Response } from 'express'
import { constructStripeWebhookEvent, processStripeWebhookEvent } from '../services/paymentService'

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const event = constructStripeWebhookEvent(
    req.body as Buffer,
    req.header('stripe-signature') ?? undefined
  )

  await processStripeWebhookEvent(event)

  res.json({ received: true })
}
