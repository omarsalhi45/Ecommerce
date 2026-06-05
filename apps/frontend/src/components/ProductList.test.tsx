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
    {
      sku: 'hoodie-001-grey-l',
      size: 'L',
      color: 'Grey',
      stockQuantity: 6,
    },
  ],
}

describe('ProductList', () => {
  it('requires a quick-add variant choice when more than one option is available', () => {
    const { store } = renderWithProviders(<ProductList products={[variantProduct]} />)

    expect(screen.getByText('Best seller')).toBeInTheDocument()
    expect(screen.getByText('Low stock')).toBeInTheDocument()
    expect(screen.getByLabelText('Everyday Weight Hoodie available colors')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Choose the available options to continue.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled()
    expect(store.getState().cart.items).toEqual([])
    expect(store.getState().cartUi.isMiniCartOpen).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Select size L' }))

    expect(store.getState().cart.items).toEqual([])
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Select color Black' }))

    expect(screen.getByText('Selected: L / Black')).toBeInTheDocument()
    expect(screen.getByText('Only 4 left')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))

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

  it('makes wishlist saved state clear on product cards', () => {
    const { store } = renderWithProviders(<ProductList products={[variantProduct]} />)
    const saveButton = screen.getByRole('button', {
      name: 'Save Everyday Weight Hoodie to wishlist',
    })

    expect(saveButton).toHaveTextContent('Save')
    expect(saveButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(saveButton)

    expect(store.getState().wishlist.productIds).toEqual(['hoodie-001'])
    expect(screen.getByText('Everyday Weight Hoodie saved')).toBeInTheDocument()

    const savedButton = screen.getByRole('button', {
      name: 'Remove Everyday Weight Hoodie from wishlist',
    })

    expect(savedButton).toHaveTextContent('Saved')
    expect(savedButton).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select size L' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select color Black' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))

    expect(store.getState().wishlist.productIds).toEqual([])
    expect(store.getState().cart.items).toEqual([
      {
        productId: 'hoodie-001',
        variantSku: 'hoodie-001-black-l',
        size: 'L',
        color: 'Black',
        quantity: 1,
      },
    ])
  })
})
