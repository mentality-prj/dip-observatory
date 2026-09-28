import { notFound } from 'next/navigation'
import {
  parseStudioLocale,
  ProfileDetail,
  profileSections,
  StudioSurfaceShell,
  type ProfileSection,
} from '@/features/studio'

type SearchParams = {
  lang?: string | string[]
  route?: string | string[]
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; section?: string[] }>
  searchParams: Promise<SearchParams>
}) {
  const [{ id, section }, query] = await Promise.all([params, searchParams])
  const active = section?.[0] ?? 'overview'
  if ((section?.length ?? 0) > 1 || !profileSections.includes(active as ProfileSection)) notFound()

  const rawLocale = Array.isArray(query.lang) ? query.lang[0] : query.lang
  const locale = parseStudioLocale(rawLocale)
  const rawRoute = Array.isArray(query.route) ? query.route[0] : query.route
  const route = rawRoute || `profiles/${id}${active === 'overview' ? '' : `/${active}`}`

  return (
    <StudioSurfaceShell locale={locale} route={route}>
      <ProfileDetail key={`${id}-${active}`} id={id} section={active as ProfileSection} />
    </StudioSurfaceShell>
  )
}
