import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LanguageSwitcher } from './language-switcher'

describe('LanguageSwitcher', () => {
  it('renders every supported locale and marks the active locale', () => {
    render(<LanguageSwitcher locale="en" hrefForLocale={(locale) => `/${locale}`} />)

    const desktop = screen.getByRole('navigation', { name: 'Language' })
    expect(desktop).toBeInTheDocument()
    expect(within(desktop).getByRole('link', { name: 'EN' })).toHaveAttribute('aria-current', 'page')
    expect(within(desktop).getByRole('link', { name: 'UA' })).toHaveAttribute('href', '/uk')
    expect(within(desktop).getByRole('link', { name: 'PL' })).toHaveAttribute('href', '/pl')
    expect(screen.getByText('EN', { selector: 'summary' })).toHaveAttribute('aria-label', 'Language')
  })

  it('keeps locale URL generation behind the injected routing contract', async () => {
    const hrefForLocale = vi.fn((locale: 'en' | 'uk' | 'pl') => `/${locale}/use-cases`)
    const user = userEvent.setup()
    render(<LanguageSwitcher locale="en" hrefForLocale={hrefForLocale} />)

    const mobileSummary = screen.getByText('EN', { selector: 'summary' })
    await user.click(mobileSummary)
    const mobileMenu = mobileSummary.parentElement
    expect(mobileMenu).not.toBeNull()
    await user.click(within(mobileMenu as HTMLElement).getByRole('link', { name: 'UA' }))
    expect(hrefForLocale).toHaveBeenCalledWith('uk')
  })
})
