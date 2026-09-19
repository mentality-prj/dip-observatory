export type SimulationStep = "idle" | "event" | "impact" | "decision" | "complete";

export type DisruptionSimulationStep =
  | "idle"
  | "detected"
  | "impact"
  | "evaluating"
  | "complete";

export interface SimulationSequenceStep<TStep> {
  readonly afterMs: number;
  readonly value: TStep;
}

export const URGENT_ORDER_SEQUENCE = [
  { afterMs: 1200, value: "impact" },
  { afterMs: 2400, value: "decision" },
  { afterMs: 3600, value: "complete" },
] as const satisfies readonly SimulationSequenceStep<SimulationStep>[];

export const DISRUPTION_SEQUENCE = [
  { afterMs: 1000, value: "impact" },
  { afterMs: 2200, value: "evaluating" },
  { afterMs: 3400, value: "complete" },
] as const satisfies readonly SimulationSequenceStep<DisruptionSimulationStep>[];
