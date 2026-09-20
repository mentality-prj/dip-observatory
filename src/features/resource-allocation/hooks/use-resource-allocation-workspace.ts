"use client";

import { useMemo, useState } from "react";
import { buildResourceAllocationInput, runResourceAllocationScenario } from "../api";
import type { ResourceAllocationPeriodPlan, ResourceAllocationResult } from "../contracts";
import { RESOURCE_ALLOCATION_CURRENT as currentAllocation } from "../demo-data";
import type { EvaluatedManualAllocation } from "../components/resource-allocation-manual-editor";

const fallbackPlan = (result: ResourceAllocationResult): ResourceAllocationPeriodPlan => ({
  daily: result.daily,
  aggregate_metrics: result.aggregate_metrics,
  demand_summary: result.demand_summary,
  period_score: 0,
});

export function useResourceAllocationWorkspace() {
  const [result, setResult] = useState<ResourceAllocationResult | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacityFactor, setCapacityFactor] = useState(100);
  const [blockedCommunity, setBlockedCommunity] = useState("");
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);
  const [manualSelected, setManualSelected] = useState<EvaluatedManualAllocation | null>(null);
  const [runRevision, setRunRevision] = useState(0);

  async function run() {
    setRunning(true);
    setError(null);
    setManualSelected(null);
    const scenario = {
      capacity_factor: capacityFactor / 100,
      inaccessible_communities: blockedCommunity ? [blockedCommunity] : [],
    };
    try {
      const nextResult = await runResourceAllocationScenario(scenario);
      setResult(nextResult);
      setLastInput(buildResourceAllocationInput(scenario));
      setSelectedAlternative(0);
      setSelectedDay(0);
      setRunRevision((revision) => revision + 1);
    } catch (reason) {
      setResult(null);
      setLastInput(null);
      setError(reason instanceof Error ? reason.message : "DIP request failed");
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setCapacityFactor(100);
    setBlockedCommunity("");
    setResult(null);
    setLastInput(null);
    setManualSelected(null);
    setError(null);
    setSelectedAlternative(0);
    setSelectedDay(0);
  }

  function selectAlternative(index: number) {
    setSelectedAlternative(index);
    setSelectedDay(0);
    setManualSelected(null);
  }

  const activePlan = result
    ? (result.alternatives[selectedAlternative] ?? fallbackPlan(result))
    : null;
  const day = activePlan?.daily[selectedDay] ?? null;
  const moved = useMemo(
    () => day
      ? Object.entries(day.recommended.assignments).filter(
          ([team, target]) => currentAllocation[team] !== target,
        ).length
      : 0,
    [day],
  );

  return {
    result,
    activePlan,
    day,
    moved,
    selectedAlternative,
    selectedDay,
    running,
    error,
    capacityFactor,
    blockedCommunity,
    lastInput,
    manualSelected,
    runRevision,
    run,
    reset,
    selectAlternative,
    setSelectedDay,
    setCapacityFactor,
    setBlockedCommunity,
    setManualSelected,
  };
}
