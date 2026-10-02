import { NextResponse } from 'next/server'
import type { ReadinessRecoveryInput } from '@/use-cases/readiness-recovery/domain'
import {
  planReadinessRecoveryWithBenchmarkSuite,
  qdipAdvantageRetention,
  runCascadingRobustnessSweep,
} from '@/use-cases/readiness-recovery/benchmark-suite'
import { decorateObjectiveLabels } from '@/use-cases/readiness-recovery/scenario-labels'
import { readinessScenarioRepository } from '@/use-cases/readiness-recovery/scenario-repository'

type RouteContext = { params: Promise<{ path?: string[] }> }

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
  const expectedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? requestUrl.host
  const expectedProtocol = request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(':', '')
  if (!origin) throw new Error('Cross-origin request rejected.')
  const originUrl = new URL(origin)
  if (originUrl.host !== expectedHost || originUrl.protocol.replace(':', '') !== expectedProtocol) {
    throw new Error('Cross-origin request rejected.')
  }
}

function assertPublicPlannerLimits(input: ReadinessRecoveryInput) {
  const { settings } = input
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
  return { input, result, updatedAt: new Date().toISOString() }
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
    const body = (await request.json()) as { input?: ReadinessRecoveryInput }
    if (!body.input) return NextResponse.json({ error: 'Readiness recovery input is required.' }, { status: 400 })

    if (path.length === 0) {
      const stored = storedPayload(body.input)
      readinessScenarioRepository.put(body.input.scenarioId, stored)
      return NextResponse.json(stored.result, { status: 201 })
    }

    if (path.length === 2 && path[1] === 'recalculate') {
      const id = decodeURIComponent(path[0])
      if (body.input.scenarioId !== id) {
        return NextResponse.json({ error: 'Path scenario id must match input scenarioId.' }, { status: 400 })
      }
      const stored = storedPayload(body.input)
      readinessScenarioRepository.put(id, stored)
      return NextResponse.json(stored.result)
    }

    return NextResponse.json({ error: 'Unsupported readiness scenario operation.' }, { status: 404 })
  } catch (reason) {
    return errorResponse(reason)
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { path = [] } = await context.params
  if (path.length !== 1 && !(path.length === 2 && path[1] === 'frontier')) {
    return NextResponse.json({ error: 'Scenario id is required.' }, { status: 400 })
  }
  const id = decodeURIComponent(path[0])
  const stored = readinessScenarioRepository.get(id)
  if (!stored) return NextResponse.json({ error: 'Scenario not found in this Observatory process.' }, { status: 404 })
  if (path.length === 2) return NextResponse.json({ scenarioId: id, frontier: stored.result.frontier })
  return NextResponse.json(stored.result)
}
