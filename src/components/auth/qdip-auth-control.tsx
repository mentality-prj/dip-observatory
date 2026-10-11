'use client'

import { LogIn, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

import { PLATFORM_URLS, type PlatformLocale } from '@/lib/platform-urls'
import styles from './qdip-auth-control.module.css'

type AuthSession = {
  configured: boolean
  authenticated: boolean
  studio: boolean
  operator: boolean
}

const labels = {
  en: { signIn: 'Sign in', signOut: 'Sign out', signedIn: 'Signed in', signOutFailed: 'Could not sign out' },
  uk: { signIn: 'Увійти', signOut: 'Вийти', signedIn: 'Ви увійшли', signOutFailed: 'Не вдалося вийти' },
  pl: {
    signIn: 'Zaloguj się',
    signOut: 'Wyloguj się',
    signedIn: 'Zalogowano',
    signOutFailed: 'Nie udało się wylogować',
  },
} as const

function loginHref(returnTo: string) {
  const url = new URL('/api/auth/login', PLATFORM_URLS.site)
  url.searchParams.set('return_to', returnTo)
  return url.toString()
}

/** Only public session flags are read; roles and tokens are never stored in browser state. */
export function QdipAuthControl({ locale, returnTo }: { locale: PlatformLocale; returnTo: string }) {
  const copy = labels[locale]
  const [session, setSession] = useState<AuthSession | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal })
      .then(async (response): Promise<AuthSession | null> => (response.ok ? response.json() : null))
      .then((value) => {
        if (!controller.signal.aborted) setSession(value)
      })
      .catch(() => {
        // A failed session check must not prevent the user from reaching login.
      })
    return () => controller.abort()
  }, [])

  async function signOut() {
    if (signingOut) return
    setSigningOut(true)
    setError(false)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Logout failed')
      setSession(null)
      // Refresh privileged surfaces so no stale operator view remains on screen.
      window.location.reload()
    } catch {
      setError(true)
    } finally {
      setSigningOut(false)
    }
  }

  if (session?.authenticated) {
    return (
      <div className={styles.authControl} data-qdip-auth="signed-in">
        <span className={styles.signedIn}>{copy.signedIn}</span>
        <button
          className={styles.action}
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
          aria-label={copy.signOut}
        >
          <LogOut size={16} aria-hidden />
          <span>{copy.signOut}</span>
        </button>
        {error ? (
          <span className={styles.error} role="alert">
            {copy.signOutFailed}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <a className={styles.action} data-qdip-auth="signed-out" href={loginHref(returnTo)}>
      <LogIn size={16} aria-hidden />
      <span>{copy.signIn}</span>
    </a>
  )
}
