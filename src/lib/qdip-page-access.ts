import 'server-only'

import { cookies } from 'next/headers'
import { canAccessStudio, canOperateRr, getQdipSession, QDIP_SESSION_COOKIE } from '@/lib/qdip-oidc'

export type PageRole = 'studio' | 'rr_operator'

export async function pageAccess(role: PageRole): Promise<{ authenticated: boolean; allowed: boolean }> {
  const store = await cookies()
  const session = getQdipSession(store.get(QDIP_SESSION_COOKIE)?.value)
  return {
    authenticated: Boolean(session),
    allowed: Boolean(session && (role === 'studio' ? canAccessStudio(session) : canOperateRr(session))),
  }
}
