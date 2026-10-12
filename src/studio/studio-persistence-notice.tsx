'use client'

import { useEffect, useState } from 'react'
import type { StudioLocale } from './studio-locale'

const labels = {
  en: {
    demo: 'Public demo workspace. Edits stay in memory and disappear on reload. No Core data is exposed.',
    role: 'You are signed in, but saving is not available. Reauthenticate or contact support.',
    live: 'Authenticated workspace: profile changes are sent to QDIP Core.',
  },
  uk: {
    demo: 'Публічна демо-студія. Зміни тимчасові й зникнуть після перезавантаження. Дані Core недоступні.',
    role: 'Вхід виконано, але збереження недоступне. Увійдіть повторно або зверніться до підтримки.',
    live: 'Авторизований робочий простір: зміни профілів зберігаються в QDIP Core.',
  },
  pl: {
    demo: 'Publiczne demo Studio. Zmiany są tymczasowe i znikają po odświeżeniu. Dane Core są niedostępne.',
    role: 'Użytkownik jest zalogowany, ale zapis jest niedostępny. Zaloguj się ponownie lub skontaktuj się z pomocą.',
    live: 'Autoryzowany obszar: zmiany profili są zapisywane w QDIP Core.',
  },
} as const

export function StudioPersistenceNotice({ locale }: { locale: StudioLocale }) {
  const [state, setState] = useState<'guest' | 'no-role' | 'live'>('guest')
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/auth/session', { cache: 'no-store', signal: controller.signal })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((s: { authenticated?: boolean; studio?: boolean } | null) => {
        if (!controller.signal.aborted) setState(s?.authenticated ? 'live' : 'guest')
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  return (
    <p
      data-testid="studio-persistence-notice"
      data-mode={state}
      role="status"
      style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #cbd5e1', fontSize: '0.875rem' }}
    >
      {state === 'live' ? labels[locale].live : state === 'no-role' ? labels[locale].role : labels[locale].demo}
    </p>
  )
}
