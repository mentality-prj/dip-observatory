import { timingSafeEqual } from 'node:crypto'

export class ResourceAllocationAccessError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'ResourceAllocationAccessError'
  }
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

function provenanceSource(input: unknown): string {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return ''
  const provenance = (input as Record<string, unknown>).provenance
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) return ''
  const source = (provenance as Record<string, unknown>).source
  return typeof source === 'string' ? source : ''
}

export function isClientResourceAllocationInput(input: unknown): boolean {
  return provenanceSource(input).startsWith('client-import:')
}

export function assertSameOriginMutation(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin)
    throw new ResourceAllocationAccessError('A same-origin request is required.', 403)

  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite))
    throw new ResourceAllocationAccessError('A same-origin request is required.', 403)
}

export function assertResourceAllocationDecisionAccess(request: Request, decision: unknown) {
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) return
  const provenance = (decision as Record<string, unknown>).provenance
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) return
  const source = (provenance as Record<string, unknown>).source
  if (typeof source !== 'string' || !source.startsWith('client-import:')) return

  const expected = process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY?.trim()
  if (!expected)
    throw new ResourceAllocationAccessError(
      'Client-data pilots are disabled until QDIP_RESOURCE_ALLOCATION_PILOT_KEY is configured.',
      503
    )

  const provided = request.headers.get('x-qdip-pilot-key')?.trim() ?? ''
  if (!provided || !safeEqual(provided, expected))
    throw new ResourceAllocationAccessError('A valid Resource Allocation pilot access code is required.', 401)
}

export function assertResourceAllocationAccess(request: Request, input: unknown) {
  assertSameOriginMutation(request)
  if (!isClientResourceAllocationInput(input)) return

  const expected = process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY?.trim()
  if (!expected)
    throw new ResourceAllocationAccessError(
      'Client-data pilots are disabled until QDIP_RESOURCE_ALLOCATION_PILOT_KEY is configured.',
      503
    )

  const provided = request.headers.get('x-qdip-pilot-key')?.trim() ?? ''
  if (!provided || !safeEqual(provided, expected))
    throw new ResourceAllocationAccessError('A valid Resource Allocation pilot access code is required.', 401)
}
