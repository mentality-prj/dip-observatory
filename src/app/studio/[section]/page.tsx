import { notFound, redirect } from 'next/navigation'
import { DecisionStudio, parseStudioLocale, StudioSurfaceShell } from '@/features/studio'

type SearchParams = {
  lang?: string | string[]
  route?: string | string[]
}

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>
  searchParams: Promise<SearchParams>
}) {
  const [{ section }, query] = await Promise.all([params, searchParams])
  const rawLocale = Array.isArray(query.lang) ? query.lang[0] : query.lang
  const locale = parseStudioLocale(rawLocale)

  if (['constraints', 'policies', 'compliance'].includes(section)) {
    redirect(`/${locale}/profiles`)
  }

  if (!['profiles', 'plugins', 'dimensions', 'bindings'].includes(section)) notFound()

  const rawRoute = Array.isArray(query.route) ? query.route[0] : query.route
  const route = rawRoute || section

  return (
    <StudioSurfaceShell locale={locale} route={route}>
      <DecisionStudio section={section} />
    </StudioSurfaceShell>
  )
}
