import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GET, POST } from '@/app/readiness/scenarios/[[...path]]/route'

describe('canonical RR has one decision authority', () => {
  it('retires the legacy simulation endpoint for GET and POST', async () => {
    for (const response of [await GET(), await POST()]) {
      expect(response.status).toBe(410)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(await response.json()).toMatchObject({ code: 'RR_LEGACY_SOLVER_RETIRED' })
    }
  })

  it('prevents RR business calculations and experimental algorithms from reappearing in qdip-web', () => {
    const root = join(process.cwd(), 'src/use-cases/readiness-recovery')
    const remaining = readdirSync(root)
    const banned = [
      'planner.ts',
      'optimization-backend.ts',
      'benchmark.ts',
      'benchmark-suite.ts',
      'demo-data.ts',
      'input-contract.ts',
      'operator-preflight.ts',
      'scenario-repository.ts',
      'test-a-attempt-ledger.ts',
      'test-a-dip-ledger-store.ts',
      'search-audit.ts',
      'search-neighborhood-audit.ts',
      'evidence-manifest.ts',
    ]
    for (const filename of banned) expect(remaining).not.toContain(filename)
    const source = remaining
      .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
      .map((file) => readFileSync(join(root, file), 'utf8'))
      .join('\n')
    expect(source).not.toMatch(
      /function\s+(planReadinessRecovery|sampleDistribution|distributionMean|paretoFrontier|applySensitivity|computeRisk)/
    )
    expect(source).not.toMatch(
      /import\s+.*\s+from\s+['"]\.\/(planner|optimization-backend|benchmark-suite|demo-data|operator-preflight)['"]/
    )
    const allowlist = readFileSync(join(process.cwd(), 'src/lib/rr-kernel-route-allowlist.ts'), 'utf8')
    expect(allowlist).toContain("path[0] === 'preflight'")
    expect(allowlist).toContain("'presentation'")
    expect(allowlist).toContain("'verified-export-page'")
  })

  it('never mounts the legacy TypeScript solver in the RR product workspace', () => {
    const app = readFileSync(join(process.cwd(), 'src/use-cases/application-runtime.tsx'), 'utf8')
    const kernel = readFileSync(join(process.cwd(), 'src/use-cases/readiness-recovery/kernel-workspace.tsx'), 'utf8')
    const route = readFileSync(join(process.cwd(), 'src/app/readiness/scenarios/[[...path]]/route.ts'), 'utf8')
    expect(app).toContain("'readiness-recovery': ReadinessRecoveryKernelWorkspace")
    expect(app).not.toMatch(/import\s*\{\s*ReadinessRecoveryWorkspace\s*\}/)
    expect(kernel).toContain('RRProductionOperatorPanel')
    expect(kernel).not.toMatch(/planReadinessRecovery|BoundedFeasibilityBackend|Monte Carlo.*execute/)
    expect(route).not.toMatch(/planReadinessRecovery|runCascadingRobustnessSweep|new BoundedFeasibilityBackend/)
  })
})
