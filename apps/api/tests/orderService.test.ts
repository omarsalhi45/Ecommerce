import { beforeEach, describe, expect, it } from 'vitest'
import {
  getSentEmailNotificationsForTests,
  resetEmailNotificationsForTests,
} from '../src/services/emailService'
import {
  calculateOrderTotals,
  createOrder,
  getOrderAnalytics,
  resetOrderStoreForTests,
} from '../src/services/orderService'

describe('orderService', () => {
  beforeEach(() => {
    resetOrderStoreForTests()
    resetEmailNotificationsForTests()
  })

  it('calculates trusted checkout totals', () => {
    expect(calculateOrderTotals(100)).toEqual({
      subtotal: 100,
      shipping: 7.5,
      tax: 8,
      total: 115.5,
    })
  })

  it('creates a mocked paid order from product snapshots', async () => {
    const order = await createOrder({
      customer: {
        email: 'shopper@example.com',
        firstName: 'Sam',
        lastName: 'Shopper',
      },
      shippingAddress: {
        line1: '1 Main Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
      },
      items: [{ productId: 'shirt-001', quantity: 2 }],
    })

    expect(order).toMatchObject({
      status: 'pending',
      paymentStatus: 'mock_paid',
      totals: {
        subtotal: 59.98,
        shipping: 7.5,
        tax: 4.8,
        total: 72.28,
      },
    })
    expect(order.items).toEqual([
      {
        productId: 'shirt-001',
        name: 'Box Fit Street Tee',
        quantity: 2,
        unitPrice: 29.99,
        lineTotal: 59.98,
      },
    ])
    expect(getSentEmailNotificationsForTests()[0]).toMatchObject({
      to: 'shopper@example.com',
      subject: expect.stringContaining(order.id),
    })
  })

  it('rejects unknown products', async () => {
    await expect(
      createOrder({
        customer: {
          email: 'shopper@example.com',
          firstName: 'Sam',
          lastName: 'Shopper',
        },
        shippingAddress: {
          line1: '1 Main Street',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
        },
        items: [{ productId: 'missing-product', quantity: 1 }],
      })
    ).rejects.toThrow('Product not found: missing-product')
  })

  it('recognizes revenue only for paid and mocked paid orders', async () => {
    await createOrder({
      customer: {
        email: 'mocked-shopper@example.com',
        firstName: 'Mocked',
        lastName: 'Shopper',
      },
      shippingAddress: {
        line1: '1 Main Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
      },
      items: [{ productId: 'shirt-001', quantity: 1 }],
    })

    await createOrder({
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
      paymentStatus: 'payment_required',
    })

    const analytics = await getOrderAnalytics()

    expect(analytics.orderCount).toBe(2)
    expect(analytics.revenue).toBe(39.89)
  })
})
