import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { SUPPORTED_LOCALE_PATTERN } from '@/i18n/config'
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
const INTERNAL_REWRITE_HEADER = 'x-qdip-internal-rewrite'

type Surface = 'site' | 'studio' | 'observatory' | 'local'

function requestHost(request: NextRequest) {
  return (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').split(':')[0].toLowerCase()
}

function resolveSurface(host: string): Surface {
  if (!host || LOCAL_HOSTS.has(host)) return 'local'
  if (host === 'qdip.ai' || host === 'www.qdip.ai' || host === 'qdip.localhost') {
    return 'site'
  }
  if (host === 'studio.qdip.ai' || host.startsWith('studio.')) return 'studio'
  if (host === 'observatory.qdip.ai' || host.startsWith('observatory.')) {
    return 'observatory'
  }
  return 'local'
}

function redirectPath(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.redirect(url, 308)
}

function rewritePath(
  request: NextRequest,
  pathname: string,
  extraHeaders?: Record<string, string>,
  query?: Record<string, string>
) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  for (const [name, value] of Object.entries(query ?? {})) {
    url.searchParams.set(name, value)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(INTERNAL_REWRITE_HEADER, '1')
  for (const [name, value] of Object.entries(extraHeaders ?? {})) {
    requestHeaders.set(name, value)
  }

  return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
}

function routeStudio(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/') return redirectPath(request, '/en')

  const localized = pathname.match(new RegExp(`^/${SUPPORTED_LOCALE_PATTERN}(/.*)?$`))
  if (localized) {
    const locale = localized[1]
    const suffix = localized[2] ?? ''

    const response = rewritePath(
      request,
      suffix ? `/studio${suffix}` : '/studio',
      { 'x-qdip-studio-locale': locale },
      { lang: locale }
    )
    response.cookies.set('qdip-studio-locale', locale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
    return response
  }

  if (pathname.startsWith('/studio')) {
    return redirectPath(request, `/en${pathname.slice('/studio'.length)}`)
  }

  return redirectPath(request, `/en${pathname}`)
}

function routeObservatory(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname === '/') return rewritePath(request, '/en')
  if (pathname === '/decisions') {
    return rewritePath(request, '/observatory/decisions')
  }
  return NextResponse.next()
}

function routeSite(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/') return NextResponse.next()

  const internalPlatformPath = pathname.match(new RegExp(`^/platform/${SUPPORTED_LOCALE_PATTERN}(/.*)?$`))
  if (internalPlatformPath) {
    return redirectPath(request, `/${internalPlatformPath[1]}${internalPlatformPath[2] ?? ''}`)
  }

  const publicPath = pathname.match(new RegExp(`^/${SUPPORTED_LOCALE_PATTERN}(/.*)?$`))
  if (publicPath) {
    return rewritePath(request, `/platform/${publicPath[1]}${publicPath[2] ?? ''}`)
  }

  return NextResponse.next()
}

export function proxy(request: NextRequest) {
  if (request.headers.get(INTERNAL_REWRITE_HEADER) === '1') {
    return NextResponse.next()
  }
  if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()

  switch (resolveSurface(requestHost(request))) {
    case 'studio':
      return routeStudio(request)
    case 'observatory':
      return routeObservatory(request)
    case 'site':
      return routeSite(request)
    default:
      return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
}
