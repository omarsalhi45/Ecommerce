import { type PayloadAction, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { CartSummary, Product } from '../types'

export interface CartItem {
  productId: string
  quantity: number
  variantSku?: string
  size?: string
  color?: string
}

interface CartState {
  items: CartItem[]
}

type CartItemIdentity = Pick<CartItem, 'productId' | 'variantSku'>
type AddCartItemPayload = CartItemIdentity & Pick<CartItem, 'size' | 'color'>

const initialState: CartState = {
  items: [],
}

const TAX_RATE = 0.08
const SHIPPING_RATE = 7.5
export const FREE_SHIPPING_THRESHOLD = 100

const roundMoney = (value: number): number => Math.round(value * 100) / 100
const sameCartLine = (item: CartItem, identity: CartItemIdentity) =>
  item.productId === identity.productId && (item.variantSku ?? '') === (identity.variantSku ?? '')

export const getCartLineKey = (item: CartItem): string =>
  item.variantSku ? `${item.productId}:${item.variantSku}` : item.productId

export const calculateCartSummary = (
  items: CartItem[],
  products: Product[],
  rates = {
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    shipping: SHIPPING_RATE,
    tax: TAX_RATE,
  }
): CartSummary => {
  const subtotal = items.reduce((total, item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    return total + (product?.price ?? 0) * item.quantity
  }, 0)
  const shipping = subtotal > 0 && subtotal < rates.freeShippingThreshold ? rates.shipping : 0
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
    addItem(state, action: PayloadAction<AddCartItemPayload>) {
      const existing = state.items.find((item) => sameCartLine(item, action.payload))
      if (existing) {
        existing.quantity += 1
      } else {
        state.items.push({ ...action.payload, quantity: 1 })
      }
    },
    removeItem(state, action: PayloadAction<CartItemIdentity>) {
      state.items = state.items.filter((item) => !sameCartLine(item, action.payload))
    },
    decrementItem(state, action: PayloadAction<CartItemIdentity>) {
      const existing = state.items.find((item) => sameCartLine(item, action.payload))
      if (existing) {
        existing.quantity -= 1
        if (existing.quantity <= 0) {
          state.items = state.items.filter((item) => !sameCartLine(item, action.payload))
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
