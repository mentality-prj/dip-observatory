import { notFound } from 'next/navigation'

import { DecisionAuditView } from '@/features/studio'
import { isSupportedLocale } from '@/lib/observatory-i18n'

export default async function DecisionAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ decision?: string | string[] }>
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  if (!isSupportedLocale(locale)) notFound()

  const initialId = Array.isArray(query.decision) ? query.decision[0] : query.decision
  return <DecisionAuditView locale={locale} initialId={initialId} />
}
