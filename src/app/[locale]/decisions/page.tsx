import { notFound } from 'next/navigation'

import { DecisionAuditView } from '@/features/studio'
import { QdipAccessGate } from '@/components/auth/qdip-access-gate'
import { isSupportedLocale } from '@/lib/observatory-i18n'
import { cookies } from 'next/headers'
import { getQdipSession, QDIP_SESSION_COOKIE } from '@/lib/qdip-oidc'
import { observatoryHref } from '@/lib/platform-urls'

export default async function DecisionAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ decision?: string | string[] }>
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  if (!isSupportedLocale(locale)) notFound()

  const store = await cookies()
  const authenticated = Boolean(getQdipSession(store.get(QDIP_SESSION_COOKIE)?.value))
  if (!authenticated)
    return (
      <QdipAccessGate
        locale={locale}
        role="studio"
        returnTo={observatoryHref('/decisions', locale)}
        authenticated={false}
      />
    )

  const initialId = Array.isArray(query.decision) ? query.decision[0] : query.decision
  return <DecisionAuditView locale={locale} initialId={initialId} />
}
