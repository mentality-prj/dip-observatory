import { createHash } from 'node:crypto'

type Principal = { issuer: string; sub: string }
const CLIENT_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/

export function studioNamespace(user: Principal) {
  if (!user.issuer || !user.sub) throw new Error('Missing authenticated Studio principal')
  return (
    'u' +
    createHash('sha256')
      .update(JSON.stringify([user.issuer, user.sub]))
      .digest('hex')
      .slice(0, 40) +
    '_'
  )
}

export function toOwnedProfileId(user: Principal, id: string) {
  if (!CLIENT_ID.test(id)) throw new Error('Invalid profile identifier')
  return studioNamespace(user) + id
}

export function fromOwnedProfileId(user: Principal, id: unknown) {
  const prefix = studioNamespace(user)
  return typeof id === 'string' && id.startsWith(prefix) && CLIENT_ID.test(id.slice(prefix.length))
    ? id.slice(prefix.length)
    : null
}

export function isOwnedAudit(user: Principal, value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const audit = value as Record<string, unknown>
  if (!audit.profile || typeof audit.profile !== 'object' || Array.isArray(audit.profile)) return false
  return fromOwnedProfileId(user, (audit.profile as Record<string, unknown>).id) !== null
}

export function publicOwnedProfile(user: Principal, value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const p = value as Record<string, unknown>
  const id = fromOwnedProfileId(user, p.id)
  return id === null ? null : { ...p, id }
}

export function publicOwnedAudit(user: Principal, value: unknown) {
  if (!isOwnedAudit(user, value)) return null
  const audit = value as Record<string, unknown>
  const profile = publicOwnedProfile(user, audit.profile)
  return profile ? { ...audit, profile } : null
}
