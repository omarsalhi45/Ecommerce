import { type PayloadAction, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../store'

interface WishlistState {
  productIds: string[]
}

const initialState: WishlistState = {
  productIds: [],
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addWishlistItem(state, action: PayloadAction<{ productId: string }>) {
      if (!state.productIds.includes(action.payload.productId)) {
        state.productIds.push(action.payload.productId)
      }
    },
    removeWishlistItem(state, action: PayloadAction<{ productId: string }>) {
      state.productIds = state.productIds.filter(
        (productId) => productId !== action.payload.productId
      )
    },
    toggleWishlistItem(state, action: PayloadAction<{ productId: string }>) {
      if (state.productIds.includes(action.payload.productId)) {
        state.productIds = state.productIds.filter(
          (productId) => productId !== action.payload.productId
        )
        return
      }

      state.productIds.push(action.payload.productId)
    },
    clearWishlist(state) {
      state.productIds = []
    },
  },
})

export const { addWishlistItem, clearWishlist, removeWishlistItem, toggleWishlistItem } =
  wishlistSlice.actions
export const selectWishlistProductIds = (state: RootState) => state.wishlist.productIds
export const selectWishlistCount = (state: RootState) => state.wishlist.productIds.length
export const selectIsWishlisted = (productId: string) => (state: RootState) =>
  state.wishlist.productIds.includes(productId)
export default wishlistSlice.reducer
