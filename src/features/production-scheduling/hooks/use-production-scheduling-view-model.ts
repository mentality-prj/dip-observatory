"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import { DEFAULT_SCENARIO, SCENARIO_PRESETS } from "@/production-scheduling/data/scenario";
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
import {
  BASELINE_DISRUPTION_WHAT_IF,
  buildPdrScenario,
  getOrdersAtRisk,
  getPdrPreDisruptionDecision,
  type DisruptionWhatIfState,
} from "@/production-scheduling/lib/production-disruption";

export type SimulationStep = "idle" | "event" | "impact" | "decision" | "complete";
export type DisruptionSimulationStep =
  | "idle"
  | "detected"
  | "impact"
  | "evaluating"
  | "complete";

export function useProductionSchedulingViewModel(locale: Locale) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [activePresetId, setActivePresetId] = useState(
    () => searchParams.get("scenario") ?? "baseline",
  );
  const [whatIf, setWhatIf] = useState<WhatIfState>(() => {
    const id = searchParams.get("scenario");
    if (id && id !== "production-disruption") {
      return SCENARIO_PRESETS.find((preset) => preset.id === id)?.state ?? BASELINE_WHAT_IF;
    }
    return BASELINE_WHAT_IF;
  });
  const [simulationStep, setSimulationStep] = useState<SimulationStep>("idle");
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [disruptionStep, setDisruptionStep] = useState<DisruptionSimulationStep>(
    () => (searchParams.get("scenario") === "production-disruption" ? "complete" : "idle"),
  );
  const [disruptionShowFullPlan, setDisruptionShowFullPlan] = useState(
    () => searchParams.get("scenario") === "production-disruption",
  );
  const [disruptionWhatIf, setDisruptionWhatIf] = useState<DisruptionWhatIfState>(
    BASELINE_DISRUPTION_WHAT_IF,
  );

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const baselineResult = useMemo(
    () => runSchedulingEngine({ scenario: DEFAULT_SCENARIO, costConfig: DEFAULT_COST_CONFIG }),
    [],
  );
  const scenarioResult = useMemo(() => {
    const scenario = buildSchedulingScenario(DEFAULT_SCENARIO, whatIf);
    return runSchedulingEngine({
      scenario,
      costConfig: { ...DEFAULT_COST_CONFIG, ...buildCostConfigOverride(whatIf) },
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
      costConfig: { ...DEFAULT_COST_CONFIG, ...costConfigOverride },
    });
  }, [disruptionWhatIf]);
  const ordersAtRisk = useMemo(() => getOrdersAtRisk(disruptedResult), [disruptedResult]);

  const replaceScenarioQuery = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "baseline") params.delete("scenario");
      else params.set("scenario", id);
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const applyPreset = useCallback(
    (preset: (typeof SCENARIO_PRESETS)[number]) => {
      clearTimers();
      setSimulationStep("idle");
      setShowFullPlan(false);
      setActivePresetId(preset.id);
      if (preset.id === "production-disruption") {
        setDisruptionStep("idle");
        setDisruptionShowFullPlan(false);
        setDisruptionWhatIf(BASELINE_DISRUPTION_WHAT_IF);
      } else {
        setWhatIf(preset.state);
      }
      replaceScenarioQuery(preset.id);
    },
    [clearTimers, replaceScenarioQuery],
  );

  const simulateUrgentOrder = useCallback(() => {
    clearTimers();
    setWhatIf((current) => ({ ...current, includeUrgentOrder: true }));
    setShowFullPlan(false);
    setSimulationStep("event");
    timers.current = [
      setTimeout(() => setSimulationStep("impact"), 1200),
      setTimeout(() => setSimulationStep("decision"), 2400),
      setTimeout(() => setSimulationStep("complete"), 3600),
    ];
  }, [clearTimers]);

  const activateDisruption = useCallback(() => {
    clearTimers();
    setDisruptionShowFullPlan(false);
    setDisruptionStep("detected");
    timers.current = [
      setTimeout(() => setDisruptionStep("impact"), 1000),
      setTimeout(() => setDisruptionStep("evaluating"), 2200),
      setTimeout(() => setDisruptionStep("complete"), 3400),
    ];
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setWhatIf(BASELINE_WHAT_IF);
    setSimulationStep("idle");
    setShowFullPlan(false);
    setActivePresetId("baseline");
    setDisruptionStep("idle");
    setDisruptionShowFullPlan(false);
    setDisruptionWhatIf(BASELINE_DISRUPTION_WHAT_IF);
    replaceScenarioQuery("baseline");
  }, [clearTimers, replaceScenarioQuery]);

  return {
    locale,
    backHref: buildLocalePath("/", locale),
    activePresetId,
    isDisruptionScenario: activePresetId === "production-disruption",
    whatIf,
    setWhatIf,
    simulationStep,
    showFullPlan,
    setShowFullPlan,
    disruptionStep,
    disruptionShowFullPlan,
    setDisruptionShowFullPlan,
    disruptionWhatIf,
    setDisruptionWhatIf,
    baselineResult,
    scenarioResult,
    displayResult: isBaseline ? baselineResult : scenarioResult,
    isBaseline,
    preDisruptionResult,
    disruptedResult,
    ordersAtRisk,
    visibility: {
      showProgress: simulationStep !== "idle" && simulationStep !== "complete",
      showUrgentResult:
        whatIf.includeUrgentOrder &&
        simulationStep !== "event" &&
        simulationStep !== "impact" &&
        simulationStep !== "decision",
      showMainPanels:
        simulationStep !== "event" &&
        simulationStep !== "impact" &&
        simulationStep !== "decision" &&
        (!whatIf.includeUrgentOrder || showFullPlan),
      showTrigger:
        !whatIf.includeUrgentOrder &&
        (simulationStep === "idle" || simulationStep === "complete"),
    },
    actions: {
      applyPreset,
      simulateUrgentOrder,
      skipUrgentAnimation: () => {
        clearTimers();
        setSimulationStep("complete");
      },
      activateDisruption,
      skipDisruptionAnimation: () => {
        clearTimers();
        setDisruptionStep("complete");
      },
      resetDisruption: () => {
        clearTimers();
        setDisruptionStep("idle");
        setDisruptionShowFullPlan(false);
        setDisruptionWhatIf(BASELINE_DISRUPTION_WHAT_IF);
      },
      reset,
    },
  } as const;
}

export type ProductionSchedulingViewModel = ReturnType<
  typeof useProductionSchedulingViewModel
>;
