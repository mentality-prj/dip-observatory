import { notFound, redirect } from 'next/navigation'
import { PrototypeShell } from '@/features/observatory'
import { QdipAccessGate } from '@/components/auth/qdip-access-gate'
import { isSupportedLocale, type Locale } from '@/lib/observatory-i18n'
import { pageAccess } from '@/lib/qdip-page-access'
import { loginUrl } from '@/lib/qdip-oidc'
import { observatoryHref } from '@/lib/platform-urls'
import { ObservatoryDeveloperKeys } from '@/components/observatory/observatory-developer-keys'

export const dynamic = 'force-dynamic'

export default async function DeveloperApplicationsPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()
  const access = await pageAccess('observatory_admin')
  if (!access.authenticated) redirect(loginUrl(observatoryHref('/admin/apps', locale)))
  if (!access.allowed)
    return (
      <QdipAccessGate locale={locale as Locale} role="observatory_admin"
        returnTo={observatoryHref('/admin/apps', locale as Locale)} authenticated={true} />
    )
  return (
    <PrototypeShell locale={locale as Locale} activeRoute="/admin/apps">
      <ObservatoryDeveloperKeys locale={locale as Locale} />
    </PrototypeShell>
  )
}
