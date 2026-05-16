import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { frontendConfig } from '../config'
import type { CreateCheckoutPaymentIntentResponse, CreateOrderRequest, Order } from '../types'

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
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
  endpoints: (builder) => ({
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
    }),
    createCheckoutPaymentIntent: builder.mutation<
      CreateCheckoutPaymentIntentResponse,
      CreateOrderRequest
    >({
      query: (body) => ({
        url: '/orders/payment-intent',
        method: 'POST',
        body,
      }),
    }),
    getOrder: builder.query<Order, string>({
      query: (orderId) => `/orders/${orderId}`,
    }),
  }),
})

export const { useCreateCheckoutPaymentIntentMutation, useCreateOrderMutation, useGetOrderQuery } =
  ordersApi
