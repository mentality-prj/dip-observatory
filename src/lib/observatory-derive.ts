import type {
  DipConditionEvidence,
  ObservatoryAlternativeDecision,
  ObservatoryRunResponse,
  ObservatoryRunResult,
  ObservatoryScenario,
} from "@/lib/dip-contracts";
import type { ObservatoryCopy } from "@/lib/observatory-i18n";

export type Tone = "cyan" | "emerald" | "amber" | "rose";

export type MetricChip = {
  label: string;
  value: string;
  tone: Tone;
  source: "api" | "comparison";
  detail: string;
};

export type ComparisonDelta = {
  label: string;
  value: string;
  tone: Tone;
  detail: string;
};

export type TimelinePoint = {
  label: string;
  score: number;
  detail: string;
  tone: Tone;
};

export type StateSpaceTrajectory = {
  id: string;
  label: string;
  color: string;
  axes: {
    xKey: string;
    xLabel: string;
    yKey: string;
    yLabel: string;
  };
  current: {
    x: number;
    y: number;
    label: string;
    detail: string;
    risk: number;
  };
  predicted: {
    x: number;
    y: number;
    label: string;
    detail: string;
    risk: number;
  };
  futures: Array<{
    id: string;
    x: number;
    y: number;
    label: string;
    detail: string;
    risk: number;
    kind: "optimistic" | "conservative";
  }>;
  uncertaintyRadius: number;
  metrics: {
    decision: string;
    confidence: number;
    uncertainty: number;
    uncertaintyLabel: string;
    risk: number;
    systemStability: number;
    propagationRisk: number;
    currentState: string;
    predictedState: string;
    matchedRule: string;
  };
  alternativeDecisions: ObservatoryAlternativeDecision[];
  explanationBullets: string[];
  evidenceBullets: string[];
  executionTimeMs: number;
};

const palette = ["#67e8f9", "#fb923c", "#4ade80", "#f472b6"];

function clamp(value: number, low = 0, high = 1) {
  return Math.min(high, Math.max(low, value));
}

function formatPercent(value: number) {
  return `${Math.round(clamp(value) * 100)}%`;
}

function formatSignedPercent(value: number) {
  const rounded = Math.round(value * 100);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
}

function formatScalar(
  value: DipConditionEvidence["threshold"] | null | undefined,
) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
  }
  if (typeof value === "string") return value;
  return "n/a";
}

function capitalize(value: string) {
  if (value.length === 0) return value;
  return `${value[0]?.toUpperCase()}${value.slice(1)}`;
}

function getDecisionTone(decision: string): Tone {
  const normalized = decision.toLowerCase();
  if (
    normalized.includes("deny") ||
    normalized.includes("critical") ||
    normalized.includes("reject") ||
    normalized.includes("high") ||
    normalized.includes("contain") ||
    normalized.includes("intervene")
  ) {
    return "rose";
  }
  if (
    normalized.includes("review") ||
    normalized.includes("warn") ||
    normalized.includes("medium") ||
    normalized.includes("rebalance")
  ) {
    return "amber";
  }
  if (
    normalized.includes("allow") ||
    normalized.includes("approve") ||
    normalized.includes("low") ||
    normalized.includes("advance")
  ) {
    return "emerald";
  }
  return "cyan";
}

function getTrajectoryPoint(
  result: ObservatoryRunResult,
  kind: "current" | "predicted" | "optimistic" | "conservative",
) {
  return (
    result.trajectories.find((trajectory) => trajectory.kind === kind) ?? null
  );
}

function buildEvidenceBullets(
  result: ObservatoryRunResult,
  copy: ObservatoryCopy,
) {
  return (result.ruleTraces ?? [])
    .flatMap((trace) =>
      (trace.evidence ?? []).map((evidence) => {
        const status = evidence.passed
          ? copy.evidence.pass
          : copy.evidence.fail;
        return `${trace.rule_name}: ${evidence.feature} ${evidence.operator} ${formatScalar(
          evidence.threshold,
        )} | ${copy.evidence.observed} ${formatScalar(evidence.actual_value)} | ${status}`;
      }),
    )
    .slice(0, 6);
}

export function buildStateSpaceTrajectories(params: {
  scenario: ObservatoryScenario | null;
  runResponse: ObservatoryRunResponse | null;
  copy: ObservatoryCopy;
}) {
  if (!params.scenario || !params.runResponse) {
    return [] satisfies StateSpaceTrajectory[];
  }

  const xAxis = params.scenario.stateAxes[0] ?? {
    key: "pressure",
    label: params.copy.chart.axisFallbackX,
  };
  const yAxis = params.scenario.stateAxes[1] ?? {
    key: "readiness",
    label: params.copy.chart.axisFallbackY,
  };

  return params.runResponse.results.map((result, index) => {
    const currentNode = getTrajectoryPoint(result, "current");
    const predictedNode = getTrajectoryPoint(result, "predicted");
    const optimisticNode = getTrajectoryPoint(result, "optimistic");
    const conservativeNode = getTrajectoryPoint(result, "conservative");

    return {
      id: result.id,
      label: result.label,
      color: palette[index % palette.length],
      axes: {
        xKey: xAxis.key,
        xLabel: xAxis.label,
        yKey: yAxis.key,
        yLabel: yAxis.label,
      },
      current: {
        x: clamp(
          currentNode?.state.values[xAxis.key] ??
            result.currentState.values[xAxis.key] ??
            0,
        ),
        y: clamp(
          currentNode?.state.values[yAxis.key] ??
            result.currentState.values[yAxis.key] ??
            0,
        ),
        label: currentNode?.label ?? result.currentState.label,
        detail: currentNode?.state.summary ?? result.currentState.summary,
        risk: currentNode?.risk ?? result.prediction,
      },
      predicted: {
        x: clamp(
          predictedNode?.state.values[xAxis.key] ??
            result.predictedState.values[xAxis.key] ??
            0,
        ),
        y: clamp(
          predictedNode?.state.values[yAxis.key] ??
            result.predictedState.values[yAxis.key] ??
            0,
        ),
        label: predictedNode?.label ?? result.predictedState.label,
        detail: predictedNode?.state.summary ?? result.predictedState.summary,
        risk: predictedNode?.risk ?? result.risk,
      },
      futures: [optimisticNode, conservativeNode]
        .filter(
          (
            node,
          ): node is NonNullable<typeof optimisticNode> & {
            kind: "optimistic" | "conservative";
          } =>
            node !== null &&
            (node.kind === "optimistic" || node.kind === "conservative"),
        )
        .map((node) => ({
          id: `${result.id}-${node.kind}`,
          x: clamp(node.state.values[xAxis.key] ?? 0),
          y: clamp(node.state.values[yAxis.key] ?? 0),
          label: node.label,
          detail: node.state.summary,
          risk: node.risk,
          kind: node.kind,
        })),
      uncertaintyRadius: 0.06 + result.uncertainty.score * 0.12,
      metrics: {
        decision: result.decision,
        confidence: result.confidence,
        uncertainty: result.uncertainty.score,
        uncertaintyLabel: capitalize(result.uncertainty.label),
        risk: result.risk,
        systemStability: result.systemStability,
        propagationRisk: result.propagationRisk,
        currentState: result.currentState.summary,
        predictedState: result.predictedState.summary,
        matchedRule: result.matchedRule,
      },
      alternativeDecisions: result.alternativeDecisions,
      explanationBullets: result.explanation.slice(0, 8),
      evidenceBullets: buildEvidenceBullets(result, params.copy),
      executionTimeMs: result.executionTimeMs,
    } satisfies StateSpaceTrajectory;
  });
}

export function buildMetricChips(
  trajectory: StateSpaceTrajectory | null,
  copy: ObservatoryCopy,
): MetricChip[] {
  if (!trajectory) return [];

  return [
    {
      label: copy.metrics.decision,
      value: trajectory.metrics.decision,
      tone: getDecisionTone(trajectory.metrics.decision),
      source: "api",
      detail: copy.metrics.decisionDetail,
    },
    {
      label: copy.metrics.confidence,
      value: formatPercent(trajectory.metrics.confidence),
      tone:
        trajectory.metrics.confidence >= 0.75
          ? "emerald"
          : trajectory.metrics.confidence >= 0.5
            ? "amber"
            : "rose",
      source: "api",
      detail: copy.metrics.confidenceDetail,
    },
    {
      label: copy.metrics.uncertainty,
      value: `${trajectory.metrics.uncertaintyLabel} (${formatPercent(trajectory.metrics.uncertainty)})`,
      tone:
        trajectory.metrics.uncertainty >= 0.45
          ? "rose"
          : trajectory.metrics.uncertainty >= 0.22
            ? "amber"
            : "emerald",
      source: "api",
      detail: copy.metrics.uncertaintyDetail,
    },
    {
      label: copy.metrics.risk,
      value: formatPercent(trajectory.metrics.risk),
      tone:
        trajectory.metrics.risk >= 0.7
          ? "rose"
          : trajectory.metrics.risk >= 0.45
            ? "amber"
            : "emerald",
      source: "api",
      detail: copy.metrics.riskDetail,
    },
    {
      label: copy.metrics.systemStability,
      value: formatPercent(trajectory.metrics.systemStability),
      tone:
        trajectory.metrics.systemStability >= 0.7
          ? "emerald"
          : trajectory.metrics.systemStability >= 0.45
            ? "amber"
            : "rose",
      source: "api",
      detail: copy.metrics.systemStabilityDetail,
    },
    {
      label: copy.metrics.propagationRisk,
      value: formatPercent(trajectory.metrics.propagationRisk),
      tone:
        trajectory.metrics.propagationRisk >= 0.7
          ? "rose"
          : trajectory.metrics.propagationRisk >= 0.45
            ? "amber"
            : "emerald",
      source: "api",
      detail: copy.metrics.propagationRiskDetail,
    },
  ];
}

export function buildComparisonDeltas(
  trajectories: StateSpaceTrajectory[],
  copy: ObservatoryCopy,
) {
  if (trajectories.length < 2) return [];

  const [baseline, challenger] = trajectories;
  const riskDelta = challenger.metrics.risk - baseline.metrics.risk;
  const confidenceDelta =
    challenger.metrics.confidence - baseline.metrics.confidence;
  const stabilityDelta =
    challenger.metrics.systemStability - baseline.metrics.systemStability;

  return [
    {
      label: copy.metrics.riskDelta,
      value: formatSignedPercent(riskDelta),
      tone: riskDelta > 0.08 ? "rose" : riskDelta < -0.08 ? "emerald" : "amber",
      detail: `${challenger.label} / ${baseline.label} ${copy.metrics.versusDetail}`,
    },
    {
      label: copy.metrics.confidenceDelta,
      value: formatSignedPercent(confidenceDelta),
      tone:
        confidenceDelta > 0.05
          ? "emerald"
          : confidenceDelta < -0.05
            ? "rose"
            : "amber",
      detail: `${challenger.label} / ${baseline.label} ${copy.metrics.versusDetail}`,
    },
    {
      label: copy.metrics.stabilityDelta,
      value: formatSignedPercent(stabilityDelta),
      tone:
        stabilityDelta > 0.05
          ? "emerald"
          : stabilityDelta < -0.05
            ? "rose"
            : "amber",
      detail: copy.metrics.stabilityDeltaDetail,
    },
    {
      label: copy.metrics.decisionShift,
      value:
        baseline.metrics.decision === challenger.metrics.decision
          ? baseline.metrics.decision
          : `${baseline.metrics.decision} -> ${challenger.metrics.decision}`,
      tone:
        baseline.metrics.decision === challenger.metrics.decision
          ? "cyan"
          : getDecisionTone(challenger.metrics.decision),
      detail: copy.metrics.decisionShiftDetail,
    },
  ] satisfies ComparisonDelta[];
}

export function buildTimelinePoints(
  trajectory: StateSpaceTrajectory | null,
  copy: ObservatoryCopy,
): TimelinePoint[] {
  if (!trajectory) return [];

  return [
    {
      label: copy.timeline.currentState,
      score: trajectory.current.risk,
      detail: trajectory.current.detail,
      tone: "cyan",
    },
    {
      label: copy.timeline.predictedState,
      score: trajectory.predicted.risk,
      detail: trajectory.predicted.detail,
      tone: getDecisionTone(trajectory.metrics.decision),
    },
    {
      label: copy.timeline.optimisticBranch,
      score: trajectory.futures[0]?.risk ?? trajectory.metrics.risk,
      detail: trajectory.futures[0]?.detail ?? copy.timeline.noBranchAvailable,
      tone: "emerald",
    },
    {
      label: copy.timeline.conservativeBranch,
      score: trajectory.futures[1]?.risk ?? trajectory.metrics.risk,
      detail: trajectory.futures[1]?.detail ?? copy.timeline.noBranchAvailable,
      tone: "rose",
    },
  ];
}
