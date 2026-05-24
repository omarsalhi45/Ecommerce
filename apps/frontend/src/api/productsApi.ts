import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { frontendConfig } from '../config'
import type { Product } from '../types'

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: frontendConfig.apiBaseUrl,
  }),
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => ({
        url: '/products',
        cache: 'no-store',
      }),
    }),
    getProduct: builder.query<Product, string>({
      query: (productId) => ({
        url: `/products/${productId}`,
        cache: 'no-store',
      }),
    }),
  }),
})

export const { useGetProductsQuery, useGetProductQuery } = productsApi
