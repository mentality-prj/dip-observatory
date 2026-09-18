"use client";

import type { ProductionSchedulingVM } from "../model/view-model";
import { DisruptionResults } from "./disruption-results";

export interface DisruptionScenarioViewProps {
  viewModel: Pick<
    ProductionSchedulingVM,
    | "disruptionStep"
    | "disruptionShowFullPlan"
    | "preResult"
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
    preResult,
    disruptedResult,
    actions,
  } = viewModel;

  if (disruptionStep === "idle") {
    return (
      <section data-testid="disruption-scenario-idle">
        <button type="button" onClick={actions.activateDisruption}>
          Simulate disruption
        </button>
      </section>
    );
  }

  if (disruptionStep !== "complete") {
    return (
      <section data-testid="disruption-scenario-progress" aria-live="polite">
        <p>{disruptionStep}</p>
        <button type="button" onClick={actions.skipDisruptionAnimation}>
          Skip simulation
        </button>
      </section>
    );
  }

  return (
    <section data-testid="disruption-scenario-complete">
      <DisruptionResults
        preResult={preResult}
        disruptedResult={disruptedResult}
      />
      <div>
        {!disruptionShowFullPlan ? (
          <button
            type="button"
            onClick={() => viewModel.actions.resetDisruption()}
          >
            Reset disruption
          </button>
        ) : null}
      </div>
    </section>
  );
}
