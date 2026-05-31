import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGetProductsQuery, useGetRecommendationsQuery } from '../api/productsApi'
import { renderWithProviders } from '../test/render'
import type { Product } from '../types'
import HomePage from './HomePage'

vi.mock('../api/productsApi', async () => {
  const actual = await vi.importActual<typeof import('../api/productsApi')>('../api/productsApi')

  return {
    ...actual,
    useGetProductsQuery: vi.fn(),
    useGetRecommendationsQuery: vi.fn(),
  }
})

const mockUseGetProductsQuery = vi.mocked(useGetProductsQuery)
const mockUseGetRecommendationsQuery = vi.mocked(useGetRecommendationsQuery)

const products: Product[] = [
  {
    id: 'shirt-001',
    name: 'Box Fit Street Tee',
    description: 'Heavy cotton tee',
    price: 29.99,
    imageUrl: 'shirt.jpg',
    category: 'tees',
    popularityScore: 88,
    variants: [
      {
        sku: 'shirt-001-white-l',
        size: 'L',
        color: 'White',
        stockQuantity: 12,
      },
    ],
  },
  {
    id: 'hoodie-001',
    name: 'Everyday Weight Hoodie',
    description: 'Soft fleece hoodie',
    price: 59.99,
    imageUrl: 'hoodie.jpg',
    category: 'hoodies',
    popularityScore: 95,
    ratingSummary: {
      averageRating: 5,
      reviewCount: 2,
    },
    variants: [
      {
        sku: 'hoodie-001-grey-m',
        size: 'M',
        color: 'Grey',
        stockQuantity: 8,
      },
    ],
  },
]

describe('HomePage', () => {
  beforeEach(() => {
    mockUseGetProductsQuery.mockReset()
    mockUseGetRecommendationsQuery.mockReset()
    mockUseGetRecommendationsQuery.mockReturnValue({
      data: [],
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetRecommendationsQuery>)
  })

  it('renders loading skeletons while products load', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductsQuery>)

    const { container } = renderWithProviders(<HomePage />)

    expect(container.querySelectorAll('.chakra-skeleton')).toHaveLength(3)
  })

  it('renders a retry state when product loading fails', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500, data: { message: 'Nope' } },
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductsQuery>)

    renderWithProviders(<HomePage />)

    expect(screen.getByText('We could not load the collection.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders an empty collection state', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductsQuery>)

    renderWithProviders(<HomePage />)

    expect(screen.getByText('No products available yet.')).toBeInTheDocument()
  })

  it('renders products when the collection loads', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: products,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductsQuery>)

    renderWithProviders(<HomePage />)

    expect(screen.getByText('Box Fit Street Tee')).toBeInTheDocument()
    expect(screen.getByText('Everyday Weight Hoodie')).toBeInTheDocument()
    expect(screen.getAllByRole('combobox', { name: 'Sort products' })).toHaveLength(1)
  })

  it('filters products with drawer controls and applied chips', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: products,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductsQuery>)

    renderWithProviders(<HomePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.click(screen.getByRole('button', { name: 'Filter size M' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Grey' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by price' }), {
      target: { value: '30-60' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: 'In stock only' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show 1 products' }))

    expect(screen.getByText('Showing 1 of 2 products')).toBeInTheDocument()
    expect(screen.getByText('Everyday Weight Hoodie')).toBeInTheDocument()
    expect(screen.queryByText('Box Fit Street Tee')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Size M x' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grey x' })).toBeInTheDocument()
  })

  it('renders recommendations when they load', () => {
    mockUseGetProductsQuery.mockReturnValue({
      data: products,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductsQuery>)
    mockUseGetRecommendationsQuery.mockReturnValue({
      data: [products[1]],
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetRecommendationsQuery>)

    renderWithProviders(<HomePage />)

    expect(screen.getByRole('heading', { name: 'Popular right now' })).toBeInTheDocument()
  })
})
