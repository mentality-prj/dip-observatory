"use client";

import { Button } from "@/design-system";

import type { ProductionSchedulingVM } from "../model/view-model";
import { DisruptionResults } from "./disruption-results";

export interface DisruptionScenarioViewProps {
  viewModel: Pick<
    ProductionSchedulingVM,
    | "disruptionStep"
    | "disruptionShowFullPlan"
    | "preDisruptionResult"
    | "disruptedResult"
    | "actions"
  >;
}

/**
 * Presentation boundary for the production-disruption scenario.
 *
 * It intentionally consumes a narrowed ViewModel slice: the view knows nothing
 * about routing, timers, or scheduling-engine execution. Those responsibilities
 * stay in the container/hooks layer.
 */
export function DisruptionScenarioView({
  viewModel,
}: DisruptionScenarioViewProps) {
  const {
    disruptionStep,
    disruptionShowFullPlan,
    preDisruptionResult,
    disruptedResult,
    actions,
  } = viewModel;

  if (disruptionStep === "idle") {
    return (
      <section data-testid="disruption-scenario-idle">
        <Button type="button" onClick={actions.activateDisruption}>
          Simulate disruption
        </Button>
      </section>
    );
  }

  if (disruptionStep !== "complete") {
    return (
      <section data-testid="disruption-scenario-progress" aria-live="polite">
        <p>{disruptionStep}</p>
        <Button type="button" onClick={actions.skipDisruptionAnimation}>
          Skip simulation
        </Button>
      </section>
    );
  }

  return (
    <section data-testid="disruption-scenario-complete">
      <DisruptionResults
        preResult={preDisruptionResult}
        disruptedResult={disruptedResult}
      />
      {!disruptionShowFullPlan ? (
        <Button type="button" variant="secondary" onClick={actions.resetDisruption}>
          Reset disruption
        </Button>
      ) : null}
    </section>
  );
}
