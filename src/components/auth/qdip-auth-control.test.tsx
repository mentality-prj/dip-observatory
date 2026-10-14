import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { QdipAuthControl } from './qdip-auth-control'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('QDIP shared authentication control', () => {
  it('exposes the Zitadel login from Observatory without requiring a valid browser session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ configured: true, authenticated: false, studio: false, operator: false }),
      }))
    )
    render(<QdipAuthControl locale="uk" returnTo="https://observatory.qdip.ai/uk/challenges" />)

    const login = screen.getByRole('link', { name: 'Увійти' })
    const url = new URL(login.getAttribute('href')!)
    expect(url.origin).toBe('https://qdip.ai')
    expect(url.pathname).toBe('/api/auth/login')
    expect(url.searchParams.get('return_to')).toBe('https://observatory.qdip.ai/uk/challenges')
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({ cache: 'no-store' }))
    )
  })

  it('provides an explicit sign out when the signed session is authenticated', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ configured: true, authenticated: true, studio: true, operator: false }),
      }))
    )
    render(<QdipAuthControl locale="en" returnTo="https://qdip.ai/en" />)

    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeVisible()
    expect(screen.getByText('Signed in')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  it('uses the four-dot code lock for icon-only marketing sign-in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ configured: true, authenticated: false, studio: false, operator: false }),
      }))
    )
    render(<QdipAuthControl locale="uk" returnTo="https://qdip.ai/uk" iconOnly />)

    const login = screen.getByRole('link', { name: 'Увійти' })
    expect(login.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 64 64')
    expect(login.querySelectorAll('circle')).toHaveLength(4)
    expect(login.querySelector('path[d^="M22 26"]')).not.toBeNull()
    expect(login.querySelector('path[d="M9 32h32m-8-8 8 8-8 8"]')).toBeNull()
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })

  it('keeps the session if sign-out fails and offers an error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === 'POST') return { ok: false }
        return { ok: true, json: async () => ({ configured: true, authenticated: true, studio: true, operator: true }) }
      })
    )
    render(<QdipAuthControl locale="pl" returnTo="https://studio.qdip.ai/pl" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Wyloguj się' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Nie udało się wylogować')
    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }))
    expect(screen.getByRole('button', { name: 'Wyloguj się' })).toBeEnabled()
  })
})
