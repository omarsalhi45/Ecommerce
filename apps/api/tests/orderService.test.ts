import { beforeEach, describe, expect, it } from 'vitest'
import {
  calculateOrderTotals,
  createOrder,
  resetOrderStoreForTests,
} from '../src/services/orderService'

describe('orderService', () => {
  beforeEach(() => {
    resetOrderStoreForTests()
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
})
