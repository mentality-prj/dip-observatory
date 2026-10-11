import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getQdipSession, loginUrl, QDIP_SESSION_COOKIE } from '@/lib/qdip-oidc'
import { PLATFORM_ORIGINS } from '@/routing-config'
import '@/features/studio/styles.css'

export const metadata = {
  title: 'QDIP Studio',
  description: 'Configure, validate and evaluate decision systems with QDIP.',
}

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const session = getQdipSession((await cookies()).get(QDIP_SESSION_COOKIE)?.value)
  if (!session) redirect(loginUrl(PLATFORM_ORIGINS.studio + '/en/profiles'))
  return children
}
