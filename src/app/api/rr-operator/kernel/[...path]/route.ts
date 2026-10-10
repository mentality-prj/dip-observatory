import { NextRequest, NextResponse } from 'next/server'
import { normalizeDipBaseUrl } from '@/lib/dip-url'
import { operatorAuthorized, operatorConfigured, safeTransport, sameOrigin } from '@/lib/rr-operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ path: string[] }> }
const identifier = /^[a-zA-Z0-9_.-]{1,128}$/
const MAX_BODY_BYTES = 2_150_000

function approved(path: string[], method: string) {
  if (path.some((part) => !identifier.test(part))) return false
  if (path.length === 1 && path[0] === 'executions') return method === 'POST'
  if (path[0] === 'executions' && path.length === 2) return method === 'GET'
  if (path[0] === 'executions' && path.length === 3)
    return (path[2] === 'replan' && method === 'POST') || (path[2] === 'replay-verification' && method === 'GET')
  if (path[0] === 'decisions' && path.length === 3)
    return method === 'GET' && ['history', 'history-integrity'].includes(path[2])
  if (path[0] === 'decisions' && path.length === 4)
    return method === 'GET' && path[2] === 'history' && path[3] === 'export'
  return false
}

function json(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function handle(request: NextRequest, context: Context) {
  if (!safeTransport(request)) return json('TLS required', 403)
  if (!operatorConfigured()) return json('RR operator mode is not configured', 503)
  if (!operatorAuthorized(request)) return json('RR operator login required', 401)
  if (request.method === 'POST' && !sameOrigin(request)) return json('Forbidden origin', 403)
  const { path } = await context.params
  if (!approved(path, request.method)) return json('Unsupported RR operation', 404)

  const base = normalizeDipBaseUrl(process.env.DIP_API_BASE_URL ?? process.env.DIP_URL)
  const key = (process.env.DIP_API_KEY ?? '').trim()
  if (!base || !key) return json('DIP connection is not configured', 503)
  const upstreamBase = new URL(base)
  if (upstreamBase.protocol !== 'https:' && !(upstreamBase.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(upstreamBase.hostname)))
    return json('DIP backend requires TLS', 503)

  let body: string | undefined
  if (request.method === 'POST') {
    if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return json('Request too large', 413)
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json('JSON required', 415)
    body = await request.text()
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) return json('Request too large', 413)
  }
  try {
    const upstream = await fetch(`${base}/api/v1/readiness-recovery/${path.join('/')}${request.nextUrl.search}`, {
      method: request.method,
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body,
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(45_000),
    })
    const payload = await upstream.text()
    if (Buffer.byteLength(payload, 'utf8') > 4_194_304) return json('RR response exceeds size limit', 502)
    return new NextResponse(payload, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch {
    return json('RR backend unavailable', 502)
  }
}

export { handle as GET, handle as POST }
