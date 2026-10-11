import { notFound } from 'next/navigation'

import { DecisionAuditView } from '@/features/studio'
import { QdipAccessGate } from '@/components/auth/qdip-access-gate'
import { isSupportedLocale } from '@/lib/observatory-i18n'
import { pageAccess } from '@/lib/qdip-page-access'
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

  const access = await pageAccess('studio')
  if (!access.allowed)
    return (
      <QdipAccessGate
        locale={locale}
        role="studio"
        returnTo={observatoryHref('/decisions', locale)}
        authenticated={access.authenticated}
      />
    )

  const initialId = Array.isArray(query.decision) ? query.decision[0] : query.decision
  return <DecisionAuditView locale={locale} initialId={initialId} />
}
