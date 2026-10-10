import 'server-only'

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { isSurfaceHost } from '@/routing-config'

export const RR_OPERATOR_COOKIE = 'qdip_rr_operator'
const MAX_AGE_SECONDS = 8 * 60 * 60

function secret() {
  const key = process.env.RR_OPERATOR_SESSION_SECRET ?? ''
  return key.length >= 32 ? key : null
}

export function operatorConfigured() {
  return Boolean(
    process.env.RR_REFERENCE_OPERATOR_ENABLED === 'true' &&
    (process.env.RR_OPERATOR_PASSWORD ?? '').length >= 16 &&
    secret() &&
    (process.env.DIP_API_BASE_URL ?? process.env.DIP_URL) &&
    (process.env.DIP_API_KEY ?? '').trim()
  )
}

function digest(value: string) {
  return createHash('sha256').update(value, 'utf8').digest()
}

export function verifyOperatorPassword(candidate: unknown) {
  const expected = process.env.RR_OPERATOR_PASSWORD ?? ''
  if (!operatorConfigured() || typeof candidate !== 'string' || candidate.length > 1024) return false
  return timingSafeEqual(digest(candidate), digest(expected))
}

function signature(expiration: number, key: string) {
  return createHmac('sha256', key)
    .update(`rr-operator.v1:${expiration}:${digest(process.env.RR_OPERATOR_PASSWORD ?? '').toString('hex')}`)
    .digest('hex')
}

export function createOperatorSession(now = Date.now()) {
  const key = secret()
  if (!operatorConfigured() || !key) throw new Error('RR operator session is not configured')
  const expiration = Math.floor(now / 1000) + MAX_AGE_SECONDS
  return `v1.${expiration}.${signature(expiration, key)}`
}

export function verifyOperatorSession(value: string | undefined, now = Date.now()) {
  const key = secret()
  if (!operatorConfigured() || !key || !value) return false
  const match = /^v1\.([0-9]{10,12})\.([a-f0-9]{64})$/.exec(value)
  if (!match) return false
  const expiration = Number(match[1])
  if (expiration <= Math.floor(now / 1000) || expiration > Math.floor(now / 1000) + MAX_AGE_SECONDS) return false
  const actual = Buffer.from(match[2], 'hex')
  const expected = Buffer.from(signature(expiration, key), 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function operatorAuthorized(request: NextRequest) {
  return verifyOperatorSession(request.cookies.get(RR_OPERATOR_COOKIE)?.value)
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    const parsed = new URL(origin)
    return parsed.origin === request.nextUrl.origin
  } catch {
    return false
  }
}

export function safeTransport(request: NextRequest) {
  const url = request.nextUrl
  if (!isSurfaceHost('observatory', url.host)) return false
  return url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname.endsWith('.localhost'))
}
