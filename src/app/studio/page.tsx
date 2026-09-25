import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { parseStudioLocale } from '@/features/studio'
import { studioHref } from '@/lib/platform-urls'

function isStudioSurfaceHost(host: string) {
  const hostname = host.split(':')[0].toLowerCase()
  return hostname === 'studio.qdip.ai' || hostname.startsWith('studio.')
}

export default async function StudioHome({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const [params, requestHeaders] = await Promise.all([searchParams, headers()])
  const rawQueryLocale = Array.isArray(params.lang) ? params.lang[0] : params.lang
  const locale = parseStudioLocale(requestHeaders.get('x-qdip-studio-locale') ?? rawQueryLocale)
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? ''

  redirect(isStudioSurfaceHost(host) ? `/${locale}/profiles` : studioHref('profiles', locale))
}
