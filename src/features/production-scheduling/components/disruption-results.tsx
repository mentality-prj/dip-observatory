import type { SchedulingDecisionResponse } from "@/production-scheduling/types";
import { DisruptionFinancialPanel } from "./disruption-financial-panel";
import { DisruptionScheduleDiff } from "./disruption-schedule-diff";

export interface DisruptionResultsProps {
  preResult: SchedulingDecisionResponse;
  disruptedResult: SchedulingDecisionResponse;
}

/**
 * Feature-level composition for the stable disruption result views.
 *
 * Keeps the workspace responsible for orchestration only and gives the
 * disruption flow a single public UI boundary as more result panels migrate
 * out of the legacy workspace.
 */
export function DisruptionResults({
  preResult,
  disruptedResult,
}: DisruptionResultsProps) {
  return (
    <div className="space-y-6" data-testid="disruption-results">
      <DisruptionFinancialPanel
        preResult={preResult}
        disruptedResult={disruptedResult}
      />
      <DisruptionScheduleDiff disruptedResult={disruptedResult} />
    </div>
  );
}
