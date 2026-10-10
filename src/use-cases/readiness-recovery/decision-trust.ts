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
