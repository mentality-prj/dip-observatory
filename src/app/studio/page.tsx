import { redirect } from 'next/navigation'
import { studioHref } from '@/lib/platform-urls'
import { parseStudioLocale } from '@/studio/studio-locale'

export default async function StudioHome({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>
}) {
  const params = await searchParams
  const rawLocale = Array.isArray(params.lang) ? params.lang[0] : params.lang
  const locale = parseStudioLocale(rawLocale)
  redirect(studioHref('profiles', locale))
}
