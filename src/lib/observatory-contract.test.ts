import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  DipObservatoryApiRunResponse,
  DipObservatoryApiScenario,
  ObservatoryAlternativeInput,
} from "@/lib/dip-contracts";
import {
  buildObservatoryBootstrapPayload,
  mapRunResponse,
} from "@/lib/observatory-adapter";
import { normalizeDipBaseUrl } from "@/lib/dip-url";
import {
  buildLocalePath,
  detectLocaleFromHeader,
  getLocaleMetadata,
  getObservatoryCopy,
  isSupportedLocale,
} from "@/lib/observatory-i18n";
import {
  buildComparisonDeltas,
  buildMetricChips,
  buildStateSpaceTrajectories,
  buildTimelinePoints,
} from "@/lib/observatory-derive";
import { useObservatoryStore } from "@/stores/observatory-store";

const initialStoreState = useObservatoryStore.getState();

test("normalizeDipBaseUrl accepts scheme-less hosts", () => {
  assert.equal(
    normalizeDipBaseUrl(
      "dzvin-intelligence-platform-production.up.railway.app",
    ),
    "https://dzvin-intelligence-platform-production.up.railway.app",
  );
  assert.equal(normalizeDipBaseUrl("127.0.0.1:8000"), "http://127.0.0.1:8000");
  assert.equal(
    normalizeDipBaseUrl("https://dip.example.com/"),
    "https://dip.example.com",
  );
});

test("locale helpers support route-based localization", () => {
  assert.equal(detectLocaleFromHeader("pl-PL,pl;q=0.9,en;q=0.8"), "pl");
  assert.equal(detectLocaleFromHeader("uk-UA,uk;q=0.9,en;q=0.8"), "uk");
  assert.equal(detectLocaleFromHeader("de-DE,de;q=0.9"), "en");
  assert.equal(buildLocalePath("/en", "uk"), "/uk");
  assert.equal(buildLocalePath("/uk/research", "pl"), "/pl/research");
  assert.equal(buildLocalePath("/", "en"), "/en");
  assert.equal(isSupportedLocale("uk"), true);
  assert.equal(isSupportedLocale("de"), false);
  assert.equal(
    getLocaleMetadata("pl").title,
    "DIP Observatory | Polski interfejs",
  );
});

const scenarioFixtures: DipObservatoryApiScenario[] = [
  {
    id: "hr_workforce_stability",
    name: "HR Workforce Stability",
    description: "Retention pressure and intervention choices.",
    domain: "HR",
    model_id: "hr_retention_v1",
    dataset_id: "hr_signal_demo",
    state_axes: [
      { key: "pressure", label: "Attrition Pressure" },
      { key: "readiness", label: "Support Readiness" },
    ],
    fields: [
      {
        name: "burnout_index",
        label: "Burnout Index",
        type: "number",
        default_value: 8,
        required: true,
        hint: "Observed burnout intensity.",
        min_value: 0,
        max_value: 10,
        step: 0.1,
      },
      {
        name: "manager_support",
        label: "Manager Support",
        type: "number",
        default_value: 4,
        required: true,
        hint: "Availability of active support.",
        min_value: 0,
        max_value: 10,
        step: 0.1,
      },
    ],
    presets: [
      {
        id: "baseline",
        label: "Escalation Queue",
        description: "High strain and weak support.",
        entity_id: "hr-baseline",
        features: { burnout_index: 8, manager_support: 4 },
      },
      {
        id: "challenger",
        label: "Support Sprint",
        description: "Focused support intervention.",
        entity_id: "hr-support",
        features: { burnout_index: 6, manager_support: 7 },
      },
    ],
  },
  {
    id: "resource_allocation_control",
    name: "Resource Allocation Control",
    description: "Resource utilization and backlog balancing.",
    domain: "Resource Allocation",
    model_id: "resource_allocation_v1",
    dataset_id: "resource_allocation_demo",
    state_axes: [
      { key: "pressure", label: "Demand Pressure" },
      { key: "readiness", label: "Delivery Readiness" },
    ],
    fields: [
      {
        name: "utilization_rate",
        label: "Utilization Rate",
        type: "number",
        default_value: 88,
        required: true,
        hint: "Current team utilization.",
        min_value: 0,
        max_value: 100,
        step: 1,
      },
      {
        name: "skill_alignment",
        label: "Skill Alignment",
        type: "number",
        default_value: 54,
        required: true,
        hint: "Capability match.",
        min_value: 0,
        max_value: 100,
        step: 1,
      },
    ],
    presets: [
      {
        id: "baseline",
        label: "Capacity Crunch",
        description: "Utilization is saturated.",
        entity_id: "resource-baseline",
        features: { utilization_rate: 88, skill_alignment: 54 },
      },
      {
        id: "challenger",
        label: "Cross-trained Lane",
        description: "Capacity rebalanced.",
        entity_id: "resource-alt",
        features: { utilization_rate: 77, skill_alignment: 74 },
      },
    ],
  },
  {
    id: "research_portfolio_navigation",
    name: "Research Portfolio Navigation",
    description: "Evidence maturity and uncertainty.",
    domain: "Research",
    model_id: "research_portfolio_v1",
    dataset_id: "research_portfolio_demo",
    state_axes: [
      { key: "pressure", label: "Uncertainty Pressure" },
      { key: "readiness", label: "Evidence Readiness" },
    ],
    fields: [
      {
        name: "novelty_risk",
        label: "Novelty Risk",
        type: "number",
        default_value: 72,
        required: true,
        hint: "Exploration risk.",
        min_value: 0,
        max_value: 100,
        step: 1,
      },
      {
        name: "evidence_readiness",
        label: "Evidence Readiness",
        type: "number",
        default_value: 38,
        required: true,
        hint: "Current empirical grounding.",
        min_value: 0,
        max_value: 100,
        step: 1,
      },
    ],
    presets: [
      {
        id: "baseline",
        label: "Exploration Shock",
        description: "High novelty with low evidence maturity.",
        entity_id: "research-baseline",
        features: { novelty_risk: 72, evidence_readiness: 38 },
      },
      {
        id: "challenger",
        label: "Focused Validation",
        description: "Narrower validation path.",
        entity_id: "research-alt",
        features: { novelty_risk: 58, evidence_readiness: 62 },
      },
    ],
  },
  {
    id: "supply_chain_resilience",
    name: "Supply Chain Resilience",
    description: "Disruption pressure and recovery readiness.",
    domain: "Supply Chain",
    model_id: "supply_chain_resilience_v1",
    dataset_id: "supply_chain_demo",
    state_axes: [
      { key: "pressure", label: "Disruption Pressure" },
      { key: "readiness", label: "Recovery Readiness" },
    ],
    fields: [
      {
        name: "supplier_concentration",
        label: "Supplier Concentration",
        type: "number",
        default_value: 82,
        required: true,
        hint: "Exposure to few suppliers.",
        min_value: 0,
        max_value: 100,
        step: 1,
      },
      {
        name: "recovery_readiness",
        label: "Recovery Readiness",
        type: "number",
        default_value: 41,
        required: true,
        hint: "Ability to recover service.",
        min_value: 0,
        max_value: 100,
        step: 1,
      },
    ],
    presets: [
      {
        id: "baseline",
        label: "Fragile Lane",
        description: "High concentration and unstable lead times.",
        entity_id: "supply-baseline",
        features: { supplier_concentration: 82, recovery_readiness: 41 },
      },
      {
        id: "challenger",
        label: "Buffered Diversification",
        description: "Buffer stock and diversification.",
        entity_id: "supply-alt",
        features: { supplier_concentration: 61, recovery_readiness: 63 },
      },
    ],
  },
  {
    id: "operational_risk_containment",
    name: "Operational Risk Containment",
    description: "Exposure, coverage, and containment choices.",
    domain: "Risk Management",
    model_id: "risk_management_v1",
    dataset_id: "risk_management_demo",
    state_axes: [
      { key: "pressure", label: "Threat Pressure" },
      { key: "readiness", label: "Control Readiness" },
    ],
    fields: [
      {
        name: "threat_exposure",
        label: "Threat Exposure",
        type: "number",
        default_value: 77,
        required: true,
        hint: "Active threat exposure.",
        min_value: 0,
        max_value: 100,
        step: 1,
      },
      {
        name: "control_coverage",
        label: "Control Coverage",
        type: "number",
        default_value: 48,
        required: true,
        hint: "Coverage over exposed surface.",
        min_value: 0,
        max_value: 100,
        step: 1,
      },
    ],
    presets: [
      {
        id: "baseline",
        label: "Escalating Exposure",
        description: "Threat pressure is high.",
        entity_id: "risk-baseline",
        features: { threat_exposure: 77, control_coverage: 48 },
      },
      {
        id: "challenger",
        label: "Containment Wave",
        description: "Coverage and readiness improve.",
        entity_id: "risk-alt",
        features: { threat_exposure: 61, control_coverage: 72 },
      },
    ],
  },
];

function createRunResponse(
  scenario: DipObservatoryApiScenario,
  alternatives: Array<{
    id: string;
    label: string;
    entity_id?: string | null;
    features: Record<string, string | number | boolean>;
  }>,
): DipObservatoryApiRunResponse {
  const [xAxis, yAxis] = scenario.state_axes;

  return {
    scenario,
    executed_at: "2026-08-14T12:00:00.000Z",
    version: "1.0",
    warnings: [],
    results: alternatives.map((alternative, index) => {
      const prediction = Number((0.66 - index * 0.12).toFixed(2));
      const risk = Number((0.54 - index * 0.1).toFixed(2));
      const confidence = Number((0.88 - index * 0.08).toFixed(2));
      const uncertainty = Number((0.12 + index * 0.06).toFixed(2));
      const systemStability = Number((0.7 + index * 0.06).toFixed(2));
      const propagationRisk = Number((0.58 - index * 0.08).toFixed(2));
      const currentValues = {
        [xAxis?.key ?? "pressure"]: Number((0.68 - index * 0.1).toFixed(2)),
        [yAxis?.key ?? "readiness"]: Number((0.42 + index * 0.12).toFixed(2)),
      };
      const predictedValues = {
        [xAxis?.key ?? "pressure"]: Number((0.58 - index * 0.1).toFixed(2)),
        [yAxis?.key ?? "readiness"]: Number((0.57 + index * 0.1).toFixed(2)),
      };

      return {
        id: alternative.id,
        label: alternative.label,
        entity_id: alternative.entity_id ?? null,
        input_features: alternative.features,
        prediction,
        decision: index === 0 ? "primary_action" : "secondary_action",
        matched_rule: index === 0 ? "rule_primary" : "rule_secondary",
        confidence,
        uncertainty: {
          score: uncertainty,
          label: uncertainty >= 0.22 ? "medium" : "low",
          interval_low: Number((risk - 0.08).toFixed(2)),
          interval_high: Number((risk + 0.08).toFixed(2)),
        },
        risk,
        system_stability: systemStability,
        propagation_risk: propagationRisk,
        current_state: {
          label: "Current state",
          summary: `${xAxis?.label ?? "Pressure"} ${Math.round(currentValues[xAxis?.key ?? "pressure"] * 100)}% · ${yAxis?.label ?? "Readiness"} ${Math.round(currentValues[yAxis?.key ?? "readiness"] * 100)}%`,
          values: currentValues,
        },
        predicted_state: {
          label: "Predicted state",
          summary: `${xAxis?.label ?? "Pressure"} ${Math.round(predictedValues[xAxis?.key ?? "pressure"] * 100)}% · ${yAxis?.label ?? "Readiness"} ${Math.round(predictedValues[yAxis?.key ?? "readiness"] * 100)}%`,
          values: predictedValues,
        },
        feasible_state_space: {
          [xAxis?.key ?? "pressure"]: { min: 0.35, max: 0.82 },
          [yAxis?.key ?? "readiness"]: { min: 0.28, max: 0.86 },
        },
        trajectories: [
          {
            id: `${alternative.id}-current`,
            label: "Current state",
            kind: "current",
            state: {
              label: "Current state",
              summary: "Observed system position before action.",
              values: currentValues,
            },
            risk: prediction,
            confidence,
            uncertainty,
            decision: null,
            outcome: "Observed system position before action.",
          },
          {
            id: `${alternative.id}-predicted`,
            label: "Predicted state",
            kind: "predicted",
            state: {
              label: "Predicted state",
              summary: "Expected state after the selected decision.",
              values: predictedValues,
            },
            risk,
            confidence,
            uncertainty,
            decision: index === 0 ? "primary_action" : "secondary_action",
            outcome: "Projected decision outcome.",
          },
          {
            id: `${alternative.id}-optimistic`,
            label: "Optimistic branch",
            kind: "optimistic",
            state: {
              label: "Optimistic branch",
              summary: "Best-case continuation branch.",
              values: {
                [xAxis?.key ?? "pressure"]: Number(
                  (predictedValues[xAxis?.key ?? "pressure"] - 0.08).toFixed(2),
                ),
                [yAxis?.key ?? "readiness"]: Number(
                  (predictedValues[yAxis?.key ?? "readiness"] + 0.06).toFixed(
                    2,
                  ),
                ),
              },
            },
            risk: Number((risk - 0.08).toFixed(2)),
            confidence: Number((confidence + 0.04).toFixed(2)),
            uncertainty: Number((uncertainty - 0.02).toFixed(2)),
            decision: index === 0 ? "primary_action" : "secondary_action",
            outcome: "Faster stabilization branch.",
          },
          {
            id: `${alternative.id}-conservative`,
            label: "Conservative branch",
            kind: "conservative",
            state: {
              label: "Conservative branch",
              summary: "Residual risk remains elevated.",
              values: {
                [xAxis?.key ?? "pressure"]: Number(
                  (predictedValues[xAxis?.key ?? "pressure"] + 0.09).toFixed(2),
                ),
                [yAxis?.key ?? "readiness"]: Number(
                  (predictedValues[yAxis?.key ?? "readiness"] - 0.07).toFixed(
                    2,
                  ),
                ),
              },
            },
            risk: Number((risk + 0.09).toFixed(2)),
            confidence: Number((confidence - 0.05).toFixed(2)),
            uncertainty: Number((uncertainty + 0.03).toFixed(2)),
            decision: index === 0 ? "primary_action" : "secondary_action",
            outcome: "Adverse continuation branch.",
          },
        ],
        alternative_decisions: [
          {
            decision: index === 0 ? "primary_action" : "secondary_action",
            outcome: "Selected decision path.",
            risk,
            confidence,
            rationale: "Preferred scenario decision.",
            rank: 1,
            selected: true,
          },
          {
            decision: "counterfactual_path",
            outcome: "Counterfactual lower-confidence branch.",
            risk: Number((risk + 0.06).toFixed(2)),
            confidence: Number((confidence - 0.08).toFixed(2)),
            rationale: "Alternative branch for comparison.",
            rank: 2,
            selected: false,
          },
        ],
        rule_traces: [
          {
            rule_name: index === 0 ? "rule_primary" : "rule_secondary",
            matched: true,
            conditions_total: 1,
            conditions_matched: 1,
            evidence: [
              {
                feature: Object.keys(alternative.features)[0] ?? "signal",
                operator: ">=",
                threshold: 1,
                actual_value: Object.values(alternative.features)[0] ?? 1,
                passed: true,
              },
            ],
          },
        ],
        explanation: [
          `decision=${index === 0 ? "primary_action" : "secondary_action"}`,
          `risk=${risk}`,
          `scenario=${scenario.id}`,
        ],
        execution_time_ms: 1.25,
      };
    }),
  };
}

function mapAlternatives(
  scenario: ReturnType<
    typeof buildObservatoryBootstrapPayload
  >["scenarios"][number],
) {
  return scenario.presets.slice(0, 2).map(
    (preset) =>
      ({
        id: preset.id,
        label: preset.label,
        entityId: preset.entityId,
        features: preset.features,
      }) satisfies ObservatoryAlternativeInput,
  );
}

test("bootstrap selects deterministic demo scenario and locks store interactions", () => {
  useObservatoryStore.setState(initialStoreState);

  const payload = buildObservatoryBootstrapPayload({
    connection: {
      configured: true,
      healthy: true,
      baseUrl: "http://localhost:8000",
      scenarioCatalogAvailable: true,
      runSurfaceAvailable: true,
    },
    apiScenarios: scenarioFixtures,
    demoConfig: {
      enabledRaw: "true",
      scenarioIdRaw: "research_portfolio_navigation",
      labelRaw: "Boardroom Demo",
    },
  });

  assert.equal(payload.scenarios.length, 5);
  assert.equal(payload.demoMode.enabled, true);
  assert.equal(payload.demoMode.label, "Boardroom Demo");
  assert.equal(payload.selectedScenarioId, "research_portfolio_navigation");
  assert.equal(payload.demoMode.lockScenario, true);
  assert.equal(payload.demoMode.lockAlternatives, true);

  useObservatoryStore.getState().hydrate(payload);

  assert.equal(
    useObservatoryStore.getState().selectedScenarioId,
    "research_portfolio_navigation",
  );

  useObservatoryStore.getState().selectScenario("hr_workforce_stability");

  assert.equal(
    useObservatoryStore.getState().selectedScenarioId,
    "research_portfolio_navigation",
  );

  const initialFeatures = structuredClone(
    useObservatoryStore.getState().alternatives[0]?.features ?? {},
  );
  useObservatoryStore
    .getState()
    .updateFeature(
      useObservatoryStore.getState().alternatives[0]?.id ?? "baseline",
      "novelty_risk",
      99,
    );
  assert.deepEqual(
    useObservatoryStore.getState().alternatives[0]?.features,
    initialFeatures,
  );
});

test("all observatory scenarios map through the same contract and derive path", () => {
  useObservatoryStore.setState(initialStoreState);
  const copy = getObservatoryCopy("en");

  const payload = buildObservatoryBootstrapPayload({
    connection: {
      configured: true,
      healthy: true,
      baseUrl: "http://localhost:8000",
      scenarioCatalogAvailable: true,
      runSurfaceAvailable: true,
    },
    apiScenarios: scenarioFixtures,
  });

  assert.equal(payload.scenarios.length, 5);

  for (const scenario of payload.scenarios) {
    const sourceScenario = scenarioFixtures.find(
      (item) => item.id === scenario.id,
    );
    if (!sourceScenario) {
      throw new Error(`Missing fixture for scenario ${scenario.id}`);
    }

    const alternatives = mapAlternatives(scenario);
    const response = mapRunResponse(
      createRunResponse(
        sourceScenario,
        alternatives.map((alternative) => ({
          id: alternative.id,
          label: alternative.label,
          entity_id: alternative.entityId,
          features: alternative.features,
        })),
      ),
    );

    assert.equal(response.scenario.id, scenario.id);
    assert.equal(response.results.length, alternatives.length);

    const trajectories = buildStateSpaceTrajectories({
      scenario,
      runResponse: response,
      copy,
    });

    assert.equal(trajectories.length, alternatives.length);

    trajectories.forEach((trajectory, index) => {
      const result = response.results[index];
      assert.equal(trajectory.metrics.decision, result?.decision);
      assert.equal(trajectory.metrics.risk, result?.risk);
      assert.equal(trajectory.metrics.systemStability, result?.systemStability);
      assert.equal(trajectory.metrics.propagationRisk, result?.propagationRisk);
      assert.equal(trajectory.metrics.uncertainty, result?.uncertainty.score);
      assert.equal(
        trajectory.current.x,
        result?.currentState.values[scenario.stateAxes[0]?.key ?? "pressure"],
      );
      assert.equal(
        trajectory.predicted.y,
        result?.predictedState.values[
          scenario.stateAxes[1]?.key ?? "readiness"
        ],
      );
    });

    const chips = buildMetricChips(trajectories[0] ?? null, copy);
    assert.ok(chips.every((chip) => chip.source === "api"));
    assert.equal(buildComparisonDeltas(trajectories, copy).length, 4);
    assert.equal(buildTimelinePoints(trajectories[0] ?? null, copy).length, 4);
  }
});
