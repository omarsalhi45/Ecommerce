import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useGetProductQuery,
  useGetProductReviewsQuery,
  useGetProductsQuery,
} from '../api/productsApi'
import { renderWithProviders } from '../test/render'
import type { Product } from '../types'
import ProductDetailPage from './ProductDetailPage'

vi.mock('../api/productsApi', async () => {
  const actual = await vi.importActual<typeof import('../api/productsApi')>('../api/productsApi')

  return {
    ...actual,
    useGetProductQuery: vi.fn(),
    useGetProductReviewsQuery: vi.fn(),
    useGetProductsQuery: vi.fn(),
  }
})

const mockUseGetProductQuery = vi.mocked(useGetProductQuery)
const mockUseGetProductReviewsQuery = vi.mocked(useGetProductReviewsQuery)
const mockUseGetProductsQuery = vi.mocked(useGetProductsQuery)

const currentProduct: Product = {
  id: 'hoodie-001',
  name: 'Everyday Weight Hoodie',
  description: 'Soft fleece hoodie',
  price: 59.99,
  imageUrl: 'hoodie.jpg',
  category: 'hoodies',
  variants: [
    {
      sku: 'hoodie-001-black-m',
      color: 'Black',
      size: 'M',
      stockQuantity: 8,
    },
  ],
  ratingSummary: {
    averageRating: 5,
    reviewCount: 2,
  },
}

const relatedProduct: Product = {
  id: 'hoodie-002',
  name: 'Zip Layer Hoodie',
  description: 'Layer-ready hoodie',
  price: 64.99,
  imageUrl: 'zip.jpg',
  category: 'hoodies',
}

const createProductsQueryResult = (products: Product[]) =>
  ({
    data: products,
    refetch: vi.fn(),
  }) as unknown as ReturnType<typeof useGetProductsQuery>

const createReviewsQueryResult = () =>
  ({
    data: {
      summary: { averageRating: 5, reviewCount: 2 },
      reviews: [
        {
          id: 'review-hoodie-001-1',
          productId: 'hoodie-001',
          authorName: 'Leo',
          rating: 5,
          title: 'Soft and structured',
          body: 'Warm enough for late walks but still has a clean streetwear shape.',
          createdAt: '2026-02-11T18:45:00.000Z',
        },
      ],
    },
    refetch: vi.fn(),
  }) as unknown as ReturnType<typeof useGetProductReviewsQuery>

const renderProductDetail = () =>
  renderWithProviders(
    <Routes>
      <Route path="/products/:productId" element={<ProductDetailPage />} />
    </Routes>,
    { initialEntries: ['/products/hoodie-001'] }
  )

describe('ProductDetailPage', () => {
  beforeEach(() => {
    mockUseGetProductQuery.mockReset()
    mockUseGetProductReviewsQuery.mockReset()
    mockUseGetProductsQuery.mockReset()
    mockUseGetProductReviewsQuery.mockReturnValue(createReviewsQueryResult())
  })

  it('renders loading skeletons while product details load', () => {
    mockUseGetProductQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductQuery>)
    mockUseGetProductsQuery.mockReturnValue(createProductsQueryResult([]))

    const { container } = renderProductDetail()

    expect(mockUseGetProductQuery).toHaveBeenCalledWith('hoodie-001', { skip: false })
    expect(container.querySelectorAll('.chakra-skeleton').length).toBeGreaterThan(0)
  })

  it('renders a retryable not-found state when the product cannot load', () => {
    mockUseGetProductQuery.mockReturnValue({
      data: undefined,
      error: { status: 404, data: { message: 'Not found' } },
      isLoading: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductQuery>)
    mockUseGetProductsQuery.mockReturnValue(createProductsQueryResult([]))

    renderProductDetail()

    expect(screen.getByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders product variants and related products when details load', () => {
    mockUseGetProductQuery.mockReturnValue({
      data: currentProduct,
      error: undefined,
      isLoading: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductQuery>)
    mockUseGetProductsQuery.mockReturnValue(
      createProductsQueryResult([currentProduct, relatedProduct])
    )

    renderProductDetail()

    expect(screen.getByRole('heading', { name: 'Everyday Weight Hoodie' })).toBeInTheDocument()
    expect(screen.getByText('hoodie-001-black-m')).toBeInTheDocument()
    expect(screen.getByText('M / Black')).toBeInTheDocument()
    expect(screen.getByText('8 in stock')).toBeInTheDocument()
    expect(screen.getByText('5.0 / 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reviews' })).toBeInTheDocument()
    expect(screen.getByText('Soft and structured')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Related pieces' })).toBeInTheDocument()
    expect(screen.getByText('Zip Layer Hoodie')).toBeInTheDocument()
  })
})
