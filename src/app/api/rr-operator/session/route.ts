import { NextRequest, NextResponse } from 'next/server'
import {
  createOperatorSession,
  operatorAuthorized,
  operatorConfigured,
  RR_OPERATOR_COOKIE,
  safeTransport,
  sameOrigin,
  verifyOperatorPassword,
} from '@/lib/rr-operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function response(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request: NextRequest) {
  if (!safeTransport(request)) return response({ error: 'TLS required' }, 403)
  return response({
    configured: operatorConfigured(),
    authenticated: operatorAuthorized(request),
    mode: 'single-organization-reference',
  })
}

export async function POST(request: NextRequest) {
  if (!safeTransport(request) || !sameOrigin(request)) return response({ error: 'Forbidden' }, 403)
  if (!operatorConfigured()) return response({ error: 'Operator access is not configured' }, 503)
  if (Number(request.headers.get('content-length') ?? 0) > 4096) return response({ error: 'Too large' }, 413)
  let input: unknown
  try {
    input = await request.json()
  } catch {
    return response({ error: 'Invalid request' }, 400)
  }
  const password = input && typeof input === 'object' && 'password' in input ? input.password : null
  if (!verifyOperatorPassword(password)) return response({ error: 'Unauthorized' }, 401)
  const result = response({ authenticated: true })
  result.cookies.set(RR_OPERATOR_COOKIE, createOperatorSession(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 8 * 60 * 60,
  })
  return result
}

export async function DELETE(request: NextRequest) {
  if (!safeTransport(request) || !sameOrigin(request)) return response({ error: 'Forbidden' }, 403)
  const result = response({ authenticated: false })
  result.cookies.set(RR_OPERATOR_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 0,
  })
  return result
}
