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
      shipping: 0,
      tax: 8,
      total: 108,
    })
  })

  it('applies validated promo codes to trusted checkout totals', async () => {
    expect(calculateOrderTotals(59.99, 'OSAI10')).toEqual({
      subtotal: 59.99,
      discount: 6,
      shipping: 7.5,
      tax: 4.32,
      total: 65.81,
    })

    const order = await createOrder({
      customer: {
        email: 'promo-shopper@example.com',
        firstName: 'Promo',
        lastName: 'Shopper',
      },
      shippingAddress: {
        line1: '1 Main Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
      },
      promoCode: 'osai10',
      items: [{ productId: 'hoodie-001', quantity: 1 }],
    })

    expect(order.discount).toEqual({
      code: 'OSAI10',
      label: '10% off',
      amount: 6,
    })
    expect(order.totals.total).toBe(65.81)
  })

  it('rejects invalid promo codes before creating an order', async () => {
    await expect(
      createOrder({
        customer: {
          email: 'promo-shopper@example.com',
          firstName: 'Promo',
          lastName: 'Shopper',
        },
        shippingAddress: {
          line1: '1 Main Street',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
        },
        promoCode: 'NOPE',
        items: [{ productId: 'hoodie-001', quantity: 1 }],
      })
    ).rejects.toThrow('Promo code is not valid')
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
      items: [
        {
          color: 'White',
          productId: 'shirt-001',
          quantity: 2,
          size: 'S',
          variantSku: 'OSAI-TEE-WHT-S',
        },
      ],
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
        color: 'White',
        productId: 'shirt-001',
        name: 'Box Fit Street Tee',
        quantity: 2,
        size: 'S',
        unitPrice: 29.99,
        variantSku: 'OSAI-TEE-WHT-S',
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
