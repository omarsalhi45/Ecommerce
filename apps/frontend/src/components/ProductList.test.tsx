import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/render'
import type { Product } from '../types'
import ProductList from './ProductList'

const variantProduct: Product = {
  id: 'hoodie-001',
  name: 'Everyday Weight Hoodie',
  description: 'Soft fleece hoodie',
  price: 59.99,
  imageUrl: 'hoodie.jpg',
  category: 'hoodies',
  popularityScore: 95,
  variants: [
    {
      sku: 'hoodie-001-black-m',
      size: 'M',
      color: 'Black',
      stockQuantity: 8,
    },
    {
      sku: 'hoodie-001-black-l',
      size: 'L',
      color: 'Black',
      stockQuantity: 4,
    },
  ],
}

describe('ProductList', () => {
  it('requires a quick-add variant choice when more than one option is available', () => {
    const { store } = renderWithProviders(<ProductList products={[variantProduct]} />)

    expect(screen.getByText('Best seller')).toBeInTheDocument()
    expect(screen.getByText('Low stock')).toBeInTheDocument()
    expect(screen.getByLabelText('Everyday Weight Hoodie available colors')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Pick size' }))

    expect(screen.getByText('Pick a size first')).toBeInTheDocument()
    expect(store.getState().cart.items).toEqual([])
    expect(store.getState().cartUi.isMiniCartOpen).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'L' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(store.getState().cart.items).toEqual([
      {
        productId: 'hoodie-001',
        variantSku: 'hoodie-001-black-l',
        size: 'L',
        color: 'Black',
        quantity: 1,
      },
    ])
    expect(store.getState().cartUi.isMiniCartOpen).toBe(true)
  })
})
