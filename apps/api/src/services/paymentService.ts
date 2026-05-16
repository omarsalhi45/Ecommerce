import type {
  CreateCheckoutPaymentIntentResponse,
  CreateOrderRequest,
  OrderPaymentStatus,
} from '@osai/shared'
import Stripe from 'stripe'
import { apiConfig } from '../config'
import { ApiError } from '../middleware/errorMiddleware'
import { createOrder, updateOrderPaymentStatus } from './orderService'

const STRIPE_API_VERSION = '2022-11-15'
const STRIPE_CURRENCY = 'usd'

interface StripePaymentIntentCreator {
  readonly paymentIntents: {
    readonly create: (
      params: Stripe.PaymentIntentCreateParams
    ) => Promise<Pick<Stripe.PaymentIntent, 'amount' | 'client_secret' | 'currency' | 'id'>>
  }
}

export interface StripeWebhookProcessResult {
  readonly processed: boolean
  readonly orderId?: string
  readonly paymentStatus?: OrderPaymentStatus
}

const isConfiguredSecret = (value: string | undefined): value is string => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return false
  }

  return !trimmedValue.startsWith('your_')
}

const getStripeClient = (): Stripe => {
  if (!isConfiguredSecret(apiConfig.stripeSecretKey)) {
    throw new ApiError(503, 'Stripe is not configured', 'STRIPE_NOT_CONFIGURED')
  }

  return new Stripe(apiConfig.stripeSecretKey, {
    apiVersion: STRIPE_API_VERSION,
  })
}

const toStripeAmount = (amount: number): number => Math.round(amount * 100)

const getOrderIdFromStripeObject = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object' || !('metadata' in value)) {
    return undefined
  }

  const metadata = value.metadata

  if (!metadata || typeof metadata !== 'object' || !('orderId' in metadata)) {
    return undefined
  }

  return typeof metadata.orderId === 'string' ? metadata.orderId : undefined
}

export const createCheckoutPaymentIntent = async (
  input: CreateOrderRequest & { readonly userId?: string },
  stripeClient: StripePaymentIntentCreator = getStripeClient()
): Promise<CreateCheckoutPaymentIntentResponse> => {
  const order = await createOrder({
    ...input,
    paymentStatus: 'payment_required',
  })

  try {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: toStripeAmount(order.totals.total),
      currency: STRIPE_CURRENCY,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: order.id,
        userId: order.userId ?? '',
        customerEmail: order.customer.email,
      },
    })

    if (!paymentIntent.client_secret) {
      throw new ApiError(
        502,
        'Stripe did not return a client secret',
        'STRIPE_CLIENT_SECRET_MISSING'
      )
    }

    return {
      order,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        publishableKey: apiConfig.stripePublishableKey,
      },
    }
  } catch (error) {
    await updateOrderPaymentStatus(order.id, 'payment_failed')

    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError(502, 'Stripe payment setup failed', 'STRIPE_PAYMENT_INTENT_FAILED')
  }
}

export const constructStripeWebhookEvent = (
  payload: Buffer | string,
  signature: string | undefined
): Stripe.Event => {
  if (!signature) {
    throw new ApiError(400, 'Stripe signature is required', 'STRIPE_SIGNATURE_REQUIRED')
  }

  if (!isConfiguredSecret(apiConfig.stripeWebhookSecret)) {
    throw new ApiError(
      503,
      'Stripe webhook secret is not configured',
      'STRIPE_WEBHOOK_NOT_CONFIGURED'
    )
  }

  try {
    return getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      apiConfig.stripeWebhookSecret
    )
  } catch {
    throw new ApiError(400, 'Invalid Stripe webhook signature', 'STRIPE_SIGNATURE_INVALID')
  }
}

export const processStripeWebhookEvent = async (
  event: Pick<Stripe.Event, 'data' | 'type'>
): Promise<StripeWebhookProcessResult> => {
  const orderId = getOrderIdFromStripeObject(event.data.object)

  if (!orderId) {
    return { processed: false }
  }

  if (event.type === 'payment_intent.succeeded') {
    const updatedOrder = await updateOrderPaymentStatus(orderId, 'paid')

    if (!updatedOrder) {
      return { processed: false, orderId }
    }

    return { processed: true, orderId, paymentStatus: 'paid' }
  }

  if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
    const updatedOrder = await updateOrderPaymentStatus(orderId, 'payment_failed')

    if (!updatedOrder) {
      return { processed: false, orderId }
    }

    return { processed: true, orderId, paymentStatus: 'payment_failed' }
  }

  return { processed: false, orderId }
}
