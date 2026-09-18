import { useCallback, useEffect, useRef, useState } from "react";

import { BASELINE_DISRUPTION_WHAT_IF, type DisruptionWhatIfState } from "@/production-scheduling/data/production-disruption-scenario";

export type DisruptionSimulationStep =
  | "idle"
  | "detected"
  | "impact"
  | "evaluating"
  | "complete";

const STEP_DELAYS_MS = {
  impact: 1_000,
  evaluating: 2_200,
  complete: 3_400,
} as const;

export interface DisruptionSimulationController {
  step: DisruptionSimulationStep;
  showFullPlan: boolean;
  whatIf: DisruptionWhatIfState;
  activate: () => void;
  skip: () => void;
  revealFullPlan: () => void;
  reset: () => void;
  setWhatIf: React.Dispatch<React.SetStateAction<DisruptionWhatIfState>>;
}

export function useDisruptionSimulation(
  initiallyComplete = false,
): DisruptionSimulationController {
  const [step, setStep] = useState<DisruptionSimulationStep>(
    initiallyComplete ? "complete" : "idle",
  );
  const [showFullPlan, setShowFullPlan] = useState(initiallyComplete);
  const [whatIf, setWhatIf] = useState<DisruptionWhatIfState>(
    BASELINE_DISRUPTION_WHAT_IF,
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const activate = useCallback(() => {
    clearTimers();
    setShowFullPlan(false);
    setStep("detected");
    timers.current = [
      setTimeout(() => setStep("impact"), STEP_DELAYS_MS.impact),
      setTimeout(() => setStep("evaluating"), STEP_DELAYS_MS.evaluating),
      setTimeout(() => setStep("complete"), STEP_DELAYS_MS.complete),
    ];
  }, [clearTimers]);

  const skip = useCallback(() => {
    clearTimers();
    setStep("complete");
  }, [clearTimers]);

  const revealFullPlan = useCallback(() => setShowFullPlan(true), []);

  const reset = useCallback(() => {
    clearTimers();
    setStep("idle");
    setShowFullPlan(false);
    setWhatIf(BASELINE_DISRUPTION_WHAT_IF);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    step,
    showFullPlan,
    whatIf,
    activate,
    skip,
    revealFullPlan,
    reset,
    setWhatIf,
  };
}
