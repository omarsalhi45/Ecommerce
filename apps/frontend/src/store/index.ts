import { configureStore } from '@reduxjs/toolkit'
import { authApi } from '../api/authApi'
import { ordersApi } from '../api/ordersApi'
import { productsApi } from '../api/productsApi'
import authReducer from '../slices/authSlice'
import cartReducer from '../slices/cartSlice'
import wishlistReducer from '../slices/wishlistSlice'
import {
  loadPersistedAuth,
  loadPersistedCart,
  loadPersistedWishlist,
  savePersistedAuth,
  savePersistedCart,
  savePersistedWishlist,
} from './persistence'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    [authApi.reducerPath]: authApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
  },
  preloadedState: {
    auth: loadPersistedAuth(),
    cart: loadPersistedCart(),
    wishlist: loadPersistedWishlist(),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, ordersApi.middleware, productsApi.middleware),
})

store.subscribe(() => {
  const state = store.getState()
  savePersistedAuth(state.auth)
  savePersistedCart(state.cart.items)
  savePersistedWishlist(state.wishlist.productIds)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
