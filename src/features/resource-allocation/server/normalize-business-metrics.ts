type JsonObject = Record<string, unknown>

function object(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : null
}

function normalizePlan(value: unknown): unknown {
  const plan = object(value)
  if (!plan) return value

  const summary = object(plan.demand_summary)
  const aggregate = object(plan.aggregate_metrics)
  let normalizedAggregate = aggregate

  if (summary && aggregate) {
    const priorityCoverage = summary.priority_coverage
    const served = summary.served
    const totalAvailable = summary.total_available
    const totalCoverage =
      typeof served === 'number' && typeof totalAvailable === 'number' && totalAvailable > 0
        ? served / totalAvailable
        : aggregate.total_coverage

    normalizedAggregate = {
      ...aggregate,
      ...(typeof priorityCoverage === 'number' ? { priority_coverage: priorityCoverage } : {}),
      ...(typeof totalCoverage === 'number' ? { total_coverage: totalCoverage } : {}),
    }
  }

  return {
    ...plan,
    ...(normalizedAggregate ? { aggregate_metrics: normalizedAggregate } : {}),
    ...(Array.isArray(plan.alternatives)
      ? { alternatives: plan.alternatives.map((alternative) => normalizePlan(alternative)) }
      : {}),
  }
}

/**
 * The solver exposes aggregate_metrics as averages of daily diagnostics while
 * demand_summary contains outcomes over the complete planning horizon.
 * Client-facing Resource Allocation uses one semantic contract: coverage means
 * horizon coverage. Normalize at the Observatory API boundary so headers,
 * alternatives, manual comparisons and decision lifecycle cannot disagree.
 */
export function normalizeResourceAllocationBusinessMetrics(payload: unknown): unknown {
  const root = object(payload)
  if (!root) return payload

  if (root.operation === 'simulate' && root.result) {
    return { ...root, result: normalizePlan(root.result) }
  }

  return normalizePlan(root)
}
