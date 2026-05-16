import { configureStore } from '@reduxjs/toolkit'
import { adminApi } from '../api/adminApi'
import { authApi } from '../api/authApi'
import authReducer from '../slices/authSlice'
import { loadPersistedAuth, savePersistedAuth } from './persistence'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  preloadedState: {
    auth: loadPersistedAuth(),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(adminApi.middleware, authApi.middleware),
})

store.subscribe(() => {
  const state = store.getState()
  savePersistedAuth(state.auth)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
