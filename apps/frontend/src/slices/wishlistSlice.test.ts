import { describe, expect, it } from 'vitest'
import wishlistReducer, {
  addWishlistItem,
  clearWishlist,
  removeWishlistItem,
  selectIsWishlisted,
  selectWishlistCount,
  selectWishlistProductIds,
  toggleWishlistItem,
} from './wishlistSlice'

describe('wishlistSlice', () => {
  it('adds, removes, and clears wishlist items', () => {
    const addedState = wishlistReducer(undefined, addWishlistItem({ productId: 'shirt-001' }))
    const duplicateState = wishlistReducer(addedState, addWishlistItem({ productId: 'shirt-001' }))
    const removedState = wishlistReducer(
      duplicateState,
      removeWishlistItem({ productId: 'shirt-001' })
    )
    const clearedState = wishlistReducer(
      wishlistReducer(addedState, addWishlistItem({ productId: 'hoodie-001' })),
      clearWishlist()
    )

    expect(duplicateState.productIds).toEqual(['shirt-001'])
    expect(removedState.productIds).toEqual([])
    expect(clearedState.productIds).toEqual([])
  })

  it('toggles items and exposes selectors', () => {
    const addedState = wishlistReducer(undefined, toggleWishlistItem({ productId: 'shirt-001' }))
    const rootState = { wishlist: addedState } as Parameters<typeof selectWishlistCount>[0]

    expect(selectWishlistProductIds(rootState)).toEqual(['shirt-001'])
    expect(selectWishlistCount(rootState)).toBe(1)
    expect(selectIsWishlisted('shirt-001')(rootState)).toBe(true)

    const removedState = wishlistReducer(addedState, toggleWishlistItem({ productId: 'shirt-001' }))

    expect(removedState.productIds).toEqual([])
  })
})
