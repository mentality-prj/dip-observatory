"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import {
  BASELINE_DISRUPTION_WHAT_IF,
  type DisruptionWhatIfState,
} from "@/production-scheduling/data/production-disruption-scenario";
import {
  BASELINE_WHAT_IF,
  SCENARIO_PRESETS,
  type WhatIfState,
} from "@/production-scheduling/lib/what-if";
import { useSchedulingResults } from "./use-scheduling-results";
import { useTimeoutSequence } from "./use-timeout-sequence";

export type SimulationStep = "idle" | "event" | "impact" | "decision" | "complete";
export type DisruptionSimulationStep = "idle" | "detected" | "impact" | "evaluating" | "complete";

const URGENT_ORDER_SEQUENCE = [
  { afterMs: 1200, value: "impact" },
  { afterMs: 2400, value: "decision" },
  { afterMs: 3600, value: "complete" },
] as const satisfies readonly { afterMs: number; value: SimulationStep }[];

const DISRUPTION_SEQUENCE = [
  { afterMs: 1000, value: "impact" },
  { afterMs: 2200, value: "evaluating" },
  { afterMs: 3400, value: "complete" },
] as const satisfies readonly { afterMs: number; value: DisruptionSimulationStep }[];

export function useProductionSchedulingViewModel(locale: Locale) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activePresetId, setActivePresetId] = useState(() => searchParams.get("scenario") ?? "baseline");
  const [whatIf, setWhatIf] = useState<WhatIfState>(() => {
    const id = searchParams.get("scenario");
    if (id && id !== "production-disruption") {
      return SCENARIO_PRESETS.find((preset) => preset.id === id)?.state ?? BASELINE_WHAT_IF;
    }
    return BASELINE_WHAT_IF;
  });
  const [simulationStep, setSimulationStep] = useState<SimulationStep>("idle");
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [disruptionStep, setDisruptionStep] = useState<DisruptionSimulationStep>(() =>
    searchParams.get("scenario") === "production-disruption" ? "complete" : "idle",
  );
  const [disruptionShowFullPlan, setDisruptionShowFullPlan] = useState(
    () => searchParams.get("scenario") === "production-disruption",
  );
  const [disruptionWhatIf, setDisruptionWhatIf] = useState<DisruptionWhatIfState>(
    BASELINE_DISRUPTION_WHAT_IF,
  );

  const { start: startUrgentSequence, cancel: cancelUrgentSequence } =
    useTimeoutSequence<SimulationStep>(setSimulationStep);
  const { start: startDisruptionSequence, cancel: cancelDisruptionSequence } =
    useTimeoutSequence<DisruptionSimulationStep>(setDisruptionStep);
  const results = useSchedulingResults(whatIf, disruptionWhatIf);

  const cancelAnimations = useCallback(() => {
    cancelUrgentSequence();
    cancelDisruptionSequence();
  }, [cancelDisruptionSequence, cancelUrgentSequence]);

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
      cancelAnimations();
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
    [cancelAnimations, replaceScenarioQuery],
  );

  const simulateUrgentOrder = useCallback(() => {
    cancelAnimations();
    setWhatIf((current) => ({ ...current, includeUrgentOrder: true }));
    setShowFullPlan(false);
    setSimulationStep("event");
    startUrgentSequence(URGENT_ORDER_SEQUENCE);
  }, [cancelAnimations, startUrgentSequence]);

  const activateDisruption = useCallback(() => {
    cancelAnimations();
    setDisruptionShowFullPlan(false);
    setDisruptionStep("detected");
    startDisruptionSequence(DISRUPTION_SEQUENCE);
  }, [cancelAnimations, startDisruptionSequence]);

  const reset = useCallback(() => {
    cancelAnimations();
    setWhatIf(BASELINE_WHAT_IF);
    setSimulationStep("idle");
    setShowFullPlan(false);
    setActivePresetId("baseline");
    setDisruptionStep("idle");
    setDisruptionShowFullPlan(false);
    setDisruptionWhatIf(BASELINE_DISRUPTION_WHAT_IF);
    replaceScenarioQuery("baseline");
  }, [cancelAnimations, replaceScenarioQuery]);

  const isAnimating = simulationStep !== "idle" && simulationStep !== "complete";

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
    ...results,
    visibility: {
      showProgress: isAnimating,
      showUrgentResult: whatIf.includeUrgentOrder && !isAnimating,
      showMainPanels: !isAnimating && (!whatIf.includeUrgentOrder || showFullPlan),
      showTrigger: !whatIf.includeUrgentOrder && !isAnimating,
    },
    actions: {
      applyPreset,
      simulateUrgentOrder,
      skipUrgentAnimation: () => {
        cancelUrgentSequence();
        setSimulationStep("complete");
      },
      activateDisruption,
      skipDisruptionAnimation: () => {
        cancelDisruptionSequence();
        setDisruptionStep("complete");
      },
      resetDisruption: () => {
        cancelDisruptionSequence();
        setDisruptionStep("idle");
        setDisruptionShowFullPlan(false);
        setDisruptionWhatIf(BASELINE_DISRUPTION_WHAT_IF);
      },
      reset,
    },
  } as const;
}

export type ProductionSchedulingViewModel = ReturnType<typeof useProductionSchedulingViewModel>;
