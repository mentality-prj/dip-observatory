import type {
  DemandPoint,
  InventoryAllocation,
  Money,
  ProductClass,
  ScenarioOutcome,
  SupplyNode,
  SupplyResilienceAlternative,
  SupplyResilienceInput,
  SupplyResilienceScenario,
  SupplyRoute,
} from './domain'

const money = (amount: number): Money => ({ amount: Math.round(amount * 100) / 100, currency: 'UAH' })
const key = (nodeId: string, productClassId: string) => `${nodeId}:${productClassId}`

export type BaselineId = Extract<SupplyResilienceAlternative['id'], 'centralized-baseline' | 'equal-decentralization'>

export function createBaselineAllocation(input: SupplyResilienceInput, id: BaselineId): InventoryAllocation[] {
  const totals = new Map<string, number>()
  for (const product of input.productClasses) totals.set(product.id, input.nodes.reduce((sum, node) => sum + (node.inventoryUnits[product.id] ?? 0), 0))

  if (id === 'centralized-baseline') {
    return input.productClasses.flatMap((product) => {
      let remaining = totals.get(product.id) ?? 0
      return [...input.nodes]
        .filter((node) => node.supportedStorageClasses.includes(product.storageClass))
        .sort((a, b) => b.capacityUnits - a.capacityUnits)
        .map((node) => {
          const usedByOtherProducts = input.productClasses
            .filter((candidate) => candidate.id !== product.id)
            .reduce((sum, candidate) => sum + (node.inventoryUnits[candidate.id] ?? 0), 0)
          const units = Math.min(remaining, Math.max(0, node.capacityUnits - usedByOtherProducts))
          remaining -= units
          return { nodeId: node.id, productClassId: product.id, units }
        })
        .filter((allocation) => allocation.units > 0)
    })
  }

  return input.productClasses.flatMap((product) => {
    const compatible = input.nodes.filter((node) => node.supportedStorageClasses.includes(product.storageClass))
    let remaining = totals.get(product.id) ?? 0
    return compatible.map((node, index) => {
      const nodesLeft = compatible.length - index
      const units = Math.min(Math.floor(remaining / nodesLeft), node.capacityUnits)
      remaining -= units
      return { nodeId: node.id, productClassId: product.id, units }
    }).filter((allocation) => allocation.units > 0)
  })
}

function demandUnits(point: DemandPoint, product: ProductClass, days: number): number {
  return (point.demandPerDay[product.id] ?? 0) * days
}

function evaluateScenario(input: SupplyResilienceInput, allocation: readonly InventoryAllocation[], scenario: SupplyResilienceScenario): ScenarioOutcome {
  const unavailable = new Set(scenario.unavailableNodeIds)
  const stock = new Map(allocation.map((item) => [key(item.nodeId, item.productClassId), item.units]))
  let totalDemand = 0
  let served = 0
  let logisticsCost = 0
  let maxLeadTime = 0

  for (const point of input.demandPoints) {
    for (const product of input.productClasses) {
      const required = demandUnits(point, product, input.policy.planningHorizonDays)
      totalDemand += required
      let remaining = required
      const routes = input.routes
        .filter((route) => route.toDemandPointId === point.id && !unavailable.has(route.fromNodeId))
        .sort((a, b) => a.costPerUnit.amount - b.costPerUnit.amount || a.leadTimeDays - b.leadTimeDays)

      for (const route of routes) {
        if (remaining <= 0) break
        const stockKey = key(route.fromNodeId, product.id)
        const available = stock.get(stockKey) ?? 0
        const routeCapacity = route.capacityUnitsPerDay * input.policy.planningHorizonDays
        const shipped = Math.min(remaining, available, routeCapacity)
        if (shipped <= 0) continue
        stock.set(stockKey, available - shipped)
        remaining -= shipped
        served += shipped
        logisticsCost += shipped * route.costPerUnit.amount
        maxLeadTime = Math.max(maxLeadTime, route.leadTimeDays)
      }
    }
  }

  const inventoryValueAtRisk = allocation.reduce((sum, item) => {
    if (!unavailable.has(item.nodeId)) return sum
    const product = input.productClasses.find((candidate) => candidate.id === item.productClassId)
    return sum + item.units * (product?.unitValue.amount ?? 0)
  }, 0)

  return {
    scenarioId: scenario.id,
    serviceLevel: totalDemand === 0 ? 1 : served / totalDemand,
    unservedDemandUnits: totalDemand - served,
    inventoryValueAtRisk: money(inventoryValueAtRisk),
    recoveryTimeDays: totalDemand === served ? maxLeadTime : input.policy.planningHorizonDays,
    logisticsCost: money(logisticsCost),
  }
}

export function evaluateBaseline(input: SupplyResilienceInput, id: BaselineId): SupplyResilienceAlternative {
  const allocation = createBaselineAllocation(input, id)
  const scenarioOutcomes = input.scenarios.map((scenario) => evaluateScenario(input, allocation, scenario))
  const normal = scenarioOutcomes.find((outcome) => outcome.scenarioId === 'normal')?.logisticsCost.amount ?? 0
  const worstCaseBusinessLoss = Math.max(...scenarioOutcomes.map((outcome) => {
    const unservedValue = outcome.unservedDemandUnits * averageUnitValue(input.productClasses)
    return unservedValue + outcome.inventoryValueAtRisk.amount + outcome.logisticsCost.amount
  }))
  return {
    id,
    label: id === 'centralized-baseline' ? 'Centralized baseline' : 'Equal decentralization',
    allocation,
    transfers: [],
    scenarioOutcomes,
    worstCaseBusinessLoss: money(worstCaseBusinessLoss),
    incrementalLogisticsCost: money(Math.max(0, Math.max(...scenarioOutcomes.map((outcome) => outcome.logisticsCost.amount)) - normal)),
  }
}

function averageUnitValue(products: readonly ProductClass[]): number {
  return products.length === 0 ? 0 : products.reduce((sum, product) => sum + product.unitValue.amount, 0) / products.length
}
