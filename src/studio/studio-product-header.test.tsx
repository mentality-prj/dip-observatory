import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StudioProductHeader } from './studio-product-header'

vi.mock('next/navigation', () => ({
  usePathname: () => '/studio/profiles',
  useSearchParams: () => new URLSearchParams(),
}))

describe('StudioProductHeader', () => {
  it('exposes Observatory as a visible header action', () => {
    render(<StudioProductHeader />)

    const link = screen.getByRole('link', { name: /open observatory/i })
    expect(link).toBeVisible()
    expect(link).toHaveAttribute('href', expect.stringContaining('observatory'))
    expect(link).not.toHaveClass('ds-product-switch-link')
  })
})
