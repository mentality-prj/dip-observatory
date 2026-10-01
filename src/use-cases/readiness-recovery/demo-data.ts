import {
  DEFAULT_PLANNER_SETTINGS,
  type Asset,
  type CapabilityDemand,
  type ReadinessRecoveryInput,
  type RecoveryAction,
  type ResourcePool,
} from './domain'

export type ReadinessRecoveryDemoPreset =
  | 'BALANCED'
  | 'SCARCE_PART'
  | 'LOW_SUCCESS_CRITICAL'
  | 'CANNIBALIZATION'
  | 'DEADLINE_PRESSURE'
  | 'DEMAND_SHIFT'
  | 'CAPABILITY_RESCUE'

export const READINESS_RECOVERY_DEMO_PRESETS: readonly ReadinessRecoveryDemoPreset[] = [
  'BALANCED',
  'SCARCE_PART',
  'LOW_SUCCESS_CRITICAL',
  'CANNIBALIZATION',
  'DEADLINE_PRESSURE',
  'DEMAND_SHIFT',
  'CAPABILITY_RESCUE',
]

const CAPABILITIES = ['CAP-1', 'CAP-2', 'CAP-3', 'CAP-4', 'CAP-5'] as const
const SKILLS = ['mechanical', 'electrical', 'hydraulic', 'controls', 'structural', 'diagnostics'] as const
const ASSET_TYPES = ['TYPE-A', 'TYPE-B', 'TYPE-C', 'TYPE-D', 'TYPE-E', 'TYPE-F', 'TYPE-G', 'TYPE-H'] as const

function isoAfter(asOf: string, hours: number) {
  return new Date(Date.parse(asOf) + hours * 3_600_000).toISOString()
}

function buildAssets(): Asset[] {
  return Array.from({ length: 100 }, (_, offset) => {
    const index = offset + 1
    const type = ASSET_TYPES[offset % ASSET_TYPES.length]
    const currentState: Asset['currentState'] = index <= 15 ? 'FAILED' : index <= 30 ? 'DEGRADED' : 'READY'
    const primaryCapability = CAPABILITIES[offset % CAPABILITIES.length]
    const secondaryCapability = CAPABILITIES[(offset + 2) % CAPABILITIES.length]
    return {
      assetId: `ASSET-${String(index).padStart(3, '0')}`,
      type,
      currentState,
      currentReliability: currentState === 'READY' ? 0.96 : currentState === 'DEGRADED' ? 0.62 : 0,
      faults:
        currentState === 'READY'
          ? []
          : [
              {
                faultId: `FAULT-${String(index).padStart(3, '0')}`,
                code: `F-${(index % 12) + 1}`,
                severity: currentState === 'FAILED' ? 'CRITICAL' : index % 3 === 0 ? 'MAJOR' : 'MINOR',
              },
            ],
      providedCapabilities: [
        { capabilityId: primaryCapability, quantity: 1, qualityFactor: 1 },
        { capabilityId: secondaryCapability, quantity: 0.35, qualityFactor: 0.9 },
      ],
    }
  })
}

function buildActions(assets: Asset[]): RecoveryAction[] {
  return assets.flatMap((asset, offset) => {
    if (asset.currentState === 'READY') return []
    const index = offset + 1
    const skill = SKILLS[offset % SKILLS.length]
    const partA = `PART-${String((index % 25) + 1).padStart(2, '0')}`
    const partB = `PART-${String(((index + 7) % 25) + 1).padStart(2, '0')}`
    const limited: RecoveryAction = {
      actionId: `${asset.assetId}:limited`,
      assetId: asset.assetId,
      type: 'LIMITED_REPAIR',
      requiredParts: [{ partId: partA, quantity: 1 }],
      requiredSkills: [{ skillId: skill, technicianHours: 3 + (index % 4) }],
      workshopHours: 2 + (index % 3),
      durationDistribution: { kind: 'TRIANGULAR', min: 5, mode: 9 + (index % 5), max: 17 + (index % 7) },
      successProbability: 0.82 + (index % 5) * 0.025,
      resultingReliabilityDistribution: { kind: 'TRIANGULAR', min: 0.66, mode: 0.76, max: 0.86 },
      repeatFailureProbability: 0.12 + (index % 4) * 0.025,
    }
    const full: RecoveryAction = {
      actionId: `${asset.assetId}:full`,
      assetId: asset.assetId,
      type: 'FULL_REPAIR',
      requiredParts: [
        { partId: partA, quantity: 1 },
        { partId: partB, quantity: 1 },
      ],
      requiredSkills: [
        { skillId: skill, technicianHours: 6 + (index % 5) },
        { skillId: 'diagnostics', technicianHours: 1.5 },
      ],
      workshopHours: 5 + (index % 4),
      durationDistribution: { kind: 'LOG_NORMAL', mu: Math.log(16 + (index % 8)), sigma: 0.24 },
      successProbability: 0.9 + (index % 4) * 0.02,
      resultingReliabilityDistribution: { kind: 'TRIANGULAR', min: 0.86, mode: 0.94, max: 0.99 },
      repeatFailureProbability: 0.035 + (index % 3) * 0.015,
    }
    const external: RecoveryAction = {
      actionId: `${asset.assetId}:external`,
      assetId: asset.assetId,
      type: 'EXTERNAL_REPAIR',
      requiredParts: [],
      requiredSkills: [{ skillId: 'diagnostics', technicianHours: 1 }],
      workshopHours: 0,
      durationDistribution: { kind: 'EMPIRICAL', values: [20, 28, 34, 44] },
      successProbability: 0.96,
      resultingReliabilityDistribution: { kind: 'TRIANGULAR', min: 0.9, mode: 0.96, max: 0.995 },
      repeatFailureProbability: 0.025,
    }
    const defer: RecoveryAction = {
      actionId: `${asset.assetId}:defer`,
      assetId: asset.assetId,
      type: 'DEFER',
      requiredParts: [],
      requiredSkills: [],
      workshopHours: 0,
      durationDistribution: { kind: 'DETERMINISTIC', value: 0 },
      successProbability: 1,
      resultingReliabilityDistribution: { kind: 'DETERMINISTIC', value: asset.currentReliability },
      repeatFailureProbability: 0,
    }
    return [limited, full, external, defer]
  })
}

function baseDemands(asOf: string): CapabilityDemand[] {
  return CAPABILITIES.map((capabilityId, index) => ({
    capabilityId,
    requiredQuantity: 19 + (index % 3),
    deadline: isoAfter(asOf, 48 + index * 6),
    minimumReliability: 0.65,
    priority: index === 0 ? 1.4 : 1,
  }))
}

function baseResources(): ResourcePool {
  return {
    technicianHours: Object.fromEntries(SKILLS.map((skill, index) => [skill, 75 + index * 7])),
    workshopHours: 155,
    spareParts: Object.fromEntries(
      Array.from({ length: 25 }, (_, index) => [`PART-${String(index + 1).padStart(2, '0')}`, 4 + (index % 4)])
    ),
    replacementAssets: Object.fromEntries(ASSET_TYPES.map((type, index) => [type, index % 3 === 0 ? 1 : 0])),
  }
}

function cloneInput(input: ReadinessRecoveryInput): ReadinessRecoveryInput {
  return structuredClone(input)
}

function applyScarcePart(input: ReadinessRecoveryInput) {
  input.resources.spareParts['PART-03'] = 1
  for (const action of input.recoveryActions.filter(
    (candidate) => candidate.assetId.endsWith('002') || candidate.assetId.endsWith('027')
  )) {
    if (action.type === 'LIMITED_REPAIR' || action.type === 'FULL_REPAIR') {
      action.requiredParts = [{ partId: 'PART-03', quantity: 1 }]
    }
  }
}

function applyLowSuccessCritical(input: ReadinessRecoveryInput) {
  input.capabilityDemand[0].requiredQuantity += 2
  const criticalAssetIds = input.assets
    .filter(
      (asset) =>
        asset.currentState !== 'READY' && asset.providedCapabilities.some((item) => item.capabilityId === 'CAP-1')
    )
    .slice(0, 4)
    .map((asset) => asset.assetId)
  for (const action of input.recoveryActions) {
    if (criticalAssetIds.includes(action.assetId) && action.type === 'FULL_REPAIR') {
      action.successProbability = 0.42
      action.resultingReliabilityDistribution = { kind: 'TRIANGULAR', min: 0.9, mode: 0.97, max: 1 }
    }
  }
}

function applyCannibalization(input: ReadinessRecoveryInput) {
  const donor = input.assets.find((asset) => asset.assetId === 'ASSET-100')
  if (!donor) return
  donor.currentState = 'FAILED'
  donor.currentReliability = 0
  donor.faults = [{ faultId: 'FAULT-100', code: 'DONOR', severity: 'CRITICAL' }]
  const donorAction: RecoveryAction = {
    actionId: 'ASSET-100:cannibalize',
    assetId: 'ASSET-100',
    type: 'CANNIBALIZE',
    requiredParts: [],
    producedParts: [{ partId: 'PART-24', quantity: 2 }],
    requiredSkills: [{ skillId: 'mechanical', technicianHours: 3 }],
    workshopHours: 1,
    durationDistribution: { kind: 'DETERMINISTIC', value: 3 },
    successProbability: 1,
    resultingReliabilityDistribution: { kind: 'DETERMINISTIC', value: 0 },
    repeatFailureProbability: 0,
  }
  input.recoveryActions.push(donorAction)
  input.resources.spareParts['PART-24'] = 0
  for (const assetId of ['ASSET-004', 'ASSET-009']) {
    const action = input.recoveryActions.find(
      (candidate) => candidate.assetId === assetId && candidate.type === 'LIMITED_REPAIR'
    )
    if (action) {
      action.requiredParts = [{ partId: 'PART-24', quantity: 1 }]
      action.dependsOnActionIds = [donorAction.actionId]
      action.successProbability = 0.94
    }
  }
}

function applyDeadlinePressure(input: ReadinessRecoveryInput) {
  for (const demand of input.capabilityDemand) demand.deadline = isoAfter(input.asOf, 18)
}

function applyDemandShift(input: ReadinessRecoveryInput) {
  input.capabilityDemand = input.capabilityDemand.map((demand) =>
    demand.capabilityId === 'CAP-5'
      ? { ...demand, requiredQuantity: demand.requiredQuantity + 6, priority: 1.7 }
      : demand.capabilityId === 'CAP-1'
        ? { ...demand, requiredQuantity: Math.max(6, demand.requiredQuantity - 5), priority: 0.8 }
        : demand
  )
}

function applyCapabilityRescue(input: ReadinessRecoveryInput) {
  input.scenarioId = 'readiness-capability-rescue'
  input.capabilityDemand = [
    {
      capabilityId: 'CAP-1',
      requiredQuantity: 21.7,
      deadline: isoAfter(input.asOf, 16),
      minimumReliability: 0.6,
      priority: 2,
    },
  ]

  const cap1Assets = new Set(
    input.assets
      .filter((asset) => asset.providedCapabilities.some((contribution) => contribution.capabilityId === 'CAP-1'))
      .map((asset) => asset.assetId)
  )
  const protectedAssets = new Set(['ASSET-001', 'ASSET-006', 'ASSET-100'])
  input.recoveryActions = input.recoveryActions.filter(
    (action) => !cap1Assets.has(action.assetId) && !protectedAssets.has(action.assetId)
  )

  const donor = input.assets.find((asset) => asset.assetId === 'ASSET-100')
  if (donor) {
    donor.currentState = 'FAILED'
    donor.currentReliability = 0
    donor.faults = [{ faultId: 'FAULT-100', code: 'DONOR-WOW', severity: 'CRITICAL' }]
  }

  const donorAction: RecoveryAction = {
    actionId: 'ASSET-100:cannibalize-rescue',
    assetId: 'ASSET-100',
    type: 'CANNIBALIZE',
    requiredParts: [],
    producedParts: [{ partId: 'PART-RESCUE', quantity: 2 }],
    requiredSkills: [{ skillId: 'mechanical', technicianHours: 2 }],
    workshopHours: 1,
    durationDistribution: { kind: 'DETERMINISTIC', value: 2 },
    successProbability: 1,
    resultingReliabilityDistribution: { kind: 'DETERMINISTIC', value: 0 },
    repeatFailureProbability: 0,
  }
  const targetActions: RecoveryAction[] = ['ASSET-001', 'ASSET-006'].map((assetId, index) => ({
    actionId: `${assetId}:rescue-repair`,
    assetId,
    type: 'LIMITED_REPAIR',
    requiredParts: [{ partId: 'PART-RESCUE', quantity: 1 }],
    requiredSkills: [{ skillId: index === 0 ? 'mechanical' : 'electrical', technicianHours: 4 }],
    workshopHours: 3,
    durationDistribution: { kind: 'TRIANGULAR', min: 6 + index, mode: 8 + index, max: 10 + index },
    successProbability: 0.98,
    resultingReliabilityDistribution: { kind: 'TRIANGULAR', min: 0.92, mode: 0.96, max: 0.99 },
    repeatFailureProbability: 0.01,
    dependsOnActionIds: [donorAction.actionId],
  }))

  input.recoveryActions.push(donorAction, ...targetActions)
  input.resources.spareParts['PART-RESCUE'] = 0
  input.resources.workshopHours = Math.min(input.resources.workshopHours, 40)
  input.settings = {
    ...input.settings,
    maxCandidates: 72,
    beamWidth: 48,
    simulationSamples: 180,
    maxSolveTimeMs: 4_500,
    seed: 73_001,
  }
}

export function buildReadinessRecoveryDemo(preset: ReadinessRecoveryDemoPreset): ReadinessRecoveryInput {
  const asOf = '2026-10-01T08:00:00.000Z'
  const assets = buildAssets()
  const base: ReadinessRecoveryInput = {
    scenarioId: `readiness-${preset.toLowerCase()}`,
    asOf,
    capabilityDemand: baseDemands(asOf),
    assets,
    recoveryActions: buildActions(assets),
    resources: baseResources(),
    settings: {
      ...DEFAULT_PLANNER_SETTINGS,
      maxCandidates: 90,
      maxSolveTimeMs: 4_500,
      beamWidth: 48,
      simulationSamples: 120,
    },
  }
  const input = cloneInput(base)
  if (preset === 'SCARCE_PART') applyScarcePart(input)
  if (preset === 'LOW_SUCCESS_CRITICAL') applyLowSuccessCritical(input)
  if (preset === 'CANNIBALIZATION') applyCannibalization(input)
  if (preset === 'DEADLINE_PRESSURE') applyDeadlinePressure(input)
  if (preset === 'DEMAND_SHIFT') applyDemandShift(input)
  if (preset === 'CAPABILITY_RESCUE') applyCapabilityRescue(input)
  return input
}

export function applySensitivity(
  source: ReadinessRecoveryInput,
  changes: {
    deadlineHours?: number
    technicianCapacityPct?: number
    sparePartsPct?: number
    successProbabilityPct?: number
  }
) {
  const input = cloneInput(source)
  if (changes.deadlineHours != null) {
    input.capabilityDemand = input.capabilityDemand.map((demand) => ({
      ...demand,
      deadline: isoAfter(input.asOf, changes.deadlineHours!),
    }))
  }
  if (changes.technicianCapacityPct != null) {
    const multiplier = changes.technicianCapacityPct / 100
    input.resources.technicianHours = Object.fromEntries(
      Object.entries(input.resources.technicianHours).map(([skill, hours]) => [skill, Math.max(0, hours * multiplier)])
    )
  }
  if (changes.sparePartsPct != null) {
    const multiplier = changes.sparePartsPct / 100
    input.resources.spareParts = Object.fromEntries(
      Object.entries(input.resources.spareParts).map(([part, quantity]) => [
        part,
        Math.max(0, Math.floor(quantity * multiplier)),
      ])
    )
  }
  if (changes.successProbabilityPct != null) {
    const multiplier = changes.successProbabilityPct / 100
    input.recoveryActions = input.recoveryActions.map((action) => ({
      ...action,
      successProbability: Math.max(0, Math.min(1, action.successProbability * multiplier)),
    }))
  }
  return input
}
