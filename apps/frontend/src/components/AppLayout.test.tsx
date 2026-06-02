import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useGetProductsQuery } from '../api/productsApi'
import { addItem } from '../slices/cartSlice'
import { addWishlistItem } from '../slices/wishlistSlice'
import { renderWithProviders } from '../test/render'
import AppLayout from './AppLayout'

vi.mock('../api/productsApi', async () => {
  const actual = await vi.importActual<typeof import('../api/productsApi')>('../api/productsApi')

  return {
    ...actual,
    useGetProductsQuery: vi.fn(),
  }
})

const mockUseGetProductsQuery = vi.mocked(useGetProductsQuery)

describe('AppLayout', () => {
  it('counts only saved items that are not already in the cart', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: [],
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetProductsQuery>)

    const { store } = renderWithProviders(
      <AppLayout>
        <div>Page</div>
      </AppLayout>
    )

    act(() => {
      store.dispatch(addWishlistItem({ productId: 'hoodie-001' }))
      store.dispatch(addWishlistItem({ productId: 'jacket-001' }))
      store.dispatch(addItem({ productId: 'hoodie-001' }))
    })

    expect(screen.getByTestId('saved-count-link')).toHaveTextContent('Saved 1')
    expect(screen.queryByText('Wishlist 2')).not.toBeInTheDocument()
  })
})
