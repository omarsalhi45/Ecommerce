import { describe, expect, it } from 'vitest'
import cartReducer, {
  addItem,
  calculateCartSummary,
  clearCart,
  decrementItem,
  removeItem,
  selectCartItemCount,
  selectCartItems,
} from './cartSlice'

describe('cartSlice', () => {
  it('adds a new item with quantity 1', () => {
    const state = cartReducer(undefined, addItem({ productId: 'shirt-001' }))

    expect(state.items).toEqual([{ productId: 'shirt-001', quantity: 1 }])
  })

  it('increments an existing item quantity', () => {
    const firstState = cartReducer(undefined, addItem({ productId: 'shirt-001' }))
    const secondState = cartReducer(firstState, addItem({ productId: 'shirt-001' }))

    expect(secondState.items).toEqual([{ productId: 'shirt-001', quantity: 2 }])
  })

  it('keeps different product variants as separate cart lines', () => {
    const mediumState = cartReducer(
      undefined,
      addItem({
        productId: 'hoodie-001',
        variantSku: 'hoodie-001-black-m',
        size: 'M',
        color: 'Black',
      })
    )
    const largeState = cartReducer(
      mediumState,
      addItem({
        productId: 'hoodie-001',
        variantSku: 'hoodie-001-black-l',
        size: 'L',
        color: 'Black',
      })
    )

    expect(largeState.items).toEqual([
      {
        productId: 'hoodie-001',
        variantSku: 'hoodie-001-black-m',
        size: 'M',
        color: 'Black',
        quantity: 1,
      },
      {
        productId: 'hoodie-001',
        variantSku: 'hoodie-001-black-l',
        size: 'L',
        color: 'Black',
        quantity: 1,
      },
    ])
  })

  it('decrements an item and removes it when quantity reaches zero', () => {
    const addedState = cartReducer(undefined, addItem({ productId: 'shirt-001' }))
    const removedState = cartReducer(addedState, decrementItem({ productId: 'shirt-001' }))

    expect(removedState.items).toEqual([])
  })

  it('removes and clears cart items', () => {
    const shirtState = cartReducer(undefined, addItem({ productId: 'shirt-001' }))
    const jacketState = cartReducer(shirtState, addItem({ productId: 'jacket-001' }))
    const removedState = cartReducer(jacketState, removeItem({ productId: 'shirt-001' }))
    const clearedState = cartReducer(removedState, clearCart())

    expect(removedState.items).toEqual([{ productId: 'jacket-001', quantity: 1 }])
    expect(clearedState.items).toEqual([])
  })

  it('selects cart items and total quantity', () => {
    const shirtState = cartReducer(undefined, addItem({ productId: 'shirt-001' }))
    const finalState = cartReducer(shirtState, addItem({ productId: 'shirt-001' }))
    const rootState = { cart: finalState } as Parameters<typeof selectCartItemCount>[0]

    expect(selectCartItems(rootState)).toEqual([{ productId: 'shirt-001', quantity: 2 }])
    expect(selectCartItemCount(rootState)).toBe(2)
  })

  it('calculates subtotal, shipping, tax, and total', () => {
    const summary = calculateCartSummary(
      [
        { productId: 'shirt-001', quantity: 2 },
        { productId: 'hoodie-001', quantity: 1 },
      ],
      [
        {
          id: 'shirt-001',
          name: 'Box Fit Street Tee',
          description: 'Heavy tee',
          price: 29.99,
          imageUrl: 'shirt.jpg',
          category: 'clothes',
        },
        {
          id: 'hoodie-001',
          name: 'Everyday Weight Hoodie',
          description: 'Soft hoodie',
          price: 59.99,
          imageUrl: 'hoodie.jpg',
          category: 'clothes',
        },
      ]
    )

    expect(summary).toEqual({
      subtotal: 119.97,
      shipping: 0,
      tax: 9.6,
      total: 129.57,
    })
  })
})
