import { NextRequest, NextResponse } from 'next/server'
import { isSurfaceHost } from '@/routing-config'
import { visiblePluginUseCaseIds } from '@/lib/observatory-plugin-catalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host')
  if (!host || /[,\\s@/?#]/.test(host) || !isSurfaceHost('observatory', host))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ visibleIds: await visiblePluginUseCaseIds() }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
