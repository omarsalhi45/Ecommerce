import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useGetProductQuery,
  useGetProductReviewsQuery,
  useGetProductsQuery,
  useGetRecommendationsQuery,
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
    useGetRecommendationsQuery: vi.fn(),
  }
})

const mockUseGetProductQuery = vi.mocked(useGetProductQuery)
const mockUseGetProductReviewsQuery = vi.mocked(useGetProductReviewsQuery)
const mockUseGetProductsQuery = vi.mocked(useGetProductsQuery)
const mockUseGetRecommendationsQuery = vi.mocked(useGetRecommendationsQuery)

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
    {
      sku: 'hoodie-001-black-l',
      color: 'Black',
      size: 'L',
      stockQuantity: 3,
    },
    {
      sku: 'hoodie-001-grey-m',
      color: 'Grey',
      size: 'M',
      stockQuantity: 6,
    },
    {
      sku: 'hoodie-001-black-xl',
      color: 'Black',
      size: 'XL',
      stockQuantity: 0,
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
    mockUseGetRecommendationsQuery.mockReset()
    mockUseGetProductReviewsQuery.mockReturnValue(createReviewsQueryResult())
    mockUseGetRecommendationsQuery.mockReturnValue({
      data: [],
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetRecommendationsQuery>)
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
    expect(screen.getByText('Choose your option')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select size M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select color Black' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select size XL (sold out)' })).toBeDisabled()
    expect(screen.getByText('Choose a size and color to check availability.')).toBeInTheDocument()
    expect(screen.getByText('5.0 / 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reviews' })).toBeInTheDocument()
    expect(screen.getByText('Soft and structured')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recommended pieces' })).toBeInTheDocument()
    expect(screen.getByText('Zip Layer Hoodie')).toBeInTheDocument()
  })

  it('requires a variant choice before adding a detailed product to the cart', () => {
    mockUseGetProductQuery.mockReturnValue({
      data: currentProduct,
      error: undefined,
      isLoading: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetProductQuery>)
    mockUseGetProductsQuery.mockReturnValue(
      createProductsQueryResult([currentProduct, relatedProduct])
    )

    const { store } = renderProductDetail()

    fireEvent.click(screen.getAllByRole('button', { name: 'Add to cart' })[0])

    expect(screen.getByText('Choose your option first')).toBeInTheDocument()
    expect(store.getState().cart.items).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'Select size M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select color Black' }))
    expect(screen.getByText('8 available in M / Black.')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Add to cart' })[0])

    expect(store.getState().cart.items).toEqual([
      {
        productId: 'hoodie-001',
        variantSku: 'hoodie-001-black-m',
        size: 'M',
        color: 'Black',
        quantity: 1,
      },
    ])
  })

  it('updates product detail stock messaging when shoppers change size and color', () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Select color Black' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select size L' }))

    expect(screen.getByText('Only 3 left in L / Black.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Select color Grey' }))

    expect(screen.getByText('Choose a size and color to check availability.')).toBeInTheDocument()
  })
})
