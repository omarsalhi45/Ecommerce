import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useGetProductsQuery } from '../api/productsApi'
import { addItem } from '../slices/cartSlice'
import { addWishlistItem } from '../slices/wishlistSlice'
import { renderWithProviders } from '../test/render'
import type { Product } from '../types'
import WishlistPage from './WishlistPage'

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
  },
  {
    id: 'jacket-001',
    name: 'Night Run Windbreaker',
    description: 'Lightweight shell',
    price: 89.99,
    imageUrl: 'jacket.jpg',
    category: 'jackets',
  },
]

describe('WishlistPage', () => {
  it('shows saved-for-later products that are not currently in the cart', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: products,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetProductsQuery>)

    const { store } = renderWithProviders(<WishlistPage />)

    act(() => {
      store.dispatch(addWishlistItem({ productId: 'hoodie-001' }))
      store.dispatch(addWishlistItem({ productId: 'jacket-001' }))
      store.dispatch(addItem({ productId: 'hoodie-001' }))
    })

    expect(screen.getByRole('heading', { name: 'Saved for later' })).toBeInTheDocument()
    expect(screen.getByText('Night Run Windbreaker')).toBeInTheDocument()
    expect(screen.queryByText('Everyday Weight Hoodie')).not.toBeInTheDocument()
  })
})
