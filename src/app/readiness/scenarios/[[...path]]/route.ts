import { NextResponse } from 'next/server'
import type { ReadinessRecoveryInput } from '@/use-cases/readiness-recovery/domain'
import {
  planReadinessRecoveryWithBenchmarkSuite,
  qdipAdvantageRetention,
  runCascadingRobustnessSweep,
} from '@/use-cases/readiness-recovery/benchmark-suite'
import { decorateObjectiveLabels } from '@/use-cases/readiness-recovery/scenario-labels'

type RouteContext = { params: Promise<{ path?: string[] }> }

const MAX_PUBLIC_REQUEST_BYTES = 1_048_576

const PUBLIC_PLANNER_LIMITS = {
  simulationSamples: 500,
  beamWidth: 128,
  maxCandidates: 256,
  maxSearchNodes: 100_000,
  maxSolveTimeMs: 10_000,
} as const

function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const requestUrl = new URL(request.url)
  if (!origin) throw new Error('Cross-origin request rejected.')
  const originUrl = new URL(origin)
  if (originUrl.origin !== requestUrl.origin) {
    throw new Error('Cross-origin request rejected.')
  }
}

function assertPublicPlannerLimits(input: ReadinessRecoveryInput) {
  const { settings } = input
  if (!Array.isArray(input.assets) || input.assets.length > 200 ||
      !Array.isArray(input.recoveryActions) || input.recoveryActions.length > 300 ||
      !Array.isArray(input.capabilityDemand) || input.capabilityDemand.length > 32) {
    throw new Error('Public RR demo entity limits exceeded.')
  }
  for (const [key, limit] of Object.entries(PUBLIC_PLANNER_LIMITS)) {
    const value = settings[key as keyof typeof PUBLIC_PLANNER_LIMITS]
    if (!Number.isFinite(value) || value < 1 || value > limit) {
      throw new Error(`Planner setting ${key} must be between 1 and ${limit}.`)
    }
  }
}

function storedPayload(input: ReadinessRecoveryInput) {
  assertPublicPlannerLimits(input)
  const planned = planReadinessRecoveryWithBenchmarkSuite(input)
  const robustnessVariants =
    input.scenarioId === 'readiness-cascading-resource-conflict' ? runCascadingRobustnessSweep(input) : null
  const robustness = robustnessVariants
    ? { ...qdipAdvantageRetention(robustnessVariants), variants: robustnessVariants }
    : undefined
  const result = { ...planned, frontier: decorateObjectiveLabels(planned.frontier), robustness }
  return result
}

function errorResponse(reason: unknown) {
  const message = reason instanceof Error ? reason.message : 'Readiness recovery request failed.'
  const status = message === 'Cross-origin request rejected.' ? 403 : 400
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request, context: RouteContext) {
  try {
    assertSameOrigin(request)
    const { path = [] } = await context.params
    if (Number(request.headers.get('content-length') ?? 0) > MAX_PUBLIC_REQUEST_BYTES)
      return NextResponse.json({ error: 'RR demo request too large' }, { status: 413 })
    const raw = await request.text()
    if (Buffer.byteLength(raw, 'utf8') > MAX_PUBLIC_REQUEST_BYTES)
      return NextResponse.json({ error: 'RR demo request too large' }, { status: 413 })
    const body = JSON.parse(raw) as { input?: ReadinessRecoveryInput }
    if (!body.input) return NextResponse.json({ error: 'Readiness recovery input is required.' }, { status: 400 })

    if (path.length === 0) {
      return NextResponse.json(storedPayload(body.input), {
        status: 201, headers: { 'Cache-Control': 'no-store' },
      })
    }

    if (path.length === 2 && path[1] === 'recalculate') {
      const id = decodeURIComponent(path[0])
      if (body.input.scenarioId !== id) {
        return NextResponse.json({ error: 'Path scenario id must match input scenarioId.' }, { status: 400 })
      }
      return NextResponse.json(storedPayload(body.input), {
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    return NextResponse.json({ error: 'Unsupported readiness scenario operation.' }, { status: 404 })
  } catch (reason) {
    return errorResponse(reason)
  }
}

// Public demo requests are stateless: no process-global Map or unauthenticated
// lookup of other users' scenario results by predictable scenario ID.
export async function GET() {
  return NextResponse.json(
    { error: 'Public RR demo results are not persisted; rerun the scenario.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  )
}
