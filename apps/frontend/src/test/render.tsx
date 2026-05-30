import { ChakraProvider } from '@chakra-ui/react'
import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import type { PropsWithChildren, ReactElement } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { ordersApi } from '../api/ordersApi'
import { productsApi } from '../api/productsApi'
import authReducer from '../slices/authSlice'
import cartReducer from '../slices/cartSlice'
import wishlistReducer from '../slices/wishlistSlice'
import { theme } from '../theme'

export const createTestStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
      [authApi.reducerPath]: authApi.reducer,
      [ordersApi.reducerPath]: ordersApi.reducer,
      [productsApi.reducerPath]: productsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        authApi.middleware,
        ordersApi.middleware,
        productsApi.middleware
      ),
  })

interface RenderWithProvidersOptions {
  initialEntries?: string[]
}

export const renderWithProviders = (
  ui: ReactElement,
  { initialEntries }: RenderWithProvidersOptions = {}
) => {
  const store = createTestStore()

  return {
    store,
    ...render(ui, {
      wrapper: ({ children }: PropsWithChildren) => (
        <Provider store={store}>
          <ChakraProvider theme={theme}>
            <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
          </ChakraProvider>
        </Provider>
      ),
    }),
  }
}
