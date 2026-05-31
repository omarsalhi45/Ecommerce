import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ScrollToTop from './ScrollToTop'

describe('ScrollToTop', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
  })

  it('scrolls to the top when mounted for a route', () => {
    render(
      <MemoryRouter initialEntries={['/products/hoodie-001']}>
        <ScrollToTop />
      </MemoryRouter>
    )

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })
})
