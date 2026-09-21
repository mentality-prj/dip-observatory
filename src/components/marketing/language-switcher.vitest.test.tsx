import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LanguageSwitcher } from './language-switcher'

describe('LanguageSwitcher', () => {
  it('renders every supported locale and marks the active locale', () => {
    render(<LanguageSwitcher locale="en" hrefForLocale={(locale) => `/${locale}`} />)

    expect(screen.getByRole('navigation', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'UA' })).toHaveAttribute('href', '/uk')
    expect(screen.getByRole('link', { name: 'PL' })).toHaveAttribute('href', '/pl')
  })

  it('keeps locale URL generation behind the injected routing contract', async () => {
    const hrefForLocale = vi.fn((locale: 'en' | 'uk' | 'pl') => `/${locale}/use-cases`)
    const user = userEvent.setup()
    render(<LanguageSwitcher locale="en" hrefForLocale={hrefForLocale} />)

    await user.click(screen.getByRole('link', { name: 'UA' }))
    expect(hrefForLocale).toHaveBeenCalledWith('uk')
  })
})
