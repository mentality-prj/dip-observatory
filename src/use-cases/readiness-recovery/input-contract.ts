import { z } from 'zod'
import type { ReadinessRecoveryInput } from './domain'

const id = z.string().min(1).max(128)
const quantity = z.number().finite().nonnegative()
const probability = z.number().finite().min(0).max(1)
const date = z.string().refine((v) => Number.isFinite(Date.parse(v)), 'Invalid date')
const distribution = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('DETERMINISTIC'), value: quantity }),
  z
    .strictObject({ kind: z.literal('TRIANGULAR'), min: quantity, mode: quantity, max: quantity })
    .refine((v) => v.min <= v.mode && v.mode <= v.max, 'min <= mode <= max required'),
  z.strictObject({ kind: z.literal('LOG_NORMAL'), mu: z.number().finite(), sigma: quantity }),
  z.strictObject({ kind: z.literal('EMPIRICAL'), values: z.array(quantity).min(1).max(500) }),
])
const part = z.strictObject({ partId: id, quantity })
const skill = z.strictObject({ skillId: id, technicianHours: quantity })
const capability = z.strictObject({
  capabilityId: id,
  quantity,
  qualityFactor: quantity.optional(),
  validFrom: date.optional(),
  validTo: date.optional(),
  dependsOnCapabilities: z.array(id).max(100).optional(),
  substitutableBy: z.array(id).max(100).optional(),
})
const asset = z.strictObject({
  assetId: id,
  type: id,
  providedCapabilities: z.array(capability).max(150),
  currentState: z.enum(['READY', 'DEGRADED', 'FAILED']),
  currentReliability: probability,
  faults: z.array(z.strictObject({ faultId: id, code: id, severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']) })).max(100),
})
const action = z.strictObject({
  actionId: id,
  assetId: id,
  type: z.enum(['DIAGNOSE', 'LIMITED_REPAIR', 'FULL_REPAIR', 'EXTERNAL_REPAIR', 'CANNIBALIZE', 'DEFER', 'REPLACE']),
  requiredParts: z.array(part).max(100),
  producedParts: z.array(part).max(100).optional(),
  requiredSkills: z.array(skill).max(100),
  workshopHours: quantity,
  durationDistribution: distribution,
  successProbability: probability,
  resultingReliabilityDistribution: distribution,
  repeatFailureProbability: probability,
  dependsOnActionIds: z.array(id).max(150).optional(),
  incompatibleActionIds: z.array(id).max(150).optional(),
  replacementAssetType: id.optional(),
})
const settings = z.strictObject({
  maxCandidates: z.number().int().min(1).max(10000),
  maxSearchNodes: z.number().int().min(1).max(1000000),
  maxSolveTimeMs: z.number().int().min(1).max(120000),
  beamWidth: z.number().int().min(1).max(2048),
  simulationSamples: z.number().int().min(1).max(10000),
  seed: z.number().int().refine(Number.isSafeInteger, 'Safe integer required'),
  epsilon: z.number().finite().nonnegative().max(1),
})
const resources = z.strictObject({
  technicianHours: z.record(z.string(), quantity),
  workshopHours: quantity,
  spareParts: z.record(z.string(), quantity),
  replacementAssets: z.record(z.string(), quantity),
})
const schema = z
  .strictObject({
    scenarioId: id,
    asOf: date,
    capabilityDemand: z
      .array(
        z.strictObject({
          capabilityId: id,
          requiredQuantity: quantity,
          deadline: date,
          minimumReliability: probability.optional(),
          priority: quantity.optional(),
        })
      )
      .min(1)
      .max(150),
    assets: z.array(asset).max(500),
    recoveryActions: z.array(action).max(2500),
    resources,
    settings,
  })
  .superRefine((input, context) => {
    const assets = new Set(input.assets.map((a) => a.assetId))
    const actions = new Set(input.recoveryActions.map((a) => a.actionId))
    if (assets.size !== input.assets.length)
      context.addIssue({ code: 'custom', message: 'Duplicate asset ids', path: ['assets'] })
    if (actions.size !== input.recoveryActions.length)
      context.addIssue({ code: 'custom', message: 'Duplicate action ids', path: ['recoveryActions'] })
    for (let i = 0; i < input.recoveryActions.length; i++) {
      const a = input.recoveryActions[i]
      if (!assets.has(a.assetId))
        context.addIssue({ code: 'custom', message: 'Unknown asset id', path: ['recoveryActions', i, 'assetId'] })
      for (const ref of a.dependsOnActionIds ?? []) {
        if (!actions.has(ref))
          context.addIssue({
            code: 'custom',
            message: 'Unknown dependent action',
            path: ['recoveryActions', i, 'dependsOnActionIds'],
          })
      }
    }
  })
export type RRInputIssue = { path: string; message: string }
export function parseRRInput(value: unknown): { input?: ReadinessRecoveryInput; issues: RRInputIssue[] } {
  const parsed = schema.safeParse(value)
  if (parsed.success) return { input: parsed.data as ReadinessRecoveryInput, issues: [] }
  return {
    issues: parsed.error.issues.slice(0, 30).map((error) => ({
      path: error.path.reduce<string>((path, segment) => {
        if (typeof segment === 'number') return path + '[' + segment + ']'
        return path ? path + '.' + segment : String(segment)
      }, '') || 'root',
      message: error.code === 'too_small' && error.minimum === 0
        ? 'Expected a non-negative number.'
        : error.message,
    })),
  }
}
