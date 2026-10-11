import { NextRequest, NextResponse } from 'next/server'
import { normalizeDipBaseUrl } from '@/lib/dip-url'
import { isSurfaceHost } from '@/routing-config'
import { isStudioSubject, sessionFromRequest } from '@/lib/qdip-oidc'

const resource = /^[a-zA-Z0-9_.-]+$/
function allowed(path: string[], method: string) {
  if (!path.every((part) => resource.test(part))) return false
  if (path[0] === 'dimensions') return method === 'GET' && path.length <= 2
  if (path.join('/') === 'decision-studio/plugins') return method === 'GET'
  if (path[0] === 'decision-profiles') {
    if (path.length === 1) return ['GET', 'POST'].includes(method)
    if (path.length === 2) return ['GET', 'PATCH', 'DELETE'].includes(method)
    if (path.length === 3 && path[2] === 'dimensions') return ['GET', 'PUT'].includes(method)
    return path.length === 3 && path[2] === 'execute' && method === 'POST'
  }
  if (path[0] === 'plugins')
    return path.length === 3 && path[2] === 'dimension-bindings' && ['GET', 'PUT'].includes(method)
  if (path[0] === 'dimension-decisions')
    return (path.length <= 2 && method === 'GET') || (path.length === 3 && path[2] === 'replay' && method === 'POST')
  return false
}

const MAX_REQUEST_BYTES = 2_150_000
const MAX_RESPONSE_BYTES = 4_194_304

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

// Never use x-forwarded-host for authorization. The trusted ingress must
// preserve the original Host and overwrite x-forwarded-proto.
function studioOrigin(request: NextRequest): string | null {
  const host = request.headers.get('host')
  if (!host || /[,\s@/?#]/.test(host) || !isSurfaceHost('studio', host)) return null
  let parsed: URL
  try {
    parsed = new URL(`http://${host}`)
  } catch {
    return null
  }
  if (parsed.host.toLowerCase() !== host.toLowerCase()) return null
  const localhost = parsed.hostname.endsWith('.localhost')
  if (!localhost && parsed.port) return null
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedProto && !['http', 'https'].includes(forwardedProto)) return null
  const secure = request.nextUrl.protocol === 'https:' || forwardedProto === 'https'
  if (!secure && !localhost) return null
  return `${secure ? 'https' : 'http'}://${host.toLowerCase()}`
}

async function limitedBody(request: NextRequest): Promise<Uint8Array | null> {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_REQUEST_BYTES) return null
  const reader = request.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_REQUEST_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const output = new Uint8Array(size)
  let index = 0
  for (const chunk of chunks) {
    output.set(chunk, index)
    index += chunk.byteLength
  }
  return output
}

async function limitedResponse(upstream: Response): Promise<Uint8Array | null> {
  if (Number(upstream.headers.get('content-length') ?? 0) > MAX_RESPONSE_BYTES) return null
  const reader = upstream.body?.getReader()
  if (!reader) return new Uint8Array()
  const result = new Uint8Array(MAX_RESPONSE_BYTES)
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (size + value.byteLength > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      return null
    }
    result.set(value, size)
    size += value.byteLength
  }
  return result.slice(0, size)
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const origin = studioOrigin(request)
  if (!origin) {
    const host = request.headers.get('host')
    if (
      host &&
      !/[,\s@/?#]/.test(host) &&
      (isSurfaceHost('site', host) || isSurfaceHost('observatory', host))
    )
      return error('Not found', 404)
    return error('Invalid Studio host or transport', 403)
  }

  const session = sessionFromRequest(request)
  if (!session || !isStudioSubject(session.sub)) return error('Zitadel login required', 401)

  const { path } = await context.params
  if (!allowed(path, request.method)) return error('Unsupported Studio resource', 404)
  if (request.method !== 'GET' && request.headers.get('origin') !== origin)
    return error('A same-origin request is required', 403)

  const base = normalizeDipBaseUrl(
    process.env.DIP_API_BASE_URL ?? process.env.DIP_URL ?? process.env.NEXT_PUBLIC_DIP_API_BASE_URL
  )
  const apiKey = (process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? '').trim()
  if (!base || !apiKey) return error('Set DIP_API_BASE_URL and DIP_API_KEY to connect Decision Studio.', 503)
  const target = new URL(base)
  if (
    target.protocol !== 'https:' &&
    !(target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname))
  )
    return error('Studio backend requires TLS', 503)

  let payload: Uint8Array | undefined
  if (request.method !== 'GET') {
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json')
      return error('JSON required', 415)
    const body = await limitedBody(request)
    if (body === null) return error('Request too large', 413)
    payload = body
  }
  try {
    const upstream = await fetch(`${base}/api/v1/${path.join('/')}${request.nextUrl.search}`, {
      method: request.method,
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: payload ? Buffer.from(payload) : undefined,
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(45_000),
    })
    if (upstream.status === 204) return new NextResponse(null, { status: 204 })
    const body = await limitedResponse(upstream)
    if (body === null) return error('Studio response exceeds size limit', 502)
    return new NextResponse(Buffer.from(body), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch {
    return error('DIP is unavailable. Check the connection and retry.', 502)
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE }
