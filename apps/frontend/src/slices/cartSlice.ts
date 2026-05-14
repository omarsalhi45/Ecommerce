import { type PayloadAction, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { CartSummary, Product } from '../types'

export interface CartItem {
  productId: string
  quantity: number
}

interface CartState {
  items: CartItem[]
}

const initialState: CartState = {
  items: [],
}

const TAX_RATE = 0.08
const SHIPPING_RATE = 7.5

const roundMoney = (value: number): number => Math.round(value * 100) / 100

export const calculateCartSummary = (
  items: CartItem[],
  products: Product[],
  rates = { shipping: SHIPPING_RATE, tax: TAX_RATE }
): CartSummary => {
  const subtotal = items.reduce((total, item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    return total + (product?.price ?? 0) * item.quantity
  }, 0)
  const shipping = subtotal > 0 ? rates.shipping : 0
  const tax = roundMoney(subtotal * rates.tax)

  return {
    subtotal: roundMoney(subtotal),
    shipping,
    tax,
    total: roundMoney(subtotal + shipping + tax),
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<{ productId: string }>) {
      const existing = state.items.find((item) => item.productId === action.payload.productId)
      if (existing) {
        existing.quantity += 1
      } else {
        state.items.push({ productId: action.payload.productId, quantity: 1 })
      }
    },
    removeItem(state, action: PayloadAction<{ productId: string }>) {
      state.items = state.items.filter((item) => item.productId !== action.payload.productId)
    },
    decrementItem(state, action: PayloadAction<{ productId: string }>) {
      const existing = state.items.find((item) => item.productId === action.payload.productId)
      if (existing) {
        existing.quantity -= 1
        if (existing.quantity <= 0) {
          state.items = state.items.filter((item) => item.productId !== action.payload.productId)
        }
      }
    },
    clearCart(state) {
      state.items = []
    },
  },
})

export const { addItem, removeItem, decrementItem, clearCart } = cartSlice.actions
export const selectCartItems = (state: RootState) => state.cart.items
export const selectCartItemCount = (state: RootState) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0)
export default cartSlice.reducer
