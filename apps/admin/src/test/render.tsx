import { ChakraProvider } from '@chakra-ui/react'
import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import type { PropsWithChildren, ReactElement } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { adminApi } from '../api/adminApi'
import { authApi } from '../api/authApi'
import authReducer from '../slices/authSlice'
import type { AuthState } from '../slices/authSlice'
import { theme } from '../theme'

export const createTestStore = (preloadedAuth: AuthState = {}) =>
  configureStore({
    reducer: {
      auth: authReducer,
      [adminApi.reducerPath]: adminApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    preloadedState: {
      auth: preloadedAuth,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(adminApi.middleware, authApi.middleware),
  })

interface RenderWithProvidersOptions {
  preloadedAuth?: AuthState
}

export const renderWithProviders = (
  ui: ReactElement,
  { preloadedAuth }: RenderWithProvidersOptions = {}
) => {
  const store = createTestStore(preloadedAuth)

  return {
    store,
    ...render(ui, {
      wrapper: ({ children }: PropsWithChildren) => (
        <Provider store={store}>
          <ChakraProvider theme={theme}>
            <MemoryRouter>{children}</MemoryRouter>
          </ChakraProvider>
        </Provider>
      ),
    }),
  }
}
