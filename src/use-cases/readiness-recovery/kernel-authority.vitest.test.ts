import { readFileSync } from 'node:fs'
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

  it('never mounts the legacy TypeScript solver in the RR product workspace', () => {
    const app = readFileSync(new URL('../application-runtime.tsx', import.meta.url), 'utf8')
    const kernel = readFileSync(new URL('./kernel-workspace.tsx', import.meta.url), 'utf8')
    const route = readFileSync(new URL('../../app/readiness/scenarios/[[...path]]/route.ts', import.meta.url), 'utf8')
    expect(app).toContain("'readiness-recovery': ReadinessRecoveryKernelWorkspace")
    expect(app).not.toMatch(/import\s*\{\s*ReadinessRecoveryWorkspace\s*\}/)
    expect(kernel).toContain('RRProductionOperatorPanel')
    expect(kernel).not.toMatch(/planReadinessRecovery|BoundedFeasibilityBackend|Monte Carlo.*execute/)
    expect(route).not.toMatch(/planReadinessRecovery|runCascadingRobustnessSweep|new BoundedFeasibilityBackend/)
  })
})
