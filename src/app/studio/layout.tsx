import type { ReactNode } from 'react'
import { QdipAccessGate } from '@/components/auth/qdip-access-gate'
import { pageAccess } from '@/lib/qdip-page-access'
import { studioHref } from '@/lib/platform-urls'
import '@/features/studio/styles.css'

export const metadata = {
  title: 'QDIP Studio',
  description: 'Configure, validate and evaluate decision systems with QDIP.',
}

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const access = await pageAccess('studio')
  if (!access.allowed)
    return (
      <QdipAccessGate
        locale="en"
        role="studio"
        returnTo={studioHref('', 'en')}
        authenticated={access.authenticated}
      />
    )

  return children
}
