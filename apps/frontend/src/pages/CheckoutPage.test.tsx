import { act, fireEvent, screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreateCheckoutPaymentIntentMutation, useCreateOrderMutation } from '../api/ordersApi'
import { useGetProductsQuery } from '../api/productsApi'
import { addItem } from '../slices/cartSlice'
import { renderWithProviders } from '../test/render'
import type { Product } from '../types'
import CheckoutPage from './CheckoutPage'

vi.mock('../api/ordersApi', async () => {
  const actual = await vi.importActual<typeof import('../api/ordersApi')>('../api/ordersApi')

  return {
    ...actual,
    useCreateCheckoutPaymentIntentMutation: vi.fn(),
    useCreateOrderMutation: vi.fn(),
  }
})

vi.mock('../api/productsApi', async () => {
  const actual = await vi.importActual<typeof import('../api/productsApi')>('../api/productsApi')

  return {
    ...actual,
    useGetProductsQuery: vi.fn(),
  }
})

vi.mock('../config', () => ({
  frontendConfig: {
    apiBaseUrl: 'http://localhost:4000/api',
    enableDebug: false,
    stripePublishableKey: undefined,
  },
}))

const mockUseCreateCheckoutPaymentIntentMutation = vi.mocked(useCreateCheckoutPaymentIntentMutation)
const mockUseCreateOrderMutation = vi.mocked(useCreateOrderMutation)
const mockUseGetProductsQuery = vi.mocked(useGetProductsQuery)

const products: Product[] = [
  {
    id: 'hoodie-001',
    name: 'Everyday Weight Hoodie',
    description: 'Soft fleece hoodie',
    price: 59.99,
    imageUrl: 'hoodie.jpg',
    category: 'hoodies',
    variants: [
      {
        sku: 'hoodie-001-black-m',
        size: 'M',
        color: 'Black',
        stockQuantity: 8,
      },
    ],
  },
  {
    id: 'tee-001',
    name: 'Core Logo Tee',
    description: 'Soft cotton tee',
    price: 32,
    imageUrl: 'tee.jpg',
    category: 'tees',
    variants: [
      {
        sku: 'tee-001-white-m',
        size: 'M',
        color: 'White',
        stockQuantity: 12,
      },
    ],
  },
]

const setupCheckoutMocks = () => {
  const createOrder = vi.fn(() => ({
    unwrap: vi.fn().mockResolvedValue({
      id: 'order_test_1',
      paymentStatus: 'mock_paid',
      totals: {
        subtotal: 59.99,
        discount: 6,
        shipping: 7.5,
        tax: 4.32,
        total: 65.81,
      },
    }),
  }))
  const createCheckoutPaymentIntent = vi.fn(() => ({
    unwrap: vi.fn().mockResolvedValue({
      order: {
        id: 'order_test_1',
      },
      paymentIntent: {
        id: 'pi_test_1',
        clientSecret: 'pi_test_secret',
        amount: 6581,
        currency: 'usd',
      },
    }),
  }))

  mockUseGetProductsQuery.mockReturnValue({
    data: products,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useGetProductsQuery>)
  mockUseCreateOrderMutation.mockReturnValue([
    createOrder,
    { isLoading: false },
  ] as unknown as ReturnType<typeof useCreateOrderMutation>)
  mockUseCreateCheckoutPaymentIntentMutation.mockReturnValue([
    createCheckoutPaymentIntent,
    { isLoading: false },
  ] as unknown as ReturnType<typeof useCreateCheckoutPaymentIntentMutation>)

  return { createCheckoutPaymentIntent, createOrder }
}

const renderCheckout = () =>
  renderWithProviders(
    <Routes>
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/:checkoutStep" element={<CheckoutPage />} />
    </Routes>,
    { initialEntries: ['/checkout'] }
  )

describe('CheckoutPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    setupCheckoutMocks()
  })

  it('moves shoppers through contact, shipping, and review screens', () => {
    const { store } = renderCheckout()

    act(() => {
      store.dispatch(
        addItem({
          productId: 'hoodie-001',
          variantSku: 'hoodie-001-black-m',
          size: 'M',
          color: 'Black',
        })
      )
    })

    const steps = within(screen.getByLabelText('Checkout steps'))

    expect(steps.getByText('Step 1')).toBeInTheDocument()
    expect(steps.getByText('Contact')).toBeInTheDocument()
    expect(steps.getByText('Shipping')).toBeInTheDocument()
    expect(steps.getByText('Review')).toBeInTheDocument()
    expect(steps.getByText('Payment')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Contact details' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/First name/), { target: { value: 'Omar' } })
    fireEvent.change(screen.getByLabelText(/Last name/), { target: { value: 'Salhi' } })
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'omar@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue to shipping' }))

    expect(screen.getByRole('heading', { name: 'Shipping' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Address line 1/), {
      target: { value: '10 Market Street' },
    })
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Paris' } })
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'IDF' } })
    fireEvent.change(screen.getByLabelText(/Postal code/), { target: { value: '75001' } })
    fireEvent.click(screen.getByLabelText(/Priority handling/))
    fireEvent.click(screen.getByRole('button', { name: 'Continue to review' }))

    expect(screen.getByRole('heading', { name: 'Review your order' })).toBeInTheDocument()
    expect(screen.getByText('Omar Salhi')).toBeInTheDocument()
    expect(screen.getByText('omar@example.com')).toBeInTheDocument()
    expect(screen.getByText('Priority handling - 2-4 business days')).toBeInTheDocument()
    expect(screen.getByText('10 Market Street, Paris, IDF, 75001')).toBeInTheDocument()
    expect(screen.getByText('Items')).toBeInTheDocument()
    expect(screen.getByText('Everyday Weight Hoodie')).toBeInTheDocument()
    expect(screen.getByText('M / Black')).toBeInTheDocument()
    expect(screen.getByText('Qty 1 x $59.99')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit cart' })).toHaveAttribute('href', '/cart')
    expect(screen.getByText('Secure payment')).toBeInTheDocument()
    expect(screen.getByText('30-day returns on unworn items')).toBeInTheDocument()
  })

  it('lets shoppers continue when state or region is missing', () => {
    const { store } = renderCheckout()

    act(() => {
      store.dispatch(addItem({ productId: 'hoodie-001' }))
    })

    fireEvent.change(screen.getByLabelText(/First name/), { target: { value: 'Omar' } })
    fireEvent.change(screen.getByLabelText(/Last name/), { target: { value: 'Salhi' } })
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'omar@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue to shipping' }))

    fireEvent.change(screen.getByLabelText(/Address line 1/), {
      target: { value: '10 Market Street' },
    })
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Paris' } })
    fireEvent.change(screen.getByLabelText(/Postal code/), { target: { value: '75001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue to review' }))

    expect(screen.getByRole('heading', { name: 'Review your order' })).toBeInTheDocument()
    expect(screen.getByText('10 Market Street, Paris, 75001')).toBeInTheDocument()
    expect(screen.queryByText('State / region is required.')).not.toBeInTheDocument()
  })

  it('applies promo codes and sends them with checkout payloads', () => {
    const { createOrder } = setupCheckoutMocks()
    const { store } = renderCheckout()

    act(() => {
      store.dispatch(addItem({ productId: 'hoodie-001' }))
    })

    fireEvent.change(screen.getByLabelText('Promo code'), { target: { value: 'osai10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(screen.getByText('Promo OSAI10 -$6.00')).toBeInTheDocument()
    expect(screen.getByText('Estimated total $65.81')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/First name/), { target: { value: 'Omar' } })
    fireEvent.change(screen.getByLabelText(/Last name/), { target: { value: 'Salhi' } })
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'omar@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue to shipping' }))

    fireEvent.change(screen.getByLabelText(/Address line 1/), {
      target: { value: '10 Market Street' },
    })
    fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Paris' } })
    fireEvent.change(screen.getByLabelText(/Postal code/), { target: { value: '75001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue to review' }))
    fireEvent.click(screen.getByRole('button', { name: 'Place mocked order' }))

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        promoCode: 'OSAI10',
      })
    )
  })

  it('blocks minimum-subtotal promo codes before payment', () => {
    const { store } = renderCheckout()

    act(() => {
      store.dispatch(addItem({ productId: 'tee-001' }))
    })

    fireEvent.change(screen.getByLabelText('Promo code'), { target: { value: 'welcome15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(screen.getByText('WELCOME15 needs at least $50.00 in products.')).toBeInTheDocument()
    expect(screen.queryByText(/Promo WELCOME15/)).not.toBeInTheDocument()
  })
})
