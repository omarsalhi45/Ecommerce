import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { useGetOrderQuery } from '../api/ordersApi'
import { renderWithProviders } from '../test/render'
import type { Order } from '../types'
import OrderTrackingPage from './OrderTrackingPage'

vi.mock('../api/ordersApi', async () => {
  const actual = await vi.importActual<typeof import('../api/ordersApi')>('../api/ordersApi')

  return {
    ...actual,
    useGetOrderQuery: vi.fn(),
  }
})

const mockUseGetOrderQuery = vi.mocked(useGetOrderQuery)

const order: Order = {
  id: 'order_test_1',
  status: 'shipped',
  paymentStatus: 'paid',
  customer: {
    email: 'omar@example.com',
    firstName: 'Omar',
    lastName: 'Salhi',
  },
  shippingAddress: {
    line1: '10 Market Street',
    city: 'Paris',
    postalCode: '75001',
    country: 'FR',
  },
  items: [],
  totals: {
    subtotal: 59.99,
    shipping: 7.5,
    tax: 4.8,
    total: 72.29,
  },
  createdAt: '2026-06-02T10:00:00.000Z',
}

const renderTrackingPage = (initialEntry = '/track-order') =>
  renderWithProviders(
    <Routes>
      <Route path="/track-order" element={<OrderTrackingPage />} />
    </Routes>,
    { initialEntries: [initialEntry] }
  )

describe('OrderTrackingPage', () => {
  it('asks for an order ID before tracking', () => {
    mockUseGetOrderQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetOrderQuery>)

    renderTrackingPage()

    expect(screen.getByRole('heading', { name: 'Track your OSAI order' })).toBeInTheDocument()
    expect(
      screen.getByText('Your order ID appears on the confirmation page and in your order email.')
    ).toBeInTheDocument()
    expect(mockUseGetOrderQuery).toHaveBeenCalledWith('', {
      pollingInterval: 3000,
      skip: true,
    })
  })

  it('shows public order tracking details', () => {
    mockUseGetOrderQuery.mockReturnValue({
      data: order,
      isError: false,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetOrderQuery>)

    renderTrackingPage('/track-order?orderId=order_test_1')

    expect(mockUseGetOrderQuery).toHaveBeenCalledWith('order_test_1', {
      pollingInterval: 3000,
      skip: false,
    })
    expect(screen.getByText('order_test_1')).toBeInTheDocument()
    expect(screen.getByText('Shipped')).toBeInTheDocument()
    expect(screen.getByText('Order received')).toBeInTheDocument()
    expect(screen.getByText('On the way')).toBeInTheDocument()
    expect(screen.getByText('Payment: Paid')).toBeInTheDocument()
    expect(screen.getByText('Total: $72.29')).toBeInTheDocument()
  })

  it('updates the query string from the tracking form', () => {
    mockUseGetOrderQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetOrderQuery>)

    renderTrackingPage()

    fireEvent.change(screen.getByLabelText('Order ID'), {
      target: { value: 'order_missing' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Track order' }))

    expect(screen.getByDisplayValue('order_missing')).toBeInTheDocument()
  })
})
