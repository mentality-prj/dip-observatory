import type {
  ScheduledTask,
  SchedulingDecisionResponse,
} from "@/production-scheduling/types";

export interface FinancialImpactRow {
  id: "delay" | "overtime" | "setup" | "unused-capacity" | "total";
  label: string;
  pre: number;
  disrupted: number;
  recovery: number;
}

export interface DisruptionSchedulePresentation {
  recoverySchedule: ScheduledTask[];
  disruptedSchedule: ScheduledTask[];
  movedOrderIds: ReadonlySet<string>;
  rescuedOrderIds: ReadonlySet<string>;
  affectedLineId: string;
  isAffectedLineUnavailable: boolean;
}

function recommended(result: SchedulingDecisionResponse) {
  return result.strategies.find(
    (strategy) => strategy.strategyId === result.recommendedStrategy,
  );
}

function keepCurrent(result: SchedulingDecisionResponse) {
  return result.strategies.find(
    (strategy) => strategy.strategyId === "KEEP_CURRENT_SCHEDULE",
  );
}

export function buildDisruptionFinancialRows(
  preResult: SchedulingDecisionResponse,
  disruptedResult: SchedulingDecisionResponse,
): FinancialImpactRow[] {
  const pre = recommended(preResult)?.financialImpact;
  const disrupted = keepCurrent(disruptedResult)?.financialImpact;
  const recovery = recommended(disruptedResult)?.financialImpact;

  return [
    {
      id: "delay",
      label: "Delay cost",
      pre: pre?.delayCost ?? 0,
      disrupted: disrupted?.delayCost ?? 0,
      recovery: recovery?.delayCost ?? 0,
    },
    {
      id: "overtime",
      label: "Overtime cost",
      pre: pre?.overtimeCost ?? 0,
      disrupted: disrupted?.overtimeCost ?? 0,
      recovery: recovery?.overtimeCost ?? 0,
    },
    {
      id: "setup",
      label: "Setup / changeover",
      pre: pre?.setupCost ?? 0,
      disrupted: disrupted?.setupCost ?? 0,
      recovery: recovery?.setupCost ?? 0,
    },
    {
      id: "unused-capacity",
      label: "Unused capacity",
      pre: pre?.unusedCapacityCost ?? 0,
      disrupted: disrupted?.unusedCapacityCost ?? 0,
      recovery: recovery?.unusedCapacityCost ?? 0,
    },
    {
      id: "total",
      label: "Total impact",
      pre: pre?.totalCost ?? 0,
      disrupted: disrupted?.totalCost ?? 0,
      recovery: recovery?.totalCost ?? 0,
    },
  ];
}

export function getAvoidedDisruptionImpact(
  disruptedResult: SchedulingDecisionResponse,
) {
  const disruptedCost = keepCurrent(disruptedResult)?.financialImpact.totalCost ?? 0;
  const recoveryCost = recommended(disruptedResult)?.financialImpact.totalCost ?? 0;
  return Math.max(0, disruptedCost - recoveryCost);
}

export function buildDisruptionSchedulePresentation(
  disruptedResult: SchedulingDecisionResponse,
): DisruptionSchedulePresentation {
  const recoverySchedule = recommended(disruptedResult)?.schedule ?? [];
  const disruptedSchedule = keepCurrent(disruptedResult)?.schedule ?? [];
  const disruptedByOrder = new Map(
    disruptedSchedule.map((task) => [task.orderId, task] as const),
  );
  const movedOrderIds = new Set<string>();
  const rescuedOrderIds = new Set<string>();

  for (const task of recoverySchedule) {
    const baselineTask = disruptedByOrder.get(task.orderId);
    if (!baselineTask) continue;
    if (baselineTask.lineId !== task.lineId) movedOrderIds.add(task.orderId);
    if (baselineTask.status !== "ON_TIME" && task.status === "ON_TIME") {
      rescuedOrderIds.add(task.orderId);
    }
  }

  const disruption = disruptedResult.scenarioSnapshot.disruption;
  return {
    recoverySchedule,
    disruptedSchedule,
    movedOrderIds,
    rescuedOrderIds,
    affectedLineId: disruption.affectedLineId,
    isAffectedLineUnavailable: disruption.capacityReductionFactor >= 1,
  };
}
