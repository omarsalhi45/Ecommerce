import { rm } from 'node:fs/promises'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { apiConfig } from '../src/config'
import { registerUser, resetAuthStoreForTests } from '../src/services/authService'
import { resetOrderStoreForTests } from '../src/services/orderService'

let server: Server
let baseUrl: string

beforeAll(() => {
  resetAuthStoreForTests()
  resetOrderStoreForTests()
  server = app.listen(0)
  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(() => {
  server.close()
})

describe('api app', () => {
  it('returns health status', async () => {
    const response = await fetch(`${baseUrl}/api/health`)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      status: 'ok',
      service: 'OSAI API',
    })
    expect(typeof body.timestamp).toBe('string')
  })

  it('does not cache API JSON responses', async () => {
    const response = await fetch(`${baseUrl}/api/products`)

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('etag')).toBeNull()
  })

  it('returns readiness status', async () => {
    const response = await fetch(`${baseUrl}/api/health/ready`)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.checks).toEqual({ api: 'ok' })
  })

  it('returns consistent JSON for missing routes', async () => {
    const response = await fetch(`${baseUrl}/api/missing-route`)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      code: 'NOT_FOUND',
      message: 'Route not found: GET /api/missing-route',
    })
  })

  it('rejects Stripe webhooks without a signature', async () => {
    const response = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe('STRIPE_SIGNATURE_REQUIRED')
  })

  it('registers, authenticates, and returns the current user', async () => {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Ari Customer',
        email: 'ari-route@example.com',
        password: 'password123',
      }),
    })
    const registerBody = await registerResponse.json()

    expect(registerResponse.status).toBe(201)
    expect(registerBody.user.email).toBe('ari-route@example.com')

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { authorization: `Bearer ${registerBody.token}` },
    })
    const meBody = await meResponse.json()

    expect(meResponse.status).toBe(200)
    expect(meBody.user).toEqual(registerBody.user)
  })

  it('bootstraps the first local admin and blocks a second bootstrap', async () => {
    resetAuthStoreForTests()

    const bootstrapResponse = await fetch(`${baseUrl}/api/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-bootstrap-secret': process.env.ADMIN_BOOTSTRAP_SECRET ?? '',
      },
      body: JSON.stringify({
        name: 'Local Admin',
        email: 'local-admin@example.com',
        password: 'password123',
      }),
    })
    const bootstrapBody = await bootstrapResponse.json()

    expect(bootstrapResponse.status).toBe(201)
    expect(bootstrapBody.user).toMatchObject({
      email: 'local-admin@example.com',
      role: 'admin',
    })

    const secondResponse = await fetch(`${baseUrl}/api/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-bootstrap-secret': process.env.ADMIN_BOOTSTRAP_SECRET ?? '',
      },
      body: JSON.stringify({
        name: 'Second Admin',
        email: 'second-admin@example.com',
        password: 'password123',
      }),
    })
    const secondBody = await secondResponse.json()

    expect(secondResponse.status).toBe(409)
    expect(secondBody.code).toBe('ADMIN_ALREADY_EXISTS')

    resetAuthStoreForTests()
  })

  it('creates checkout orders with trusted backend totals', async () => {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
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
        items: [{ productId: 'hoodie-001', quantity: 1 }],
      }),
    })
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      paymentStatus: 'mock_paid',
      totals: {
        subtotal: 59.99,
        shipping: 7.5,
        tax: 4.8,
        total: 72.29,
      },
    })
  })

  it('returns a single product for product detail pages', async () => {
    const response = await fetch(`${baseUrl}/api/products/hoodie-001`)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      id: 'hoodie-001',
      name: 'Everyday Weight Hoodie',
      category: 'hoodies',
      popularityScore: 95,
      ratingSummary: {
        averageRating: 5,
        reviewCount: 2,
      },
      variants: [
        {
          sku: 'OSAI-HOOD-GRY-M',
          size: 'M',
          color: 'Grey',
          stockQuantity: 34,
        },
      ],
    })
  })

  it('returns product reviews and rating summary', async () => {
    const response = await fetch(`${baseUrl}/api/products/hoodie-001/reviews`)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.summary).toEqual({
      averageRating: 5,
      reviewCount: 2,
    })
    expect(body.reviews).toHaveLength(2)
    expect(body.reviews[0]).toMatchObject({
      productId: 'hoodie-001',
      rating: 5,
    })
  })

  it('returns product recommendations', async () => {
    const response = await fetch(`${baseUrl}/api/products/recommendations?productId=hoodie-001`)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.products).toHaveLength(2)
    expect(body.products.map((product: { id: string }) => product.id)).not.toContain('hoodie-001')
  })

  it('serves OpenAPI documentation', async () => {
    const response = await fetch(`${baseUrl}/api/docs/openapi.json`)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.openapi).toBe('3.0.3')
    expect(body.paths['/orders/{id}/events']).toBeDefined()
  })

  it('opens an order status event stream', async () => {
    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customer: {
          email: 'events-shopper@example.com',
          firstName: 'Events',
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
      }),
    })
    const order = await orderResponse.json()
    const eventResponse = await fetch(`${baseUrl}/api/orders/${order.id}/events`)
    const reader = eventResponse.body?.getReader()
    const firstChunk = reader ? await reader.read() : undefined

    await reader?.cancel()

    expect(eventResponse.status).toBe(200)
    expect(eventResponse.headers.get('content-type')).toContain('text/event-stream')
    expect(new TextDecoder().decode(firstChunk?.value)).toContain(order.id)
  })

  it('rejects invalid checkout payloads', async () => {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('protects admin routes from guests and customers', async () => {
    const guestResponse = await fetch(`${baseUrl}/api/admin/orders`)
    const guestBody = await guestResponse.json()

    expect(guestResponse.status).toBe(401)
    expect(guestBody.code).toBe('AUTH_REQUIRED')

    const customer = await registerUser('Casey Customer', 'casey@example.com', 'password123')
    const customerResponse = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: { authorization: `Bearer ${customer.token}` },
    })
    const customerBody = await customerResponse.json()

    expect(customerResponse.status).toBe(403)
    expect(customerBody.code).toBe('AUTH_FORBIDDEN')
  })

  it('allows admins to upload product images', async () => {
    const admin = await registerUser(
      'Upload Admin',
      'upload-admin@example.com',
      'password123',
      'admin'
    )
    const formData = new FormData()

    formData.append('image', new Blob(['fake image bytes'], { type: 'image/png' }), 'product.png')

    const uploadResponse = await fetch(`${baseUrl}/api/admin/uploads/product-image`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${admin.token}`,
      },
      body: formData,
    })
    const uploadBody = await uploadResponse.json()

    expect(uploadResponse.status).toBe(201)
    expect(uploadBody.imageUrl).toContain('/uploads/product-images/')

    const imageResponse = await fetch(uploadBody.imageUrl)
    expect(imageResponse.status).toBe(200)

    const filename = new URL(uploadBody.imageUrl).pathname.split('/').at(-1)

    if (filename) {
      await rm(path.join(apiConfig.uploadDir, 'product-images', filename), { force: true })
    }
  })

  it('allows admins to read analytics and update order status', async () => {
    const admin = await registerUser('Ari Admin', 'admin@example.com', 'password123', 'admin')
    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customer: {
          email: 'status-shopper@example.com',
          firstName: 'Status',
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
      }),
    })
    const order = await orderResponse.json()

    const analyticsResponse = await fetch(`${baseUrl}/api/admin/analytics`, {
      headers: { authorization: `Bearer ${admin.token}` },
    })
    const analytics = await analyticsResponse.json()

    expect(analyticsResponse.status).toBe(200)
    expect(analytics.orderCount).toBeGreaterThanOrEqual(1)

    const updateResponse = await fetch(`${baseUrl}/api/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${admin.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ status: 'shipped' }),
    })
    const updatedOrder = await updateResponse.json()

    expect(updateResponse.status).toBe(200)
    expect(updatedOrder.status).toBe('shipped')
  })
})
