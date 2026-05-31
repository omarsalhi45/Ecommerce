import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../store'

interface CartUiState {
  isMiniCartOpen: boolean
}

const initialState: CartUiState = {
  isMiniCartOpen: false,
}

const cartUiSlice = createSlice({
  name: 'cartUi',
  initialState,
  reducers: {
    openMiniCart(state) {
      state.isMiniCartOpen = true
    },
    closeMiniCart(state) {
      state.isMiniCartOpen = false
    },
  },
})

export const { closeMiniCart, openMiniCart } = cartUiSlice.actions
export const selectIsMiniCartOpen = (state: RootState) => state.cartUi.isMiniCartOpen
export default cartUiSlice.reducer
