import { NextRequest, NextResponse } from 'next/server'
import { adminRequest } from '@/lib/observatory-plugin-admin'
import { corePluginRequest, readCorePublications } from '@/lib/observatory-plugin-catalog'
import { DIP_USE_CASES } from '@/use-cases/registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { error, session } = adminRequest(request, true)
  if (error) return error
  if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const { name } = await context.params
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(name))
    return NextResponse.json({ error: 'Invalid plugin id' }, { status: 400 })

  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json')
    return NextResponse.json({ error: 'JSON required' }, { status: 415 })
  let update: { published?: unknown; expected_revision?: unknown }
  try {
    const raw = await request.text()
    if (raw.length > 256) return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    update = JSON.parse(raw) as typeof update
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (
    typeof update.published !== 'boolean' ||
    typeof update.expected_revision !== 'number' ||
    !Number.isSafeInteger(update.expected_revision) ||
    (update.expected_revision as number) < 0
  )
    return NextResponse.json({ error: 'Invalid publication request' }, { status: 422 })

  try {
    const installed = (await readCorePublications()).find((item) => item.name === name)
    if (!installed) return NextResponse.json({ error: 'Plugin not installed' }, { status: 404 })
    const workspace = DIP_USE_CASES.find(
      (item) => item.plugin.id === name && installed.capabilities.includes(item.plugin.capability)
    )
    if (update.published && (!workspace || !installed.enabled))
      return NextResponse.json(
        { error: 'An approved Observatory workspace and active capability are required' },
        { status: 409 }
      )
    // A server-owned route/capability binding, never browser-supplied executable code or URL.
    const capability = workspace?.plugin.capability ?? installed.capabilities[0]
    if (!capability) return NextResponse.json({ error: 'Plugin has no capability' }, { status: 409 })
    const upstream = await corePluginRequest('/' + encodeURIComponent(name), {
      method: 'PUT',
      headers: { 'X-QDIP-Actor': session.sub },
      body: JSON.stringify({
        published: update.published,
        expected_revision: update.expected_revision,
        capability_id: capability,
        plugin_version: installed.version,
      }),
    })
    const text = await upstream.text()
    if (text.length > 16_384) return NextResponse.json({ error: 'Oversized Core response' }, { status: 502 })
    if (upstream.status === 409)
      return NextResponse.json({ error: 'Registry changed. Reload and retry.' }, { status: 409 })
    if (!upstream.ok)
      return NextResponse.json({ error: 'Could not update plugin publication' }, { status: upstream.status })
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'QDIP Core unavailable' }, { status: 503 })
  }
}
