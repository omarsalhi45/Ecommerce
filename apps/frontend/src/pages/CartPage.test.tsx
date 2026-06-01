import { act, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useGetProductsQuery } from '../api/productsApi'
import { addItem } from '../slices/cartSlice'
import { renderWithProviders } from '../test/render'
import type { Product } from '../types'
import CartPage from './CartPage'

vi.mock('../api/productsApi', async () => {
  const actual = await vi.importActual<typeof import('../api/productsApi')>('../api/productsApi')

  return {
    ...actual,
    useGetProductsQuery: vi.fn(),
  }
})

const mockUseGetProductsQuery = vi.mocked(useGetProductsQuery)

const products: Product[] = [
  {
    id: 'hoodie-001',
    name: 'Everyday Weight Hoodie',
    description: 'Soft fleece hoodie',
    price: 59.99,
    imageUrl: 'hoodie.jpg',
    category: 'hoodies',
    popularityScore: 90,
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
    name: 'Box Fit Street Tee',
    description: 'Heavy cotton tee',
    price: 29.99,
    imageUrl: 'tee.jpg',
    category: 'tees',
    popularityScore: 95,
    variants: [
      {
        sku: 'tee-001-white-l',
        size: 'L',
        color: 'White',
        stockQuantity: 12,
      },
    ],
  },
  {
    id: 'jacket-001',
    name: 'Night Run Windbreaker',
    description: 'Lightweight shell',
    price: 89.99,
    imageUrl: 'jacket.jpg',
    category: 'jackets',
    popularityScore: 80,
  },
]

describe('CartPage', () => {
  it('shows cart recommendations and trust details for active carts', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: products,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetProductsQuery>)

    const { store } = renderWithProviders(<CartPage />)

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

    expect(screen.getByRole('heading', { name: 'Complete your cart' })).toBeInTheDocument()
    expect(screen.getByText('Box Fit Street Tee')).toBeInTheDocument()
    expect(
      screen.queryByText('Everyday Weight Hoodie', { selector: 'h2, h3' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Delivery estimate')).toBeInTheDocument()
    expect(screen.getByText('Secure payment')).toBeInTheDocument()
    expect(screen.getByText('Returns clarity')).toBeInTheDocument()

    const recommendation = screen.getByText('Box Fit Street Tee').closest('div')
    fireEvent.click(
      within(recommendation as HTMLElement).getByRole('button', { name: 'Add to cart' })
    )

    expect(store.getState().cart.items).toEqual([
      {
        productId: 'hoodie-001',
        variantSku: 'hoodie-001-black-m',
        size: 'M',
        color: 'Black',
        quantity: 1,
      },
      {
        productId: 'tee-001',
        variantSku: 'tee-001-white-l',
        size: 'L',
        color: 'White',
        quantity: 1,
      },
    ])
  })
})
