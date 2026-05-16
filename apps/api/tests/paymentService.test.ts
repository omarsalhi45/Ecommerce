import { describe, expect, it } from 'vitest'
import { getOrderById, resetOrderStoreForTests } from '../src/services/orderService'
import {
  createCheckoutPaymentIntent,
  processStripeWebhookEvent,
} from '../src/services/paymentService'

const checkoutInput = {
  customer: {
    email: 'stripe-shopper@example.com',
    firstName: 'Stripe',
    lastName: 'Shopper',
  },
  shippingAddress: {
    line1: '1 Main Street',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'US',
  },
  items: [{ productId: 'hoodie-001', quantity: 1 }],
}

describe('paymentService', () => {
  it('creates a Stripe PaymentIntent from trusted backend totals', async () => {
    resetOrderStoreForTests()

    const response = await createCheckoutPaymentIntent(checkoutInput, {
      paymentIntents: {
        create: async (params) => {
          expect(params.amount).toBe(7229)
          expect(params.currency).toBe('usd')
          expect(params.metadata?.customerEmail).toBe('stripe-shopper@example.com')
          expect(params.metadata?.orderId).toMatch(/^order_/)

          return {
            amount: Number(params.amount),
            client_secret: 'pi_test_secret_123',
            currency: String(params.currency),
            id: 'pi_test_123',
          }
        },
      },
    })

    expect(response.order.paymentStatus).toBe('payment_required')
    expect(response.paymentIntent).toMatchObject({
      id: 'pi_test_123',
      clientSecret: 'pi_test_secret_123',
      amount: 7229,
      currency: 'usd',
    })
  })

  it('marks orders paid from a succeeded PaymentIntent webhook event', async () => {
    resetOrderStoreForTests()
    const response = await createCheckoutPaymentIntent(checkoutInput, {
      paymentIntents: {
        create: async () => ({
          amount: 7229,
          client_secret: 'pi_test_secret_123',
          currency: 'usd',
          id: 'pi_test_123',
        }),
      },
    })

    const result = await processStripeWebhookEvent({
      data: {
        object: {
          metadata: {
            orderId: response.order.id,
          },
        },
      },
      type: 'payment_intent.succeeded',
    })
    const updatedOrder = await getOrderById(response.order.id)

    expect(result).toEqual({
      processed: true,
      orderId: response.order.id,
      paymentStatus: 'paid',
    })
    expect(updatedOrder?.paymentStatus).toBe('paid')
  })

  it('ignores webhook events without order metadata', async () => {
    const result = await processStripeWebhookEvent({
      data: {
        object: {
          metadata: {},
        },
      },
      type: 'payment_intent.succeeded',
    })

    expect(result).toEqual({ processed: false })
  })

  it('does not process webhook events for unknown orders', async () => {
    const result = await processStripeWebhookEvent({
      data: {
        object: {
          metadata: {
            orderId: 'missing-order',
          },
        },
      },
      type: 'payment_intent.succeeded',
    })

    expect(result).toEqual({ processed: false, orderId: 'missing-order' })
  })
})
