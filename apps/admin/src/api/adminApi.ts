import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { frontendConfig } from '../config'
import type { AdminAnalytics, InventoryItem, Order, Product, User } from '../types'

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
      Product & {
        sku?: string
        stockQuantity?: number
        lowStockThreshold?: number
      }
    >({
      query: (body) => ({
        url: '/admin/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminProducts', 'AdminInventory'],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (productId) => ({
        url: `/admin/products/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminProducts', 'AdminInventory'],
    }),
    getAdminInventory: builder.query<{ inventory: InventoryItem[] }, void>({
      query: () => '/admin/inventory',
      providesTags: ['AdminInventory'],
    }),
    updateInventory: builder.mutation<InventoryItem, { productId: string; stockQuantity: number }>({
      query: ({ productId, stockQuantity }) => ({
        url: `/admin/inventory/${productId}`,
        method: 'PATCH',
        body: { stockQuantity },
      }),
      invalidatesTags: ['AdminInventory'],
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
  useDeleteProductMutation,
  useUpdateInventoryMutation,
  useUpdateOrderStatusMutation,
} = adminApi
