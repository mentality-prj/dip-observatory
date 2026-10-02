import type { ReadinessRecoveryInput, RecoveryAction } from './domain'

function isoAfter(asOf: string, hours: number) {
  return new Date(Date.parse(asOf) + hours * 3_600_000).toISOString()
}

/**
 * Turns the normal 100-asset demo fleet into a fair combinatorial benchmark.
 * Nothing here is QDIP-only: every generated action remains in the common
 * ReadinessRecoveryInput consumed by the optimizer and every baseline.
 */
export function applyCascadingResourceConflict(input: ReadinessRecoveryInput) {
  input.scenarioId = 'readiness-cascading-resource-conflict'

  // Two operational horizons. The first makes long repairs unattractive even
  // when their isolated capability gain is high; the second requires a wider
  // portfolio instead of a single critical repair.
  input.capabilityDemand = [
    { capabilityId: 'CAP-1', requiredQuantity: 19.4, deadline: isoAfter(input.asOf, 14), minimumReliability: 0.62, priority: 1.5 },
    { capabilityId: 'CAP-2', requiredQuantity: 19.1, deadline: isoAfter(input.asOf, 14), minimumReliability: 0.62, priority: 1.4 },
    { capabilityId: 'CAP-3', requiredQuantity: 20.2, deadline: isoAfter(input.asOf, 30), minimumReliability: 0.65, priority: 1.2 },
    { capabilityId: 'CAP-4', requiredQuantity: 19.3, deadline: isoAfter(input.asOf, 30), minimumReliability: 0.65, priority: 1.1 },
  ]

  // Keep a bounded but non-trivial common action space. This avoids making the
  // benchmark hard merely by adding irrelevant actions.
  const benchmarkAssets = new Set([
    'ASSET-001', 'ASSET-002', 'ASSET-003', 'ASSET-004', 'ASSET-006', 'ASSET-007',
    'ASSET-008', 'ASSET-009', 'ASSET-011', 'ASSET-012', 'ASSET-013', 'ASSET-016',
    'ASSET-017', 'ASSET-018', 'ASSET-021', 'ASSET-022', 'ASSET-026', 'ASSET-027',
    'ASSET-029', 'ASSET-030', 'ASSET-100',
  ])
  input.recoveryActions = input.recoveryActions.filter((action) => benchmarkAssets.has(action.assetId))

  // Shared scarce parts: a locally attractive full repair competes with
  // several smaller repairs for the same material.
  input.resources.spareParts['PART-SCARCE-A'] = 2
  input.resources.spareParts['PART-SCARCE-B'] = 1
  input.resources.spareParts['PART-DONOR'] = 0
  input.resources.workshopHours = 54
  input.resources.technicianHours = {
    ...input.resources.technicianHours,
    mechanical: 24,
    electrical: 20,
    diagnostics: 13,
    controls: 18,
  }

  const scarceA = new Set(['ASSET-001', 'ASSET-006', 'ASSET-011', 'ASSET-016'])
  const scarceB = new Set(['ASSET-002', 'ASSET-007', 'ASSET-012'])
  for (const action of input.recoveryActions) {
    if (action.type !== 'LIMITED_REPAIR' && action.type !== 'FULL_REPAIR') continue
    if (scarceA.has(action.assetId)) action.requiredParts = [{ partId: 'PART-SCARCE-A', quantity: action.type === 'FULL_REPAIR' ? 2 : 1 }]
    if (scarceB.has(action.assetId)) action.requiredParts = [{ partId: 'PART-SCARCE-B', quantity: 1 }]

    // Full repairs offer strong isolated outcomes but consume the bottleneck
    // skill/workshop capacity and have stochastic duration beyond T1.
    if (action.type === 'FULL_REPAIR' && (scarceA.has(action.assetId) || scarceB.has(action.assetId))) {
      action.requiredSkills = [{ skillId: 'diagnostics', technicianHours: 7 }, { skillId: 'mechanical', technicianHours: 7 }]
      action.workshopHours = 11
      action.durationDistribution = { kind: 'TRIANGULAR', min: 12, mode: 18, max: 27 }
      action.successProbability = 0.7
      action.repeatFailureProbability = 0.08
    }
    if (action.type === 'LIMITED_REPAIR' && (scarceA.has(action.assetId) || scarceB.has(action.assetId))) {
      action.requiredSkills = [{ skillId: action.assetId.endsWith('2') || action.assetId.endsWith('7') ? 'electrical' : 'mechanical', technicianHours: 4 }]
      action.workshopHours = 3
      action.durationDistribution = { kind: 'TRIANGULAR', min: 5, mode: 7, max: 10 }
      action.successProbability = 0.92
      action.repeatFailureProbability = 0.13
    }
  }

  // A donor can unlock three repairs, but its own CAP-2/CAP-4 contribution is
  // sacrificed. The action and dependency graph are visible to every method.
  const donor = input.assets.find((asset) => asset.assetId === 'ASSET-100')
  if (donor) {
    donor.currentState = 'FAILED'
    donor.currentReliability = 0
    donor.faults = [{ faultId: 'FAULT-100', code: 'DONOR-CASCADE', severity: 'CRITICAL' }]
    donor.providedCapabilities = [
      { capabilityId: 'CAP-2', quantity: 0.9, qualityFactor: 1 },
      { capabilityId: 'CAP-4', quantity: 0.55, qualityFactor: 0.9 },
    ]
  }
  input.recoveryActions = input.recoveryActions.filter((action) => action.assetId !== 'ASSET-100')
  const donorAction: RecoveryAction = {
    actionId: 'ASSET-100:cannibalize-cascade',
    assetId: 'ASSET-100',
    type: 'CANNIBALIZE',
    requiredParts: [],
    producedParts: [{ partId: 'PART-DONOR', quantity: 3 }],
    requiredSkills: [{ skillId: 'mechanical', technicianHours: 3 }],
    workshopHours: 1,
    durationDistribution: { kind: 'DETERMINISTIC', value: 3 },
    successProbability: 1,
    resultingReliabilityDistribution: { kind: 'DETERMINISTIC', value: 0 },
    repeatFailureProbability: 0,
  }
  const donorTargets: RecoveryAction[] = ['ASSET-003', 'ASSET-008', 'ASSET-013'].map((assetId, index) => ({
    actionId: `${assetId}:cascade-donor-repair`,
    assetId,
    type: 'LIMITED_REPAIR',
    requiredParts: [{ partId: 'PART-DONOR', quantity: 1 }],
    requiredSkills: [{ skillId: index === 1 ? 'electrical' : 'mechanical', technicianHours: 4 }],
    workshopHours: 3,
    durationDistribution: { kind: 'TRIANGULAR', min: 5 + index, mode: 7 + index, max: 10 + index },
    successProbability: 0.93 - index * 0.02,
    resultingReliabilityDistribution: { kind: 'TRIANGULAR', min: 0.72, mode: 0.82, max: 0.9 },
    repeatFailureProbability: 0.1 + index * 0.02,
    dependsOnActionIds: [donorAction.actionId],
  }))
  input.recoveryActions = input.recoveryActions.filter(
    (action) => !donorTargets.some((target) => target.assetId === action.assetId)
  )
  input.recoveryActions.push(donorAction, ...donorTargets)

  // Make several assets genuinely multi-capability so local one-dimensional
  // gain is not equivalent to portfolio value.
  for (const [assetId, contributions] of Object.entries({
    'ASSET-003': [['CAP-1', 0.8], ['CAP-3', 0.75]],
    'ASSET-008': [['CAP-2', 0.85], ['CAP-4', 0.7]],
    'ASSET-013': [['CAP-1', 0.55], ['CAP-4', 0.9]],
    'ASSET-016': [['CAP-1', 1.15], ['CAP-2', 0.25]],
  }) as [string, [string, number][]][]) {
    const asset = input.assets.find((candidate) => candidate.assetId === assetId)
    if (asset) asset.providedCapabilities = contributions.map(([capabilityId, quantity]) => ({ capabilityId, quantity, qualityFactor: 1 }))
  }

  input.settings = {
    ...input.settings,
    maxCandidates: 120,
    beamWidth: 72,
    maxSearchNodes: 35_000,
    maxSolveTimeMs: 6_000,
    simulationSamples: 240,
    seed: 84_211,
  }
}

export const CASCADING_ROBUSTNESS_VARIANTS = [
  { id: 'base', changes: {} },
  { id: 'deadline-minus-10', changes: { deadlinePct: 90 } },
  { id: 'deadline-plus-10', changes: { deadlinePct: 110 } },
  { id: 'technicians-minus-20', changes: { technicianPct: 80 } },
  { id: 'parts-minus-20', changes: { partsPct: 80 } },
  { id: 'success-minus-10', changes: { successPct: 90 } },
  { id: 'success-plus-10', changes: { successPct: 110 } },
] as const
