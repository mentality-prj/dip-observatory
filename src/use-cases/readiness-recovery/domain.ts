export type AssetState = 'READY' | 'DEGRADED' | 'FAILED'
export type RecoveryActionType =
  'DIAGNOSE' | 'LIMITED_REPAIR' | 'FULL_REPAIR' | 'EXTERNAL_REPAIR' | 'CANNIBALIZE' | 'DEFER' | 'REPLACE'

export type NumericDistribution =
  | { kind: 'DETERMINISTIC'; value: number }
  | { kind: 'TRIANGULAR'; min: number; mode: number; max: number }
  | { kind: 'LOG_NORMAL'; mu: number; sigma: number }
  | { kind: 'EMPIRICAL'; values: number[] }

export type CapabilityDemand = { capabilityId: string; requiredQuantity: number; deadline: string; minimumReliability?: number; priority?: number }
export type AssetCapabilityContribution = { capabilityId: string; quantity: number; qualityFactor?: number; validFrom?: string; validTo?: string; dependsOnCapabilities?: string[]; substitutableBy?: string[] }
export type Fault = { faultId: string; code: string; severity: 'MINOR' | 'MAJOR' | 'CRITICAL' }
export type Asset = { assetId: string; type: string; providedCapabilities: AssetCapabilityContribution[]; currentState: AssetState; currentReliability: number; faults: Fault[] }
export type PartRequirement = { partId: string; quantity: number }
export type SkillRequirement = { skillId: string; technicianHours: number }
export type RecoveryAction = { actionId: string; assetId: string; type: RecoveryActionType; requiredParts: PartRequirement[]; producedParts?: PartRequirement[]; requiredSkills: SkillRequirement[]; workshopHours: number; durationDistribution: NumericDistribution; successProbability: number; resultingReliabilityDistribution: NumericDistribution; repeatFailureProbability: number; dependsOnActionIds?: string[]; incompatibleActionIds?: string[]; replacementAssetType?: string }
export type ResourcePool = { technicianHours: Record<string, number>; workshopHours: number; spareParts: Record<string, number>; replacementAssets: Record<string, number> }
export type PlannerSettings = { maxCandidates: number; maxSearchNodes: number; maxSolveTimeMs: number; beamWidth: number; simulationSamples: number; seed: number; epsilon: number }
export type ReadinessRecoveryInput = { scenarioId: string; asOf: string; capabilityDemand: CapabilityDemand[]; assets: Asset[]; recoveryActions: RecoveryAction[]; resources: ResourcePool; settings: PlannerSettings }
export type CandidatePlan = { id: string; selectedActionIds: string[]; proxyReadinessGain: number; technicianHours: number; workshopHours: number; partsConsumed: Record<string, number>; partsProduced: Record<string, number>; replacementAssetsConsumed: Record<string, number>; bindingConstraints: string[] }
export type ScenarioUncertaintySummary = { samples: number; seed: number; demandSatisfiedSamples: number; p10RecoveryTimeHours: number; p50RecoveryTimeHours: number; p90RecoveryTimeHours: number }
export type ScenarioLabel = 'MAXIMUM_READINESS' | 'FAST_RECOVERY' | 'PARTS_CONSERVATIVE' | 'LOW_RISK' | 'BALANCED'
export type RecoveryScenario = { scenarioId: string; label: ScenarioLabel; labels?: ScenarioLabel[]; selectedActions: string[]; expectedCapabilityReadiness: number; probabilityDemandSatisfied: number; capabilityShortfall: number; expectedRecoveryTimeHours: number; technicianHours: number; scarcePartsConsumed: number; recoveryFailureRisk: number; repeatFailureRisk: number; bottlenecks: string[]; bindingConstraints: string[]; uncertaintySummary: ScenarioUncertaintySummary; paretoExplanation: string; drivers: string[] }
export type BaselineKind = 'FIFO' | 'CRITICALITY' | 'GREEDY_READINESS' | 'RISK_AWARE_GREEDY' | 'LOOKAHEAD_2'
export type BaselineResult = { kind: BaselineKind; scenario: RecoveryScenario | null; infeasibleActionIds: string[] }
export type PlannerDiagnostics = { searchNodes: number; generatedCandidates: number; feasibleCandidates: number; evaluatedCandidates: number; dominatedPlansRemoved: number; elapsedMs: number; truncatedByNodeBudget: boolean; truncatedByTimeBudget: boolean }
export type RobustnessEvidence = { variantId: string; verdict: 'QDIP_ADVANTAGE' | 'HEURISTIC_PARITY' | 'HEURISTIC_ADVANTAGE' | 'INSUFFICIENT_EVIDENCE'; advantageKind: 'CAPABILITY' | 'EFFICIENCY' | 'NONE'; baselineKind: BaselineKind | null; probabilityDelta: number; shortfallReduction: number }
export type ReadinessRecoveryResult = { scenarioId: string; frontier: RecoveryScenario[]; baselines: BaselineResult[]; diagnostics: PlannerDiagnostics; inputSummary: { assets: number; impairedAssets: number; demands: number; actions: number }; robustness?: { retained: number; total: number; variants: RobustnessEvidence[] } }
export type FrontierChange = { metric: string; before: number; after: number; delta: number }
export type FrontierComparison = { previousCount: number; currentCount: number; changes: FrontierChange[]; explanation: string[] }

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = { maxCandidates: 180, maxSearchNodes: 25_000, maxSolveTimeMs: 8_000, beamWidth: 72, simulationSamples: 500, seed: 42_424, epsilon: 0.015 }
