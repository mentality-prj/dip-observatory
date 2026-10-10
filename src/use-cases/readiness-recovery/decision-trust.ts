import type { ReadinessRecoveryResult } from './domain'

/**
 * These claims are assigned by the trusted call site, NOT by response JSON.
 * The Observatory /readiness/scenarios route is a separate, simulated planner.
 * A future Kernel-backed route needs its own server-verified result contract.
 */
export type ObservatoryInputOrigin = 'SYNTHETIC_PRESET' | 'USER_IMPORTED'
export type ObservatoryResultState =
  | 'NOT_RUN'
  | 'CANDIDATES_AVAILABLE'
  | 'SEARCH_TRUNCATED'
  | 'NO_COMPARABLE_CANDIDATES'
  | 'INVALID_RESULT'

export type ObservatoryDecisionTrust = {
  origin: ObservatoryInputOrigin
  computeAuthority: 'OBSERVATORY_SIMULATION'
  validationScope: 'MODEL_ONLY'
  comparativeEvidence: 'EXPLORATORY'
  state: ObservatoryResultState
  productionApplyEligible: false
  actionRestriction: 'REVIEW_OR_EXPORT_ONLY'
}

/**
 * A decision-trust display, not a validation or an authorization grant.
 * No combination of client-controlled input or response fields can enable Apply.
 */
export function assessObservatoryDecision(
  origin: ObservatoryInputOrigin,
  result: ReadinessRecoveryResult | null
): ObservatoryDecisionTrust {
  let state: ObservatoryResultState = 'NOT_RUN'

  if (result !== null) {
    if (
      !result ||
      !Array.isArray(result.frontier) ||
      !result.diagnostics ||
      typeof result.diagnostics.truncatedByNodeBudget !== 'boolean' ||
      typeof result.diagnostics.truncatedByTimeBudget !== 'boolean'
    ) {
      state = 'INVALID_RESULT'
    } else if (result.diagnostics.truncatedByNodeBudget || result.diagnostics.truncatedByTimeBudget) {
      state = 'SEARCH_TRUNCATED'
    } else {
      state = result.frontier.length ? 'CANDIDATES_AVAILABLE' : 'NO_COMPARABLE_CANDIDATES'
    }
  }

  return {
    origin,
    computeAuthority: 'OBSERVATORY_SIMULATION',
    validationScope: 'MODEL_ONLY',
    comparativeEvidence: 'EXPLORATORY',
    state,
    productionApplyEligible: false,
    actionRestriction: 'REVIEW_OR_EXPORT_ONLY',
  }
}

/**
 * Runtime safety boundary for the separate Observatory route. Checks the fields
 * required by this UI before dereferencing them; this is NOT a proof that the
 * input model or output is semantically equivalent to Kernel RR.
 */
export function isObservatoryPlannerResult(value: unknown): value is ReadinessRecoveryResult {
  if (!record(value) || typeof value.scenarioId !== 'string' || !value.scenarioId.trim()) return false
  if (!Array.isArray(value.frontier) || !Array.isArray(value.baselines)) return false
  if (!record(value.diagnostics) || !record(value.inputSummary)) return false

  const diagnostics = value.diagnostics
  const summary = value.inputSummary
  for (const key of [
    'searchNodes', 'generatedCandidates', 'feasibleCandidates', 'evaluatedCandidates',
    'dominatedPlansRemoved', 'elapsedMs',
  ]) {
    if (!finiteNonnegative(diagnostics[key])) return false
  }
  if (typeof diagnostics.truncatedByNodeBudget !== 'boolean' || typeof diagnostics.truncatedByTimeBudget !== 'boolean') {
    return false
  }
  for (const key of ['assets', 'impairedAssets', 'demands', 'actions']) {
    if (!finiteNonnegative(summary[key])) return false
  }

  const validScenario = (scenario: unknown) => {
    if (!record(scenario) || typeof scenario.scenarioId !== 'string' || !scenario.scenarioId.trim()) return false
    if (!Array.isArray(scenario.selectedActions) || !scenario.selectedActions.every((id) => typeof id === 'string')) return false
    if (!Array.isArray(scenario.bottlenecks) || !Array.isArray(scenario.bindingConstraints) || !Array.isArray(scenario.drivers)) return false
    if (!record(scenario.uncertaintySummary)) return false
    for (const key of [
      'expectedCapabilityReadiness', 'probabilityDemandSatisfied', 'capabilityShortfall',
      'expectedRecoveryTimeHours', 'technicianHours', 'scarcePartsConsumed',
      'recoveryFailureRisk', 'repeatFailureRisk',
    ]) {
      if (!finiteNonnegative(scenario[key])) return false
    }
    for (const key of [
      'expectedCapabilityReadiness', 'probabilityDemandSatisfied',
      'recoveryFailureRisk', 'repeatFailureRisk',
    ]) {
      if (typeof scenario[key] !== 'number' || scenario[key] > 1) return false
    }
    const uncertainty = scenario.uncertaintySummary
    if (!Number.isInteger(uncertainty.samples) || !finiteNonnegative(uncertainty.samples) || uncertainty.samples === 0) {
      return false
    }
    if (typeof uncertainty.seed !== 'number' || !Number.isSafeInteger(uncertainty.seed)) return false
    for (const key of ['demandSatisfiedSamples', 'p10RecoveryTimeHours', 'p50RecoveryTimeHours', 'p90RecoveryTimeHours']) {
      if (!finiteNonnegative(uncertainty[key])) return false
    }
    if (uncertainty.demandSatisfiedSamples > uncertainty.samples) return false
    if (uncertainty.p10RecoveryTimeHours > uncertainty.p50RecoveryTimeHours ||
        uncertainty.p50RecoveryTimeHours > uncertainty.p90RecoveryTimeHours) return false
    return true
  }

  if (value.robustness !== undefined) {
    if (!record(value.robustness) || !Array.isArray(value.robustness.variants)) return false
    if (!finiteNonnegative(value.robustness.retained) || !finiteNonnegative(value.robustness.total)) return false
    if (value.robustness.retained > value.robustness.total ||
        value.robustness.total !== value.robustness.variants.length) return false
    if (!value.robustness.variants.every((variant) =>
      record(variant) && typeof variant.variantId === 'string' &&
      typeof variant.verdict === 'string' && typeof variant.advantageKind === 'string' &&
      (variant.baselineKind === null || typeof variant.baselineKind === 'string') &&
      typeof variant.probabilityDelta === 'number' && Number.isFinite(variant.probabilityDelta) &&
      typeof variant.shortfallReduction === 'number' && Number.isFinite(variant.shortfallReduction)
    )) return false
  }

  return (
    value.frontier.every(validScenario) &&
    value.baselines.every(
      (baseline) => record(baseline) && typeof baseline.kind === 'string' &&
        (baseline.scenario === null || validScenario(baseline.scenario)) &&
        Array.isArray(baseline.infeasibleActionIds)
    )
  )
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finiteNonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
