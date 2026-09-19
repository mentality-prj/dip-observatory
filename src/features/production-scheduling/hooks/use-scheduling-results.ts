"use client";

import { useMemo } from "react";

import {
  buildPdrScenario,
  getOrdersAtRisk,
  getPdrPreDisruptionDecision,
  type DisruptionWhatIfState,
} from "@/production-scheduling/data/production-disruption-scenario";
import { DEFAULT_SCENARIO } from "@/production-scheduling/data/scenario";
import {
  DEFAULT_COST_CONFIG,
  runSchedulingEngine,
} from "@/production-scheduling/lib/engine";
import {
  BASELINE_WHAT_IF,
  buildCostConfigOverride,
  buildSchedulingScenario,
  type WhatIfState,
} from "@/production-scheduling/lib/what-if";

/**
 * Pure derived-results boundary for the scheduling feature.
 *
 * The ViewModel owns interaction state and orchestration. Engine execution and
 * result derivation live here so neither the container nor views need to know
 * how scheduling scenarios are assembled or evaluated.
 */
export function useSchedulingResults(
  whatIf: WhatIfState,
  disruptionWhatIf: DisruptionWhatIfState,
) {
  const baselineResult = useMemo(
    () =>
      runSchedulingEngine({
        scenario: DEFAULT_SCENARIO,
        costConfig: DEFAULT_COST_CONFIG,
      }),
    [],
  );

  const scenarioResult = useMemo(() => {
    const scenario = buildSchedulingScenario(DEFAULT_SCENARIO, whatIf);
    return runSchedulingEngine({
      scenario,
      costConfig: {
        ...DEFAULT_COST_CONFIG,
        ...buildCostConfigOverride(whatIf),
      },
    });
  }, [whatIf]);

  const isBaseline = useMemo(
    () => JSON.stringify(whatIf) === JSON.stringify(BASELINE_WHAT_IF),
    [whatIf],
  );

  const preDisruptionResult = useMemo(() => getPdrPreDisruptionDecision(), []);

  const disruptedResult = useMemo(() => {
    const { scenario, costConfigOverride } = buildPdrScenario(disruptionWhatIf);
    return runSchedulingEngine({
      scenario,
      costConfig: {
        ...DEFAULT_COST_CONFIG,
        ...costConfigOverride,
      },
    });
  }, [disruptionWhatIf]);

  const ordersAtRisk = useMemo(
    () => getOrdersAtRisk(disruptedResult),
    [disruptedResult],
  );

  return {
    baselineResult,
    scenarioResult,
    displayResult: isBaseline ? baselineResult : scenarioResult,
    isBaseline,
    preDisruptionResult,
    disruptedResult,
    ordersAtRisk,
  } as const;
}

export type SchedulingResults = ReturnType<typeof useSchedulingResults>;
