import { RESPONSIBLE_CITIZENS_PROFILE } from '../src/features/resource-allocation/demo-data'

const baseUrl = (process.env.QDIP_SMOKE_BASE_URL ?? 'https://qdip.ai').replace(/\/$/, '')

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

type Summary = {
  served?: number
  closing_unmet?: number
  priority_coverage?: number
  total_available?: number
}

async function main() {
  const response = await fetch(`${baseUrl}/api/resource-allocation/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'qdip-resource-allocation-live-smoke/1',
    },
    body: JSON.stringify({
      ...RESPONSIBLE_CITIZENS_PROFILE,
      operation: 'simulate',
      scenario: {
        capacity_factor: 1,
        inaccessible_communities: [],
        unavailable_teams: [],
      },
    }),
  })

  const raw = await response.text()
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new Error(`Live Resource Allocation returned non-JSON HTTP ${response.status}: ${raw.slice(0, 240)}`)
  }

  assert(response.ok, `Live Resource Allocation failed HTTP ${response.status}: ${raw.slice(0, 400)}`)

  const result = payload.result as
    | {
        status?: string
        demand_summary?: Summary
        baseline?: { summary?: Summary; kind?: string } | null
        engine_version?: string
      }
    | undefined

  assert(result?.status === 'ok', 'Live Core did not return an ok Resource Allocation result.')
  assert(result.baseline?.kind === 'canonical-plan', 'Live response did not evaluate the canonical manual baseline.')

  const baseline = result.baseline?.summary
  const optimized = result.demand_summary
  assert(baseline, 'Live response is missing baseline.summary.')
  assert(optimized, 'Live response is missing demand_summary.')

  assert(baseline.total_available === 320, `Baseline total_available drifted: ${baseline.total_available}`)
  assert(baseline.served === 239, `Baseline served drifted: ${baseline.served}`)
  assert(baseline.closing_unmet === 81, `Baseline closing_unmet drifted: ${baseline.closing_unmet}`)
  assert(
    Math.abs((baseline.priority_coverage ?? -1) - 0.702206) < 1e-6,
    `Baseline priority_coverage drifted: ${baseline.priority_coverage}`
  )

  assert((optimized.served ?? -Infinity) >= 249, `Optimized served no longer clears +10 gate: ${optimized.served}`)
  assert(
    (optimized.closing_unmet ?? Infinity) <= 71,
    `Optimized unmet no longer clears -10 gate: ${optimized.closing_unmet}`
  )
  assert(
    (optimized.priority_coverage ?? -Infinity) >= 0.802206,
    `Optimized priority coverage no longer clears +10pp gate: ${optimized.priority_coverage}`
  )

  console.log(
    JSON.stringify(
      {
        baseUrl,
        engine_version: result.engine_version,
        baseline: {
          served: baseline.served,
          unmet: baseline.closing_unmet,
          priority_coverage: baseline.priority_coverage,
        },
        optimized: {
          served: optimized.served,
          unmet: optimized.closing_unmet,
          priority_coverage: optimized.priority_coverage,
        },
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
