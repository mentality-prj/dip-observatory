import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { studioHref } from '@/lib/platform-urls'
import { parseStudioLocale } from '@/studio/studio-locale'

export default async function StudioHome() {
  const requestHeaders = await headers()
  const locale = parseStudioLocale(requestHeaders.get('x-qdip-studio-locale'))
  redirect(studioHref('profiles', locale))
}
