import { notFound } from 'next/navigation'
import { ProfileDetail, profileSections, type ProfileSection } from '@/features/studio'

export default async function ProfilePage({ params }: { params: Promise<{ id: string; section?: string[] }> }) {
  const { id, section } = await params
  const active = section?.[0] ?? 'overview'
  if ((section?.length ?? 0) > 1 || !profileSections.includes(active as ProfileSection)) notFound()
  return <ProfileDetail key={`${id}-${active}`} id={id} section={active as ProfileSection} />
}
