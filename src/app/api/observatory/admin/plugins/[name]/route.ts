import { NextRequest, NextResponse } from 'next/server'
import { adminRequest } from '@/lib/observatory-plugin-admin'
import { corePluginRequest, readCorePublications } from '@/lib/observatory-plugin-catalog'

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
  let update: {
    published?: unknown
    expected_revision?: unknown
    capability_id?: unknown
    display_name?: unknown
    description?: unknown
    category?: unknown
  }
  try {
    const raw = await request.text()
    if (raw.length > 4096) return NextResponse.json({ error: 'Request too large' }, { status: 413 })
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
    // Runtime registration belongs to QDIP Core. Observatory registers only
    // a catalog entry for a plugin/capability already installed and verified.
    const capability =
      typeof update.capability_id === 'string'
        ? update.capability_id
        : (installed.capability_id ?? installed.capabilities[0])
    if (!capability || !installed.capabilities.includes(capability))
      return NextResponse.json({ error: 'Capability is not installed' }, { status: 409 })
    if (update.published && !installed.enabled)
      return NextResponse.json({ error: 'Disabled plugin cannot be published' }, { status: 409 })
    const displayName = update.display_name
    const description = update.description
    const category = update.category
    if (
      displayName !== undefined &&
      (typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.length > 120)
    )
      return NextResponse.json({ error: 'Invalid display name' }, { status: 422 })
    if (description !== undefined && (typeof description !== 'string' || description.length > 2000))
      return NextResponse.json({ error: 'Invalid description' }, { status: 422 })
    if (category !== undefined && (typeof category !== 'string' || !/^[A-Za-z0-9 _.-]{1,64}$/.test(category)))
      return NextResponse.json({ error: 'Invalid category' }, { status: 422 })
    const upstream = await corePluginRequest('/' + encodeURIComponent(name), {
      method: 'PUT',
      headers: { 'X-QDIP-Actor': session.sub },
      body: JSON.stringify({
        published: update.published,
        expected_revision: update.expected_revision,
        capability_id: capability,
        plugin_version: installed.version,
        ...(displayName !== undefined ? { display_name: (displayName as string).trim() } : {}),
        ...(description !== undefined ? { description: (description as string).trim() } : {}),
        ...(category !== undefined ? { category: (category as string).trim() } : {}),
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
