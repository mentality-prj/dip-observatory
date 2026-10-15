import { NextRequest, NextResponse } from 'next/server'
import { isSurfaceHost } from '@/routing-config'
import { sessionFromRequest } from '@/lib/qdip-oidc'
import { normalizeDipBaseUrl } from '@/lib/dip-url'

const ID = /^[a-zA-Z0-9_.-]{1,128}$/
const MAX_INPUT = 65536

export async function POST(request: NextRequest) {
  const host = request.headers.get('host')
  if (!host || /[,\\s@/?#]/.test(host) || !isSurfaceHost('observatory', host))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const session = sessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Zitadel login required' }, { status: 401 })
  const origin = request.headers.get('origin')
  const forwarded = request.headers.get('x-forwarded-proto')
  if (forwarded && forwarded !== 'https' && forwarded !== 'http') return NextResponse.json({ error: 'Invalid transport' }, { status: 403 })
  const proto = request.nextUrl.protocol === 'https:' || forwarded === 'https' ? 'https' : 'http'
  if (proto !== 'https' && !host.endsWith('.localhost')) return NextResponse.json({ error: 'TLS required' }, { status: 403 })
  if (origin !== proto + '://' + host.toLowerCase())
    return NextResponse.json({ error: 'Same-origin request required' }, { status: 403 })
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json')
    return NextResponse.json({ error: 'JSON required' }, { status: 415 })
  if (Number(request.headers.get('content-length') ?? 0) > MAX_INPUT)
    return NextResponse.json({ error: 'Input too large' }, { status: 413 })

  // No global admin key fallback. A dedicated execute-only key may be enabled
  // only for a single-organization Observatory deployment; multi-org routing
  // must be implemented before general availability.
  const key = process.env.QDIP_OBSERVATORY_EXECUTE_API_KEY?.trim()
  const base = normalizeDipBaseUrl(process.env.DIP_API_BASE_URL ?? process.env.DIP_URL)
  if (!key || !base) return NextResponse.json({ error: 'Execution not configured' }, { status: 503 })
  const url = new URL(base)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    return NextResponse.json({ error: 'TLS required' }, { status: 503 })

  let payload: { capability_id: string; capability_version: string; input: Record<string, unknown> }
  try {
    const raw = await request.text()
    if (Buffer.byteLength(raw) > MAX_INPUT) return NextResponse.json({ error: 'Input too large' }, { status: 413 })
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    const record = parsed as Record<string, unknown>
    if (typeof record.capability_id !== 'string' || !ID.test(record.capability_id) ||
        typeof record.capability_version !== 'string' || !ID.test(record.capability_version) ||
        !record.input || typeof record.input !== 'object' || Array.isArray(record.input)) throw new Error()
    payload = { capability_id: record.capability_id, capability_version: record.capability_version, input: record.input as Record<string, unknown> }
  } catch {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  try {
    const upstream = await fetch(base + '/api/v1/remote-plugins/' + encodeURIComponent(payload.capability_id) + '/invoke', {
      method: 'POST',
      headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: payload.input, capability_version: payload.capability_version, timeout_seconds: 10 }),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    })
    if (!upstream.ok) return NextResponse.json({ error: 'Capability unavailable' }, { status: upstream.status === 403 ? 403 : 502 })
    if (Number(upstream.headers.get('content-length') ?? 0) > 1048576)
      return NextResponse.json({ error: 'Result too large' }, { status: 502 })
    const response: unknown = await upstream.json()
    if (!response || typeof response !== 'object' || Array.isArray(response))
      return NextResponse.json({ error: 'Invalid result' }, { status: 502 })
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Capability unavailable' }, { status: 502 })
  }
}
