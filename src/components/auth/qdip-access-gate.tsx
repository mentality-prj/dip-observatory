import type { PlatformLocale } from '@/lib/platform-urls'
import { marketingHref } from '@/lib/platform-urls'
import { QdipAuthControl } from './qdip-auth-control'
import styles from './qdip-access-gate.module.css'

type Role = 'studio' | 'rr_operator'

const messages = {
  en: {
    signIn: 'Sign in to continue',
    forbidden: 'Access restricted',
    signInBody: 'This workspace requires an authenticated QDIP account.',
    forbiddenBody: 'You are signed in, but this account does not have the role required for this workspace.',
    studio: 'Studio Access',
    rr_operator: 'RR Operator',
    required: 'Required role',
    home: 'Back to QDIP',
  },
  uk: {
    signIn: 'Увійдіть, щоб продовжити',
    forbidden: 'Доступ обмежений',
    signInBody: 'Для цього робочого простору потрібен вхід через Zitadel.',
    forbiddenBody: 'Ви увійшли, але цьому обліковому запису не надано необхідної ролі.',
    studio: 'Studio Access',
    rr_operator: 'RR Operator',
    required: 'Необхідна роль',
    home: 'На головну QDIP',
  },
  pl: {
    signIn: 'Zaloguj się, aby kontynuować',
    forbidden: 'Dostęp ograniczony',
    signInBody: 'Ten obszar roboczy wymaga zalogowania przez Zitadel.',
    forbiddenBody: 'Jesteś zalogowany, ale to konto nie ma wymaganej roli.',
    studio: 'Studio Access',
    rr_operator: 'RR Operator',
    required: 'Wymagana rola',
    home: 'Wróć do QDIP',
  },
} as const

export function QdipAccessGate({
  locale,
  role,
  returnTo,
  authenticated,
}: {
  locale: PlatformLocale
  role: Role
  returnTo: string
  authenticated: boolean
}) {
  const copy = messages[locale]
  return (
    <main className={styles.gate} id="main-content" data-testid="qdip-access-gate">
      <section className={styles.panel} aria-labelledby="qdip-access-title">
        <div className={styles.brand}>QDIP</div>
        <h1 id="qdip-access-title">{authenticated ? copy.forbidden : copy.signIn}</h1>
        <p>{authenticated ? copy.forbiddenBody : copy.signInBody}</p>
        <p className={styles.requirement}>
          {copy.required}: <strong>{copy[role]}</strong>
        </p>
        <div className={styles.actions}>
          <QdipAuthControl locale={locale} returnTo={returnTo} />
          <a href={marketingHref(locale)}>{copy.home}</a>
        </div>
      </section>
    </main>
  )
}
