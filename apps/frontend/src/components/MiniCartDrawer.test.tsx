import { act, fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useGetProductsQuery } from '../api/productsApi'
import { addItem } from '../slices/cartSlice'
import { openMiniCart } from '../slices/cartUiSlice'
import { renderWithProviders } from '../test/render'
import type { Product } from '../types'
import MiniCartDrawer from './MiniCartDrawer'

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
]

describe('MiniCartDrawer', () => {
  it('shows cart drawer item details and free-shipping progress', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: products,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetProductsQuery>)

    const { store } = renderWithProviders(<MiniCartDrawer />)

    act(() => {
      store.dispatch(
        addItem({
          productId: 'hoodie-001',
          variantSku: 'hoodie-001-black-m',
          size: 'M',
          color: 'Black',
        })
      )
      store.dispatch(openMiniCart())
    })

    expect(screen.getByRole('dialog', { name: 'Added to your cart' })).toBeInTheDocument()
    expect(screen.getByText('$40.01 away from free shipping')).toBeInTheDocument()
    expect(screen.getByText('Everyday Weight Hoodie')).toBeInTheDocument()
    expect(screen.getByText('M / Black')).toBeInTheDocument()
    expect(screen.getByText('Qty 1')).toBeInTheDocument()
    expect(screen.getByText('Estimated total')).toBeInTheDocument()
    expect(screen.getByText('$72.29')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'View cart' }))

    expect(store.getState().cartUi.isMiniCartOpen).toBe(false)
  })

  it('lets shoppers edit drawer item quantities and remove items', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: products,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetProductsQuery>)

    const { store } = renderWithProviders(<MiniCartDrawer />)

    act(() => {
      store.dispatch(
        addItem({
          productId: 'hoodie-001',
          variantSku: 'hoodie-001-black-m',
          size: 'M',
          color: 'Black',
        })
      )
      store.dispatch(openMiniCart())
    })

    fireEvent.click(screen.getByRole('button', { name: '+' }))

    expect(store.getState().cart.items[0]?.quantity).toBe(2)
    expect(screen.getByText('Qty 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '-' }))

    expect(store.getState().cart.items[0]?.quantity).toBe(1)
    expect(screen.getByText('Qty 1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(store.getState().cart.items).toEqual([])
  })

  it('saves drawer items for later using the wishlist', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: products,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetProductsQuery>)

    const { store } = renderWithProviders(<MiniCartDrawer />)

    act(() => {
      store.dispatch(
        addItem({
          productId: 'hoodie-001',
          variantSku: 'hoodie-001-black-m',
          size: 'M',
          color: 'Black',
        })
      )
      store.dispatch(openMiniCart())
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }))

    expect(store.getState().cart.items).toEqual([])
    expect(store.getState().wishlist.productIds).toEqual(['hoodie-001'])
  })
})
