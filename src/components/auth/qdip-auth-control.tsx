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

function QdipAccessIcon({ direction }: { direction: 'in' | 'out' }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={direction === 'out' ? 'translate(64 0) scale(-1 1)' : undefined}>
        {/* shackle */}
        <path d="M22 26v-6c0-7 4-11 10-11s10 4 10 11v6" />
        {/* lock body */}
        <rect x="16" y="26" width="32" height="26" rx="4" />
        {/* keypad dots */}
        <circle cx="26" cy="36" r="1.8" />
        <circle cx="32" cy="36" r="1.8" />
        <circle cx="26" cy="42" r="1.8" />
        <circle cx="32" cy="42" r="1.8" />
        {/* confirm / access mark */}
        <path d="M39 43h7" />
        <path d="m43 39 4 4-4 4" />
      </g>
    </svg>
  )
}

function loginHref(returnTo: string) {
  const url = new URL('/api/auth/login', PLATFORM_URLS.site)
  url.searchParams.set('return_to', returnTo)
  return url.toString()
}

/** Only public session flags are read; roles and tokens are never stored in browser state. */
export function QdipAuthControl({
  locale,
  returnTo,
  iconOnly = false,
}: {
  locale: PlatformLocale
  returnTo: string
  /** Marketing header can render an accessible icon-only control without changing product headers. */
  iconOnly?: boolean
}) {
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
        {!iconOnly && <span className={styles.signedIn}>{copy.signedIn}</span>}
        <button
          className={iconOnly ? `${styles.action} ${styles.iconOnly}` : styles.action}
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
          aria-label={copy.signOut}
        >
          {iconOnly ? <QdipAccessIcon direction="out" /> : <LogOut size={16} aria-hidden />}
          {!iconOnly && <span>{copy.signOut}</span>}
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
    <a
      className={iconOnly ? `${styles.action} ${styles.iconOnly}` : styles.action}
      data-qdip-auth="signed-out"
      href={loginHref(returnTo)}
      aria-label={copy.signIn}
      title={copy.signIn}
    >
      {iconOnly ? <QdipAccessIcon direction="in" /> : <LogIn size={16} aria-hidden />}
      {!iconOnly && <span>{copy.signIn}</span>}
    </a>
  )
}
