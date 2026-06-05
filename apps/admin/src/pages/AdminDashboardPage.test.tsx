import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetAdminAnalyticsQuery,
  useGetAdminInventoryQuery,
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetAdminUsersQuery,
  useUpdateInventoryMutation,
  useUpdateOrderStatusMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
} from '../api/adminApi'
import { renderWithProviders } from '../test/render'
import type { Product, User } from '../types'
import AdminDashboardPage from './AdminDashboardPage'

vi.mock('../api/adminApi', async () => {
  const actual = await vi.importActual<typeof import('../api/adminApi')>('../api/adminApi')

  return {
    ...actual,
    useCreateProductMutation: vi.fn(),
    useDeleteProductMutation: vi.fn(),
    useGetAdminAnalyticsQuery: vi.fn(),
    useGetAdminInventoryQuery: vi.fn(),
    useGetAdminOrdersQuery: vi.fn(),
    useGetAdminProductsQuery: vi.fn(),
    useGetAdminUsersQuery: vi.fn(),
    useUploadProductImageMutation: vi.fn(),
    useUpdateInventoryMutation: vi.fn(),
    useUpdateOrderStatusMutation: vi.fn(),
    useUpdateProductMutation: vi.fn(),
  }
})

const mockUseGetAdminAnalyticsQuery = vi.mocked(useGetAdminAnalyticsQuery)
const mockUseGetAdminOrdersQuery = vi.mocked(useGetAdminOrdersQuery)
const mockUseGetAdminProductsQuery = vi.mocked(useGetAdminProductsQuery)
const mockUseGetAdminInventoryQuery = vi.mocked(useGetAdminInventoryQuery)
const mockUseGetAdminUsersQuery = vi.mocked(useGetAdminUsersQuery)
const mockUseCreateProductMutation = vi.mocked(useCreateProductMutation)
const mockUseDeleteProductMutation = vi.mocked(useDeleteProductMutation)
const mockUseUploadProductImageMutation = vi.mocked(useUploadProductImageMutation)
const mockUseUpdateInventoryMutation = vi.mocked(useUpdateInventoryMutation)
const mockUseUpdateOrderStatusMutation = vi.mocked(useUpdateOrderStatusMutation)
const mockUseUpdateProductMutation = vi.mocked(useUpdateProductMutation)

const adminUser: User = {
  id: 'admin-001',
  email: 'admin@osai.test',
  name: 'Admin User',
  role: 'admin',
}

const products: Product[] = [
  {
    id: 'hoodie-001',
    name: 'Everyday Weight Hoodie',
    description: 'Soft fleece hoodie',
    price: 59.99,
    compareAtPrice: 79.99,
    imageUrl: 'hoodie.jpg',
    category: 'hoodies',
  },
]

const createQueryResult = <TData,>(data: TData) => ({
  data,
  isError: false,
  isLoading: false,
  refetch: vi.fn(),
})

const configureSuccessfulAdminQueries = () => {
  mockUseGetAdminAnalyticsQuery.mockReturnValue(
    createQueryResult({ orderCount: 2, pendingCount: 1, revenue: 149.98 }) as unknown as ReturnType<
      typeof useGetAdminAnalyticsQuery
    >
  )
  mockUseGetAdminOrdersQuery.mockReturnValue(
    createQueryResult({ orders: [] }) as unknown as ReturnType<typeof useGetAdminOrdersQuery>
  )
  mockUseGetAdminProductsQuery.mockReturnValue(
    createQueryResult({ products }) as unknown as ReturnType<typeof useGetAdminProductsQuery>
  )
  mockUseGetAdminInventoryQuery.mockReturnValue(
    createQueryResult({ inventory: [] }) as unknown as ReturnType<typeof useGetAdminInventoryQuery>
  )
  mockUseGetAdminUsersQuery.mockReturnValue(
    createQueryResult({ users: [] }) as unknown as ReturnType<typeof useGetAdminUsersQuery>
  )
  mockUseCreateProductMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useCreateProductMutation
  >)
  mockUseDeleteProductMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useDeleteProductMutation
  >)
  mockUseUploadProductImageMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useUploadProductImageMutation
  >)
  mockUseUpdateInventoryMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useUpdateInventoryMutation
  >)
  mockUseUpdateOrderStatusMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useUpdateOrderStatusMutation
  >)
  mockUseUpdateProductMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useUpdateProductMutation
  >)
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    configureSuccessfulAdminQueries()
  })

  it('skips admin data queries when there is no signed-in admin session', () => {
    renderWithProviders(<AdminDashboardPage />)

    expect(mockUseGetAdminAnalyticsQuery).toHaveBeenCalledWith(undefined, { skip: true })
    expect(mockUseGetAdminOrdersQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 0,
      skip: true,
    })
    expect(mockUseGetAdminProductsQuery).toHaveBeenCalledWith(undefined, { skip: true })
    expect(mockUseGetAdminInventoryQuery).toHaveBeenCalledWith(undefined, { skip: true })
    expect(mockUseGetAdminUsersQuery).toHaveBeenCalledWith(undefined, { skip: true })
    expect(screen.queryByRole('heading', { name: 'Admin dashboard' })).not.toBeInTheDocument()
  })

  it('loads admin data only for an authenticated admin user', () => {
    renderWithProviders(<AdminDashboardPage />, {
      preloadedAuth: { token: 'test-token', user: adminUser },
    })

    expect(mockUseGetAdminAnalyticsQuery).toHaveBeenCalledWith(undefined, { skip: false })
    expect(mockUseGetAdminOrdersQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 5000,
      skip: false,
    })
    expect(mockUseGetAdminProductsQuery).toHaveBeenCalledWith(undefined, { skip: false })
    expect(mockUseGetAdminInventoryQuery).toHaveBeenCalledWith(undefined, { skip: false })
    expect(mockUseGetAdminUsersQuery).toHaveBeenCalledWith(undefined, { skip: false })
    expect(screen.getByRole('heading', { name: 'Admin dashboard' })).toBeInTheDocument()
    expect(screen.getByText('$149.98')).toBeInTheDocument()
  })

  it('lets admins edit product merchandising fields', () => {
    const updateProduct = vi
      .fn()
      .mockReturnValue({ unwrap: vi.fn().mockResolvedValue(products[0]) })
    mockUseUpdateProductMutation.mockReturnValue([updateProduct, {}] as unknown as ReturnType<
      typeof useUpdateProductMutation
    >)

    renderWithProviders(<AdminDashboardPage />, {
      preloadedAuth: { token: 'test-token', user: adminUser },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByDisplayValue('Everyday Weight Hoodie'), {
      target: { value: 'Everyday Weight Hoodie V2' },
    })
    fireEvent.change(screen.getByDisplayValue('59.99'), {
      target: { value: '54.99' },
    })
    fireEvent.change(screen.getByDisplayValue('79.99'), {
      target: { value: '79.99' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(updateProduct).toHaveBeenCalledWith({
      productId: 'hoodie-001',
      updates: expect.objectContaining({
        compareAtPrice: 79.99,
        name: 'Everyday Weight Hoodie V2',
        price: 54.99,
      }),
    })
  })
})
