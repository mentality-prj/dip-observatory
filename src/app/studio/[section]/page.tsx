import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { DecisionStudio, parseStudioLocale } from '@/features/studio'
import { studioHref } from '@/lib/platform-urls'

function isStudioSurfaceHost(host: string) {
  const hostname = host.split(':')[0].toLowerCase()
  return hostname === 'studio.qdip.ai' || hostname.startsWith('studio.')
}

export default async function StudioPage({ params }: { params: Promise<{ section: string }> }) {
  const [{ section }, requestHeaders] = await Promise.all([params, headers()])

  if (['constraints', 'policies', 'compliance'].includes(section)) {
    const locale = parseStudioLocale(requestHeaders.get('x-qdip-studio-locale'))
    const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? ''
    redirect(isStudioSurfaceHost(host) ? `/${locale}/profiles` : studioHref('profiles', locale))
  }

  if (!['profiles', 'plugins', 'dimensions', 'bindings'].includes(section)) notFound()
  return <DecisionStudio section={section} />
}
