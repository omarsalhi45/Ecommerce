import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreateInventoryVariantMutation,
  useCreateProductMutation,
  useDeleteInventoryVariantMutation,
  useDeleteProductMutation,
  useDeleteProductPermanentlyMutation,
  useGetAdminAnalyticsQuery,
  useGetAdminInventoryQuery,
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetAdminUsersQuery,
  useUpdateInventoryMutation,
  useUpdateOrderStatusMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
  useUploadProductImageMutation,
} from '../api/adminApi'
import { renderWithProviders } from '../test/render'
import type { InventoryItem, Order, Product, User } from '../types'
import AdminDashboardPage from './AdminDashboardPage'

vi.mock('../api/adminApi', async () => {
  const actual = await vi.importActual<typeof import('../api/adminApi')>('../api/adminApi')

  return {
    ...actual,
    useCreateInventoryVariantMutation: vi.fn(),
    useCreateProductMutation: vi.fn(),
    useDeleteInventoryVariantMutation: vi.fn(),
    useDeleteProductPermanentlyMutation: vi.fn(),
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
    useUpdateProductStatusMutation: vi.fn(),
  }
})

const mockUseGetAdminAnalyticsQuery = vi.mocked(useGetAdminAnalyticsQuery)
const mockUseGetAdminOrdersQuery = vi.mocked(useGetAdminOrdersQuery)
const mockUseGetAdminProductsQuery = vi.mocked(useGetAdminProductsQuery)
const mockUseGetAdminInventoryQuery = vi.mocked(useGetAdminInventoryQuery)
const mockUseGetAdminUsersQuery = vi.mocked(useGetAdminUsersQuery)
const mockUseCreateInventoryVariantMutation = vi.mocked(useCreateInventoryVariantMutation)
const mockUseCreateProductMutation = vi.mocked(useCreateProductMutation)
const mockUseDeleteInventoryVariantMutation = vi.mocked(useDeleteInventoryVariantMutation)
const mockUseDeleteProductMutation = vi.mocked(useDeleteProductMutation)
const mockUseDeleteProductPermanentlyMutation = vi.mocked(useDeleteProductPermanentlyMutation)
const mockUseUploadProductImageMutation = vi.mocked(useUploadProductImageMutation)
const mockUseUpdateInventoryMutation = vi.mocked(useUpdateInventoryMutation)
const mockUseUpdateOrderStatusMutation = vi.mocked(useUpdateOrderStatusMutation)
const mockUseUpdateProductMutation = vi.mocked(useUpdateProductMutation)
const mockUseUpdateProductStatusMutation = vi.mocked(useUpdateProductStatusMutation)

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
    modelHeight: '6 ft',
    modelSize: 'M',
    fitDescription: 'Original fit copy',
    materialDescription: 'Original material copy',
    careInstructions: 'Original care copy',
    productStory: 'Original story copy',
    productQuestions: [
      { question: 'Original question one?', answer: 'Original answer one.' },
      { question: 'Original question two?', answer: 'Original answer two.' },
    ],
    variants: [
      {
        sku: 'OSAI-HOOD-GRY-M',
        size: 'M',
        color: 'Grey',
        stockQuantity: 4,
      },
      {
        sku: 'OSAI-HOOD-BLK-L',
        size: 'L',
        color: 'Black',
        stockQuantity: 11,
      },
    ],
  },
]

const inventory: InventoryItem[] = [
  {
    product: products[0],
    sku: 'OSAI-HOOD-GRY-M',
    size: 'M',
    color: 'Grey',
    stockQuantity: 4,
    lowStockThreshold: 5,
  },
]

const orders: Order[] = [
  {
    id: 'order-100',
    status: 'pending',
    paymentStatus: 'paid',
    customer: {
      email: 'omar@example.com',
      firstName: 'Omar',
      lastName: 'Salhi',
      phone: '+15555550100',
    },
    shippingAddress: {
      line1: '10 Rue Commerce',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
    },
    items: [
      {
        color: 'Grey',
        productId: 'hoodie-001',
        name: 'Everyday Weight Hoodie',
        quantity: 2,
        size: 'M',
        unitPrice: 59.99,
        variantSku: 'OSAI-HOOD-GRY-M',
        lineTotal: 119.98,
      },
    ],
    totals: {
      subtotal: 119.98,
      shipping: 7.5,
      tax: 9.6,
      total: 137.08,
    },
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'order-200',
    status: 'shipped',
    paymentStatus: 'payment_required',
    customer: {
      email: 'maya@example.com',
      firstName: 'Maya',
      lastName: 'Stone',
    },
    shippingAddress: {
      line1: '22 Market Street',
      city: 'London',
      postalCode: 'SW1A 1AA',
      country: 'GB',
    },
    items: [
      {
        productId: 'windbreaker-001',
        name: 'Night Run Windbreaker',
        quantity: 1,
        unitPrice: 79.99,
        lineTotal: 79.99,
      },
    ],
    totals: {
      subtotal: 79.99,
      shipping: 7.5,
      tax: 6.4,
      total: 93.89,
    },
    createdAt: '2026-06-02T12:00:00.000Z',
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
    createQueryResult({ inventory }) as unknown as ReturnType<typeof useGetAdminInventoryQuery>
  )
  mockUseGetAdminUsersQuery.mockReturnValue(
    createQueryResult({ users: [] }) as unknown as ReturnType<typeof useGetAdminUsersQuery>
  )
  mockUseCreateInventoryVariantMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useCreateInventoryVariantMutation
  >)
  mockUseCreateProductMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useCreateProductMutation
  >)
  mockUseDeleteInventoryVariantMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useDeleteInventoryVariantMutation
  >)
  mockUseDeleteProductMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useDeleteProductMutation
  >)
  mockUseDeleteProductPermanentlyMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useDeleteProductPermanentlyMutation
  >)
  mockUseUploadProductImageMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useUploadProductImageMutation
  >)
  mockUseUpdateInventoryMutation.mockReturnValue([
    vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue(inventory[0]) }),
    {},
  ] as unknown as ReturnType<typeof useUpdateInventoryMutation>)
  mockUseUpdateOrderStatusMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useUpdateOrderStatusMutation
  >)
  mockUseUpdateProductMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useUpdateProductMutation
  >)
  mockUseUpdateProductStatusMutation.mockReturnValue([vi.fn(), {}] as unknown as ReturnType<
    typeof useUpdateProductStatusMutation
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

  it('filters orders and opens order details without stretching the dashboard', () => {
    const updateOrderStatus = vi.fn()
    mockUseGetAdminOrdersQuery.mockReturnValue(
      createQueryResult({ orders }) as unknown as ReturnType<typeof useGetAdminOrdersQuery>
    )
    mockUseUpdateOrderStatusMutation.mockReturnValue([
      updateOrderStatus,
      {},
    ] as unknown as ReturnType<typeof useUpdateOrderStatusMutation>)

    renderWithProviders(<AdminDashboardPage />, {
      preloadedAuth: { token: 'test-token', user: adminUser },
    })

    expect(screen.getByText('Showing 2 of 2 matching orders')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search order, email, customer, city, or item'), {
      target: { value: 'omar' },
    })
    fireEvent.change(screen.getByDisplayValue('All statuses'), {
      target: { value: 'pending' },
    })

    expect(screen.getByText('order-100')).toBeInTheDocument()
    expect(screen.queryByText('order-200')).not.toBeInTheDocument()

    const orderRow = screen.getByText('order-100').closest('tr')
    expect(orderRow).not.toBeNull()
    fireEvent.click(
      within(orderRow as HTMLTableRowElement).getByRole('button', { name: 'Details' })
    )

    const orderDrawer = screen.getByRole('dialog', { name: 'order-100' })
    expect(orderDrawer).toBeInTheDocument()
    expect(within(orderDrawer).getByText('10 Rue Commerce')).toBeInTheDocument()
    expect(within(orderDrawer).getByText('Everyday Weight Hoodie')).toBeInTheDocument()
    expect(within(orderDrawer).getByText('M / Grey')).toBeInTheDocument()
    expect(within(orderDrawer).getByText(/OSAI-HOOD-GRY-M/)).toBeInTheDocument()

    fireEvent.change(within(orderDrawer).getByDisplayValue('pending'), {
      target: { value: 'shipped' },
    })

    expect(updateOrderStatus).toHaveBeenCalledWith({
      orderId: 'order-100',
      status: 'shipped',
    })
  })

  it('filters admin products by search, category, and stock state', () => {
    mockUseGetAdminProductsQuery.mockReturnValue(
      createQueryResult({
        products: [
          products[0],
          {
            id: 'windbreaker-001',
            name: 'Night Run Windbreaker',
            description: 'Lightweight shell',
            price: 79.99,
            imageUrl: 'windbreaker.jpg',
            category: 'outerwear',
          },
        ],
      }) as unknown as ReturnType<typeof useGetAdminProductsQuery>
    )
    mockUseGetAdminInventoryQuery.mockReturnValue(
      createQueryResult({
        inventory: [
          inventory[0],
          {
            product: {
              id: 'windbreaker-001',
              name: 'Night Run Windbreaker',
              description: 'Lightweight shell',
              price: 79.99,
              imageUrl: 'windbreaker.jpg',
              category: 'outerwear',
            },
            sku: 'OSAI-WIND-BLK-M',
            size: 'M',
            color: 'Black',
            stockQuantity: 0,
            lowStockThreshold: 5,
          },
        ],
      }) as unknown as ReturnType<typeof useGetAdminInventoryQuery>
    )

    renderWithProviders(<AdminDashboardPage />, {
      preloadedAuth: { token: 'test-token', user: adminUser },
    })

    fireEvent.change(screen.getByPlaceholderText('Search product, id, category, or copy'), {
      target: { value: 'wind' },
    })
    fireEvent.change(screen.getByDisplayValue('All categories'), {
      target: { value: 'outerwear' },
    })
    fireEvent.change(screen.getByDisplayValue('All stock'), {
      target: { value: 'sold_out' },
    })

    expect(screen.getByText('Night Run Windbreaker')).toBeInTheDocument()
    expect(screen.queryByText('Everyday Weight Hoodie')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 2 products')).toBeInTheDocument()
  })

  it('creates products with an initial size and color variant matrix', () => {
    const createProduct = vi
      .fn()
      .mockReturnValue({ unwrap: vi.fn().mockResolvedValue(products[0]) })
    mockUseCreateProductMutation.mockReturnValue([createProduct, {}] as unknown as ReturnType<
      typeof useCreateProductMutation
    >)

    renderWithProviders(<AdminDashboardPage />, {
      preloadedAuth: { token: 'test-token', user: adminUser },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add product' }))
    const dialog = screen.getByRole('dialog', { name: 'Add product' })

    fireEvent.change(within(dialog).getByPlaceholderText('Oversized tee'), {
      target: { value: 'Matrix Hoodie' },
    })
    fireEvent.change(within(dialog).getByPlaceholderText('Short product description'), {
      target: { value: 'Matrix-ready hoodie' },
    })
    fireEvent.change(within(dialog).getByPlaceholderText('39.00'), {
      target: { value: '64.99' },
    })
    fireEvent.change(within(dialog).getByPlaceholderText('https://example.com/product.jpg'), {
      target: { value: 'https://example.com/matrix-hoodie.jpg' },
    })
    fireEvent.change(within(dialog).getByPlaceholderText('OSAI-TEE'), {
      target: { value: 'OSAI-MATRIX' },
    })
    fireEvent.change(within(dialog).getByLabelText('Sizes'), {
      target: { value: 'M' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add size' }))
    fireEvent.change(within(dialog).getByLabelText('Sizes'), {
      target: { value: 'L' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add size' }))
    fireEvent.change(within(dialog).getByLabelText('Colors'), {
      target: { value: 'Black' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add color' }))
    fireEvent.change(within(dialog).getByLabelText('Colors'), {
      target: { value: 'Grey' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add color' }))
    fireEvent.change(within(dialog).getByPlaceholderText('0'), {
      target: { value: '10' },
    })
    fireEvent.change(within(dialog).getByPlaceholderText('5'), {
      target: { value: '3' },
    })

    expect(within(dialog).getByText('4 initial variants will be created.')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add product' }))

    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: 'https://example.com/matrix-hoodie.jpg',
        name: 'Matrix Hoodie',
        price: 64.99,
        variants: [
          {
            color: 'Black',
            lowStockThreshold: 3,
            size: 'M',
            sku: 'OSAI-MATRIX-M-BLACK',
            stockQuantity: 10,
          },
          {
            color: 'Grey',
            lowStockThreshold: 3,
            size: 'M',
            sku: 'OSAI-MATRIX-M-GREY',
            stockQuantity: 10,
          },
          {
            color: 'Black',
            lowStockThreshold: 3,
            size: 'L',
            sku: 'OSAI-MATRIX-L-BLACK',
            stockQuantity: 10,
          },
          {
            color: 'Grey',
            lowStockThreshold: 3,
            size: 'L',
            sku: 'OSAI-MATRIX-L-GREY',
            stockQuantity: 10,
          },
        ],
      })
    )
  })

  it('shows stock on products and edits inventory from the product detail drawer', () => {
    const updateInventory = vi.fn()
    const createInventoryVariant = vi.fn()
    const deleteInventoryVariant = vi.fn()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockUseCreateInventoryVariantMutation.mockReturnValue([
      createInventoryVariant,
      {},
    ] as unknown as ReturnType<typeof useCreateInventoryVariantMutation>)
    mockUseDeleteInventoryVariantMutation.mockReturnValue([
      deleteInventoryVariant,
      {},
    ] as unknown as ReturnType<typeof useDeleteInventoryVariantMutation>)
    mockUseUpdateInventoryMutation.mockReturnValue([updateInventory, {}] as unknown as ReturnType<
      typeof useUpdateInventoryMutation
    >)

    renderWithProviders(<AdminDashboardPage />, {
      preloadedAuth: { token: 'test-token', user: adminUser },
    })

    expect(screen.getByText('15 in stock')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Details' }))

    expect(screen.getByRole('dialog', { name: 'Everyday Weight Hoodie' })).toBeInTheDocument()
    expect(screen.getByText('OSAI-HOOD-GRY-M')).toBeInTheDocument()
    expect(screen.getByText('M / Grey')).toBeInTheDocument()

    const variantCard = screen.getByTestId('inventory-variant-OSAI-HOOD-GRY-M')
    fireEvent.change(within(variantCard).getByDisplayValue('4'), {
      target: { value: '9' },
    })
    fireEvent.change(within(variantCard).getByDisplayValue('5'), {
      target: { value: '2' },
    })
    fireEvent.click(within(variantCard).getByRole('button', { name: 'Save' }))

    expect(updateInventory).toHaveBeenCalledWith({
      lowStockThreshold: 2,
      sku: 'OSAI-HOOD-GRY-M',
      stockQuantity: 9,
    })

    fireEvent.change(screen.getByPlaceholderText('OSAI-HOOD'), {
      target: { value: 'OSAI-HOOD' },
    })
    fireEvent.change(screen.getByLabelText('Sizes'), {
      target: { value: 'L' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add size' }))
    fireEvent.change(screen.getByLabelText('Sizes'), {
      target: { value: 'XL' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add size' }))
    fireEvent.change(screen.getByLabelText('Colors'), {
      target: { value: 'Black' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    fireEvent.change(screen.getByLabelText('Colors'), {
      target: { value: 'White' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    fireEvent.change(screen.getAllByDisplayValue('0').at(-1) as HTMLElement, {
      target: { value: '6' },
    })
    fireEvent.change(screen.getAllByDisplayValue('5').at(-1) as HTMLElement, {
      target: { value: '3' },
    })
    expect(screen.getByText('4 new variants ready to add.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add variants' }))

    expect(createInventoryVariant).toHaveBeenCalledTimes(4)
    expect(createInventoryVariant).toHaveBeenNthCalledWith(1, {
      color: 'Black',
      lowStockThreshold: 3,
      productId: 'hoodie-001',
      size: 'L',
      sku: 'OSAI-HOOD-L-BLACK',
      stockQuantity: 6,
    })
    expect(createInventoryVariant).toHaveBeenNthCalledWith(4, {
      color: 'White',
      lowStockThreshold: 3,
      productId: 'hoodie-001',
      size: 'XL',
      sku: 'OSAI-HOOD-XL-WHITE',
      stockQuantity: 6,
    })

    fireEvent.click(within(variantCard).getByRole('button', { name: 'Remove' }))

    expect(confirm).toHaveBeenCalledWith('Remove inventory variant OSAI-HOOD-GRY-M?')
    expect(deleteInventoryVariant).toHaveBeenCalledWith('OSAI-HOOD-GRY-M')

    confirm.mockRestore()
  })

  it('loads product values into the main editor before saving changes', async () => {
    const createInventoryVariant = vi.fn()
    const updateProduct = vi
      .fn()
      .mockReturnValue({ unwrap: vi.fn().mockResolvedValue(products[0]) })
    const updateInventory = vi
      .fn()
      .mockReturnValue({ unwrap: vi.fn().mockResolvedValue(inventory[0]) })
    mockUseCreateInventoryVariantMutation.mockReturnValue([
      createInventoryVariant,
      {},
    ] as unknown as ReturnType<typeof useCreateInventoryVariantMutation>)
    mockUseUpdateProductMutation.mockReturnValue([updateProduct, {}] as unknown as ReturnType<
      typeof useUpdateProductMutation
    >)
    mockUseUpdateInventoryMutation.mockReturnValue([updateInventory, {}] as unknown as ReturnType<
      typeof useUpdateInventoryMutation
    >)

    renderWithProviders(<AdminDashboardPage />, {
      preloadedAuth: { token: 'test-token', user: adminUser },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit Everyday Weight Hoodie' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Product ID')).toBeInTheDocument()
    expect(screen.getByText('hoodie-001')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('New SKU prefix')).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('Everyday Weight Hoodie'), {
      target: { value: 'Everyday Weight Hoodie V2' },
    })
    fireEvent.change(screen.getByDisplayValue('59.99'), {
      target: { value: '54.99' },
    })
    fireEvent.change(screen.getByDisplayValue('79.99'), {
      target: { value: '79.99' },
    })
    fireEvent.change(screen.getByDisplayValue('4'), {
      target: { value: '7' },
    })
    fireEvent.change(screen.getByDisplayValue('hoodies'), {
      target: { value: 'outerwear' },
    })
    fireEvent.change(screen.getByDisplayValue('6 ft'), {
      target: { value: '5 ft 10 in' },
    })
    fireEvent.change(screen.getByDisplayValue('M'), {
      target: { value: 'L' },
    })
    fireEvent.change(screen.getByDisplayValue('Original fit copy'), {
      target: { value: 'Updated fit copy' },
    })
    fireEvent.change(screen.getByDisplayValue('Original material copy'), {
      target: { value: 'Updated material copy' },
    })
    fireEvent.change(screen.getByDisplayValue('Original care copy'), {
      target: { value: 'Updated care copy' },
    })
    fireEvent.change(screen.getByDisplayValue('Original story copy'), {
      target: { value: 'Updated story copy' },
    })
    fireEvent.change(screen.getByDisplayValue('Original question one?'), {
      target: { value: 'Updated question one?' },
    })
    fireEvent.change(screen.getByDisplayValue('Original answer one.'), {
      target: { value: 'Updated answer one.' },
    })
    fireEvent.change(within(dialog).getByLabelText('New SKU prefix'), {
      target: { value: 'OSAI-HOOD' },
    })
    fireEvent.change(within(dialog).getByLabelText('Sizes'), {
      target: { value: 'L' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add size' }))
    fireEvent.change(within(dialog).getByLabelText('Sizes'), {
      target: { value: 'XL' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add size' }))
    fireEvent.change(within(dialog).getByLabelText('Colors'), {
      target: { value: 'Black' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add color' }))
    fireEvent.change(within(dialog).getByLabelText('New variant stock'), {
      target: { value: '6' },
    })
    fireEvent.change(within(dialog).getByLabelText('New variant low alert'), {
      target: { value: '2' },
    })
    expect(within(dialog).getByText('2 new variants will be added.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(updateProduct).toHaveBeenCalledWith({
      productId: 'hoodie-001',
      updates: expect.objectContaining({
        careInstructions: 'Updated care copy',
        category: 'outerwear',
        compareAtPrice: 79.99,
        fitDescription: 'Updated fit copy',
        materialDescription: 'Updated material copy',
        modelHeight: '5 ft 10 in',
        modelSize: 'L',
        name: 'Everyday Weight Hoodie V2',
        price: 54.99,
        productQuestions: [
          { question: 'Updated question one?', answer: 'Updated answer one.' },
          { question: 'Original question two?', answer: 'Original answer two.' },
        ],
        productStory: 'Updated story copy',
      }),
    })
    await waitFor(() => {
      expect(updateInventory).toHaveBeenCalledWith({
        lowStockThreshold: 5,
        productId: 'hoodie-001',
        stockQuantity: 7,
      })
    })
    expect(createInventoryVariant).toHaveBeenCalledTimes(2)
    expect(createInventoryVariant).toHaveBeenNthCalledWith(1, {
      color: 'Black',
      lowStockThreshold: 2,
      productId: 'hoodie-001',
      size: 'L',
      sku: 'OSAI-HOOD-L-BLACK',
      stockQuantity: 6,
    })
    expect(createInventoryVariant).toHaveBeenNthCalledWith(2, {
      color: 'Black',
      lowStockThreshold: 2,
      productId: 'hoodie-001',
      size: 'XL',
      sku: 'OSAI-HOOD-XL-BLACK',
      stockQuantity: 6,
    })
  })

  it('shows archived products and lets admins publish them again', () => {
    const updateProductStatus = vi
      .fn()
      .mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ ...products[0], isActive: true }) })
    mockUseGetAdminProductsQuery.mockReturnValue(
      createQueryResult({
        products: [
          products[0],
          {
            ...products[0],
            id: 'archived-hoodie-001',
            name: 'Archived Hoodie',
            isActive: false,
          },
        ],
      }) as unknown as ReturnType<typeof useGetAdminProductsQuery>
    )
    mockUseUpdateProductStatusMutation.mockReturnValue([
      updateProductStatus,
      {},
    ] as unknown as ReturnType<typeof useUpdateProductStatusMutation>)

    renderWithProviders(<AdminDashboardPage />, {
      preloadedAuth: { token: 'test-token', user: adminUser },
    })

    expect(screen.getByRole('tab', { name: 'All 2' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Published 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Archived 1' })).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Archived 1' }))

    expect(screen.getByText('Archived Hoodie')).toBeInTheDocument()
    expect(screen.queryByText('Everyday Weight Hoodie')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(updateProductStatus).toHaveBeenCalledWith({
      productId: 'archived-hoodie-001',
      isActive: true,
    })
  })

  it('keeps permanent deletion separate from archive and confirms first', () => {
    const deleteProductPermanently = vi.fn()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)

    mockUseDeleteProductPermanentlyMutation.mockReturnValue([
      deleteProductPermanently,
      {},
    ] as unknown as ReturnType<typeof useDeleteProductPermanentlyMutation>)

    renderWithProviders(<AdminDashboardPage />, {
      preloadedAuth: { token: 'test-token', user: adminUser },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Delete forever' }))

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Everyday Weight Hoodie'))
    expect(deleteProductPermanently).toHaveBeenCalledWith('hoodie-001')

    confirm.mockRestore()
  })
})
