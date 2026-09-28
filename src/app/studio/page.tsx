import { redirect } from 'next/navigation'
import { parseStudioLocale } from '@/features/studio'

export default async function StudioHome({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const params = await searchParams
  const rawLocale = Array.isArray(params.lang) ? params.lang[0] : params.lang
  const locale = parseStudioLocale(rawLocale)
  redirect(`/${locale}/profiles`)
}
