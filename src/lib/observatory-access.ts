import 'server-only'
import { sessionFromRequest } from '@/lib/qdip-oidc'
import type { NextRequest } from 'next/server'

/**
 * Observatory has Zitadel users, not organization memberships.
 * Until Core supports per-user execution identity, explicitly allow only
 * named Zitadel subjects for the one configured Gateway service tenant.
 * No logged-in user automatically inherits the shared service key.
 */
export function authorizedObservatoryUser(request: NextRequest): boolean {
  const session = sessionFromRequest(request)
  if (!session?.sub) return false
  const allowed = (process.env.QDIP_OBSERVATORY_ALLOWED_SUBJECTS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return allowed.length > 0 && allowed.includes(session.sub)
}
