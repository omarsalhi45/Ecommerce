import { type PayloadAction, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { User } from '../types'

export interface AuthState {
  token?: string
  user?: User
}

const initialState: AuthState = {}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token
      state.user = action.payload.user
    },
    logout(state) {
      state.token = undefined
      state.user = undefined
    },
  },
})

export const { logout, setCredentials } = authSlice.actions
export const selectAuthToken = (state: RootState) => state.auth.token
export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.token)
export default authSlice.reducer
