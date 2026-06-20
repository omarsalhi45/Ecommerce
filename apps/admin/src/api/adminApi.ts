import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { frontendConfig } from '../config'
import type {
  AdminAnalytics,
  InventoryItem,
  Order,
  Product,
  ProductImageUploadResponse,
  User,
} from '../types'

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: frontendConfig.apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth?: { token?: string } }).auth?.token

      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }

      return headers
    },
  }),
  tagTypes: ['AdminOrders', 'AdminInventory', 'AdminProducts'],
  endpoints: (builder) => ({
    getAdminAnalytics: builder.query<AdminAnalytics, void>({
      query: () => '/admin/analytics',
    }),
    getAdminOrders: builder.query<{ orders: Order[] }, void>({
      query: () => '/admin/orders',
      providesTags: ['AdminOrders'],
    }),
    updateOrderStatus: builder.mutation<Order, { orderId: string; status: Order['status'] }>({
      query: ({ orderId, status }) => ({
        url: `/admin/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['AdminOrders'],
    }),
    getAdminProducts: builder.query<{ products: Product[] }, void>({
      query: () => '/admin/products',
      providesTags: ['AdminProducts'],
    }),
    createProduct: builder.mutation<
      Product,
      Omit<Product, 'id' | 'variants'> & {
        id?: string
        sku?: string
        stockQuantity?: number
        lowStockThreshold?: number
        variants?: Array<{
          color?: string
          lowStockThreshold?: number
          size?: string
          sku: string
          stockQuantity?: number
        }>
      }
    >({
      query: (body) => ({
        url: '/admin/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminProducts', 'AdminInventory'],
    }),
    updateProduct: builder.mutation<
      Product,
      {
        productId: string
        updates: Partial<
          Pick<
            Product,
            'category' | 'compareAtPrice' | 'description' | 'imageUrl' | 'name' | 'price'
          >
        > & {
          careInstructions?: string | null
          fitDescription?: string | null
          materialDescription?: string | null
          modelHeight?: string | null
          modelSize?: string | null
          productQuestions?: Product['productQuestions'] | null
          productStory?: string | null
        }
      }
    >({
      query: ({ productId, updates }) => ({
        url: `/admin/products/${productId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['AdminProducts', 'AdminInventory'],
    }),
    updateProductStatus: builder.mutation<
      Product,
      {
        productId: string
        isActive: boolean
      }
    >({
      query: ({ productId, isActive }) => ({
        url: `/admin/products/${productId}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['AdminProducts', 'AdminInventory'],
    }),
    uploadProductImage: builder.mutation<ProductImageUploadResponse, File>({
      query: (image) => {
        const body = new FormData()
        body.append('image', image)

        return {
          url: '/admin/uploads/product-image',
          method: 'POST',
          body,
        }
      },
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (productId) => ({
        url: `/admin/products/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminProducts', 'AdminInventory'],
    }),
    deleteProductPermanently: builder.mutation<void, string>({
      query: (productId) => ({
        url: `/admin/products/${productId}/permanent`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminProducts', 'AdminInventory'],
    }),
    getAdminInventory: builder.query<{ inventory: InventoryItem[] }, void>({
      query: () => '/admin/inventory',
      providesTags: ['AdminInventory'],
    }),
    createInventoryVariant: builder.mutation<
      InventoryItem,
      {
        productId: string
        sku: string
        size?: string
        color?: string
        stockQuantity?: number
        lowStockThreshold?: number
      }
    >({
      query: ({ productId, ...body }) => ({
        url: `/admin/products/${productId}/inventory`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminProducts', 'AdminInventory'],
    }),
    updateInventory: builder.mutation<
      InventoryItem,
      {
        productId?: string
        sku?: string
        stockQuantity?: number
        lowStockThreshold?: number
      }
    >({
      query: ({ productId, sku, stockQuantity, lowStockThreshold }) => ({
        url: sku
          ? `/admin/inventory/sku/${encodeURIComponent(sku)}`
          : `/admin/inventory/${productId}`,
        method: 'PATCH',
        body: { lowStockThreshold, stockQuantity },
      }),
      invalidatesTags: ['AdminInventory'],
    }),
    deleteInventoryVariant: builder.mutation<void, string>({
      query: (sku) => ({
        url: `/admin/inventory/sku/${encodeURIComponent(sku)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminProducts', 'AdminInventory'],
    }),
    getAdminUsers: builder.query<{ users: User[] }, void>({
      query: () => '/admin/users',
    }),
  }),
})

export const {
  useGetAdminAnalyticsQuery,
  useGetAdminInventoryQuery,
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetAdminUsersQuery,
  useCreateProductMutation,
  useCreateInventoryVariantMutation,
  useDeleteProductPermanentlyMutation,
  useDeleteProductMutation,
  useDeleteInventoryVariantMutation,
  useUploadProductImageMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
  useUpdateInventoryMutation,
  useUpdateOrderStatusMutation,
} = adminApi
