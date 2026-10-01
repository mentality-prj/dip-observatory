export type EconomicValueInputs = {
  qdipRecoverySpend: number
  currentAllocationPremiumPct: number
  plannerHours: number
  plannerHourlyCost: number
  delayDays: number
  delayCostPerDay: number
  qdipOperatingCost: number
}

export type EconomicValueBoundary = {
  currentAllocationSpend: number
  currentProcessCost: number
  qdipProcessCost: number
  economicAdvantage: number
  economicAdvantagePct: number
  breakEvenAllocationPremiumPct: number
  status: 'POSITIVE_VALUE' | 'BREAK_EVEN' | 'NO_VALUE'
}

function finiteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0 ? value : 0
}

export function calculateEconomicValueBoundary(input: EconomicValueInputs): EconomicValueBoundary {
  const qdipRecoverySpend = finiteNonNegative(input.qdipRecoverySpend)
  const premiumPct = finiteNonNegative(input.currentAllocationPremiumPct)
  const plannerCost = finiteNonNegative(input.plannerHours) * finiteNonNegative(input.plannerHourlyCost)
  const delayCost = finiteNonNegative(input.delayDays) * finiteNonNegative(input.delayCostPerDay)
  const qdipOperatingCost = finiteNonNegative(input.qdipOperatingCost)

  const currentAllocationSpend = qdipRecoverySpend * (1 + premiumPct / 100)
  const currentProcessCost = currentAllocationSpend + plannerCost + delayCost
  const qdipProcessCost = qdipRecoverySpend + qdipOperatingCost
  const economicAdvantage = currentProcessCost - qdipProcessCost
  const economicAdvantagePct = currentProcessCost > 0 ? (economicAdvantage / currentProcessCost) * 100 : 0

  const nonAllocationValue = plannerCost + delayCost
  const premiumNeeded = qdipRecoverySpend > 0 ? ((qdipOperatingCost - nonAllocationValue) / qdipRecoverySpend) * 100 : 0
  const breakEvenAllocationPremiumPct = Math.max(0, premiumNeeded)
  const epsilon = 0.005
  const status =
    economicAdvantage > epsilon ? 'POSITIVE_VALUE' : economicAdvantage < -epsilon ? 'NO_VALUE' : 'BREAK_EVEN'

  return {
    currentAllocationSpend,
    currentProcessCost,
    qdipProcessCost,
    economicAdvantage,
    economicAdvantagePct,
    breakEvenAllocationPremiumPct,
    status,
  }
}
