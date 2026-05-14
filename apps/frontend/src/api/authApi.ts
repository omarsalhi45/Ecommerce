import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { frontendConfig } from '../config'
import type { AuthResponse, User } from '../types'

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest extends LoginRequest {
  name: string
}

export const authApi = createApi({
  reducerPath: 'authApi',
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
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    getMe: builder.query<{ user: User }, void>({
      query: () => '/auth/me',
    }),
  }),
})

export const { useGetMeQuery, useLoginMutation, useRegisterMutation } = authApi
